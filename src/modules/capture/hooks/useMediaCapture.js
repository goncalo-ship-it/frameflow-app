// useMediaCapture.js — Acesso às APIs de media do browser
// Áudio: grava blob via MediaRecorder + transcreve em tempo real via Web Speech API

import { useState, useRef, useCallback } from 'react'
import { useI18n } from '../../../core/i18n/index.js'

const hasSpeech = typeof window !== 'undefined' &&
  (window.SpeechRecognition || window.webkitSpeechRecognition)

/**
 * Hook para captura de media via browser APIs.
 * Devolve helpers para foto, galeria, áudio (com transcrição) e vídeo.
 */
export function useMediaCapture() {
  const { speechLang } = useI18n()
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [transcript, setTranscript] = useState('')
  const mediaRecorderRef = useRef(null)
  const recognitionRef = useRef(null)
  const chunksRef = useRef([])
  const transcriptRef = useRef('')

  /**
   * Abre câmara ou seletor de ficheiro para capturar uma foto.
   */
  const capturePhoto = useCallback(() => {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.capture = 'environment'
      input.style.display = 'none'

      input.onchange = (e) => {
        const file = e.target.files?.[0] || null
        document.body.removeChild(input)
        resolve(file)
      }

      input.oncancel = () => {
        document.body.removeChild(input)
        resolve(null)
      }

      setTimeout(() => {
        if (document.body.contains(input) && !input.files?.length) {
          // deixar o utilizador cancelar manualmente
        }
      }, 100)

      document.body.appendChild(input)
      input.click()
    })
  }, [])

  /**
   * Abre o seletor de galeria (sem captura de câmara).
   */
  const pickFromGallery = useCallback(() => {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.style.display = 'none'

      input.onchange = (e) => {
        const file = e.target.files?.[0] || null
        document.body.removeChild(input)
        resolve(file)
      }

      document.body.appendChild(input)
      input.click()
    })
  }, [])

  /**
   * Inicia gravação de áudio via MediaRecorder + transcrição via Web Speech API.
   */
  const captureAudio = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunksRef.current = []
      transcriptRef.current = ''
      setTranscript('')

      // ── MediaRecorder (blob) ──
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg',
      })

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mediaRecorder.mimeType || 'audio/webm',
        })
        setAudioBlob(blob)
        stream.getTracks().forEach(t => t.stop())
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()

      // ── Web Speech API (transcrição em tempo real) ──
      if (hasSpeech) {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition
        const recognition = new SR()
        recognition.lang = speechLang
        recognition.continuous = true
        recognition.interimResults = true

        recognition.onresult = (event) => {
          let final = ''
          let interim = ''
          for (let i = 0; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript
            } else {
              interim += event.results[i][0].transcript
            }
          }
          transcriptRef.current = final
          setTranscript(final + (interim ? ` ${interim}` : ''))
        }

        recognition.onerror = (e) => {
          // 'no-speech' and 'aborted' are expected — ignore silently
          if (e.error !== 'no-speech' && e.error !== 'aborted') {
            console.warn('[useMediaCapture] Speech error:', e.error)
          }
        }

        // Auto-restart on end (browser may stop after silence)
        recognition.onend = () => {
          if (mediaRecorderRef.current?.state === 'recording') {
            try { recognition.start() } catch { /* already stopped */ }
          }
        }

        recognitionRef.current = recognition
        recognition.start()
      }

      setIsRecording(true)
      setAudioBlob(null)
    } catch (err) {
      console.error('[useMediaCapture] Erro ao aceder ao microfone:', err)
      throw new Error('Não foi possível aceder ao microfone. Verifica as permissões.')
    }
  }, [])

  /**
   * Para a gravação de áudio.
   * Devolve { blob, transcript } — transcript pode ser '' se Speech API indisponível.
   */
  const stopAudio = useCallback(() => {
    // Stop speech recognition
    try { recognitionRef.current?.stop() } catch { /* ok */ }
    recognitionRef.current = null

    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current
      if (!recorder || recorder.state === 'inactive') {
        resolve({ blob: audioBlob, transcript: transcriptRef.current })
        return
      }

      const originalOnStop = recorder.onstop
      recorder.onstop = (e) => {
        if (originalOnStop) originalOnStop(e)
        setTimeout(() => {
          const blob = new Blob(chunksRef.current, {
            type: recorder.mimeType || 'audio/webm',
          })
          setIsRecording(false)
          resolve({ blob, transcript: transcriptRef.current })
        }, 50)
      }

      recorder.stop()
    })
  }, [audioBlob])

  /**
   * Abre câmara ou seletor de ficheiro para capturar um vídeo.
   */
  const captureVideo = useCallback(() => {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'video/*'
      input.capture = 'environment'
      input.style.display = 'none'

      input.onchange = async (e) => {
        const file = e.target.files?.[0]
        document.body.removeChild(input)
        if (!file) return reject(new Error('Nenhum vídeo seleccionado'))

        const MAX_SIZE = 50 * 1024 * 1024
        if (file.size > MAX_SIZE) {
          return reject(new Error('Vídeo demasiado grande (máximo 50MB).'))
        }

        try {
          const url = URL.createObjectURL(file)
          const video = document.createElement('video')
          video.src = url
          video.muted = true
          video.playsInline = true
          video.currentTime = 1

          await new Promise((r, rej) => {
            video.onloadeddata = r
            video.onerror = () => rej(new Error('Erro ao carregar vídeo'))
            setTimeout(() => r(), 5000)
          })

          const canvas = document.createElement('canvas')
          const vw = video.videoWidth || 320
          const vh = video.videoHeight || 240
          canvas.width = 200
          canvas.height = Math.round(200 * (vh / vw))
          canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
          const thumbnail = canvas.toDataURL('image/jpeg', 0.7)

          const duration = Math.round(video.duration || 0)
          URL.revokeObjectURL(url)

          const arrayBuffer = await file.arrayBuffer()

          resolve({
            type: 'video',
            blob: new Blob([arrayBuffer], { type: file.type }),
            thumbnail,
            duration,
            fileName: file.name,
          })
        } catch (err) {
          reject(err)
        }
      }

      input.oncancel = () => {
        document.body.removeChild(input)
        reject(new Error('Captura cancelada'))
      }

      document.body.appendChild(input)
      input.click()
    })
  }, [])

  return {
    capturePhoto,
    pickFromGallery,
    captureAudio,
    stopAudio,
    captureVideo,
    isRecording,
    audioBlob,
    transcript,
  }
}
