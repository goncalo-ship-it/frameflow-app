// SmartInput — textarea universal com voz, upload de ficheiros e drag & drop
// Substitui qualquer <textarea> — mesma API, mais superpoderes
import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Paperclip, Sparkles, X, FileText, Loader2 } from 'lucide-react'
import { useStore } from '../../core/store.js'
import { fetchAPI, MODEL_FAST } from '../../core/api.js'
import { useI18n } from '../../core/i18n/index.js'
import styles from './SmartInput.module.css'

// ── Extracção de texto por tipo de ficheiro ──────────────────────────
async function extractTextFromFile(file) {
  const ext = file.name.split('.').pop().toLowerCase()
  const textTypes = ['txt', 'md', 'csv', 'eml', 'html', 'htm', 'json', 'xml', 'rtf', 'log']

  // Texto directo
  if (textTypes.includes(ext) || file.type.startsWith('text/')) {
    return await file.text()
  }

  // Word (.docx)
  if (ext === 'docx' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const mammoth = await import('mammoth')
    const buf = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer: buf })
    return result.value
  }

  // PDF — lê como base64 para enviar à API
  if (ext === 'pdf' || file.type === 'application/pdf') {
    return { isPdf: true, base64: await fileToBase64(file), name: file.name }
  }

  // Fallback: tenta ler como texto
  try {
    const text = await file.text()
    if (text && !text.includes('\x00')) return text // parece texto válido
  } catch { /* ignore */ }

  return null
}

function fileToBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.readAsDataURL(file)
  })
}

// ── Extracção inteligente via API (opcional) ─────────────────────────
async function smartExtract(rawText, context, apiKey) {
  if (!apiKey || !rawText) return rawText

  // Se o texto é curto, não vale a pena usar API
  if (typeof rawText === 'string' && rawText.length < 100) return rawText

  try {
    const textContent = typeof rawText === 'string' ? rawText : `[Conteúdo do ficheiro ${rawText.name}]`

    const messages = [{
      role: 'user',
      content: `Extrai e organiza a informação relevante deste conteúdo para preencher um campo de: "${context}".

Conteúdo:
---
${textContent}
---

Responde APENAS com o texto extraído e organizado, sem explicações. Se o conteúdo não for relevante para o campo, devolve o texto original limpo.`
    }]

    const body = {
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages,
    }

    // Se é PDF, usar document source
    if (typeof rawText === 'object' && rawText.isPdf) {
      messages[0].content = [
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: rawText.base64 } },
        { type: 'text', text: `Extrai e organiza a informação relevante deste PDF para preencher um campo de: "${context}". Responde APENAS com o texto extraído e organizado.` }
      ]
    }

    return await fetchAPI({
      apiKey,
      messages: body.messages,
      maxTokens: 512,
      model: MODEL_FAST,
      cache: true,
    })
  } catch {
    return typeof rawText === 'string' ? rawText : ''
  }
}

// ── Componente SmartInput ────────────────────────────────────────────
export function SmartInput({
  value,
  onChange,
  placeholder,
  rows = 3,
  className,
  disabled,
  context,        // descreve o campo (ex: "Notas da equipa técnica") — usado na extracção AI
  smartExtractEnabled = true,  // permite extracção inteligente via API
  onKeyDown,
  autoFocus,
  style,
  ...rest
}) {
  const apiKey = useStore(s => s.apiKey)
  const { speechLang } = useI18n()
  const [listening, setListening] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [processMsg, setProcessMsg] = useState('')
  const recognitionRef = useRef(null)
  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)

  // ── Speech Recognition ──
  const hasSpeech = typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition)

  const toggleListening = useCallback(() => {
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return

    const recognition = new SR()
    recognition.lang = speechLang
    recognition.continuous = true
    recognition.interimResults = true
    recognitionRef.current = recognition

    let finalTranscript = ''

    recognition.onresult = (event) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' '
        } else {
          interim = event.results[i][0].transcript
        }
      }
      const combined = (value || '') + finalTranscript + interim
      onChange({ target: { value: combined } })
    }

    recognition.onerror = () => setListening(false)
    recognition.onend = () => {
      setListening(false)
      if (finalTranscript) {
        onChange({ target: { value: (value || '') + finalTranscript } })
      }
    }

    recognition.start()
    setListening(true)
  }, [listening, value, onChange])

  // Cleanup
  useEffect(() => {
    return () => recognitionRef.current?.stop()
  }, [])

  // ── File processing ──
  const processFile = useCallback(async (file) => {
    setProcessing(true)
    setProcessMsg(`A ler ${file.name}…`)

    try {
      const raw = await extractTextFromFile(file)
      if (!raw) {
        setProcessMsg(`Formato não suportado: .${file.name.split('.').pop()}`)
        setTimeout(() => setProcessMsg(''), 3000)
        setProcessing(false)
        return
      }

      // Se temos API key e contexto, fazer extracção inteligente
      if (apiKey && context && smartExtractEnabled && (typeof raw === 'string' ? raw.length > 80 : true)) {
        setProcessMsg('A extrair informação relevante…')
        const extracted = await smartExtract(raw, context, apiKey)
        const newValue = value ? value + '\n\n' + extracted : extracted
        onChange({ target: { value: newValue } })
      } else {
        const text = typeof raw === 'string' ? raw : ''
        const newValue = value ? value + '\n\n' + text : text
        onChange({ target: { value: newValue } })
      }

      setProcessMsg('')
    } catch (err) {
      setProcessMsg('Erro ao processar ficheiro')
      setTimeout(() => setProcessMsg(''), 3000)
    }

    setProcessing(false)
  }, [value, onChange, apiKey, context, smartExtractEnabled])

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = '' // reset para permitir re-upload do mesmo ficheiro
  }, [processFile])

  // ── Drag & Drop ──
  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      processFile(file)
      return
    }

    // Texto arrastado
    const text = e.dataTransfer.getData('text/plain')
    if (text) {
      const newValue = value ? value + '\n' + text : text
      onChange({ target: { value: newValue } })
    }
  }, [processFile, value, onChange])

  // ── Paste handler (ficheiros colados) ──
  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (const item of items) {
      if (item.kind === 'file') {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) processFile(file)
        return
      }
    }
    // Texto normal: deixa o browser tratar
  }, [processFile])

  return (
    <div
      className={`${styles.wrapper} ${dragOver ? styles.dragOver : ''} ${className || ''}`}
      style={style}
      data-smart-input="true"
    >
      <textarea
        ref={textareaRef}
        className={styles.textarea}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onPaste={handlePaste}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled || processing}
        autoFocus={autoFocus}
        {...rest}
      />

      {/* Toolbar */}
      <div className={styles.toolbar}>
        {/* Status */}
        <AnimatePresence>
          {(listening || processMsg) && (
            <motion.span
              className={`${styles.status} ${listening ? styles.statusLive : ''}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
            >
              {listening && <span className={styles.pulse} />}
              {listening ? 'A ouvir…' : processMsg}
            </motion.span>
          )}
        </AnimatePresence>

        <div className={styles.buttons}>
          {/* Mic */}
          {hasSpeech && (
            <button
              type="button"
              className={`${styles.btn} ${listening ? styles.btnActive : ''}`}
              onClick={toggleListening}
              disabled={disabled || processing}
              title={listening ? 'Parar gravação' : 'Gravar voz'}
            >
              {listening ? <MicOff size={14} /> : <Mic size={14} />}
            </button>
          )}

          {/* Upload */}
          <button
            type="button"
            className={styles.btn}
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || processing}
            title="Carregar ficheiro (Word, email, texto, PDF…)"
          >
            {processing ? <Loader2 size={14} className={styles.spin} /> : <Paperclip size={14} />}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            className={styles.hiddenFile}
            onChange={handleFileSelect}
            accept=".txt,.md,.csv,.eml,.html,.docx,.pdf,.rtf,.doc,.json,.xml,.log,.msg"
          />
        </div>
      </div>

      {/* Drop overlay */}
      <AnimatePresence>
        {dragOver && (
          <motion.div
            className={styles.dropOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <FileText size={24} />
            <span>Larga aqui o ficheiro</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
