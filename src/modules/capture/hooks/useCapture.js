// useCapture.js — Máquina de estados principal do fluxo de capture

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useStore } from '../../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { useShootingStore } from '../../../core/shootingStore.js'
import { interpretCapture, ROLE_DEPT_TO_CONFIG } from '../utils/captureInterpreter.js'
import { routeCapture } from '../utils/captureRouter.js'
import { ROLES, DEPARTMENTS } from '../../../core/roles.js'
import { queueNotification, startBatchTimer, stopBatchTimer, registerStore } from '../utils/captureNotifier.js'
import { compressImage, createThumbnail } from '../utils/mediaCompressor.js'
import { saveMedia, clearOld } from '../utils/captureStorage.js'

// Estados possíveis do fluxo
// idle → capturing → interpreting → questioning → confirming → routing → done → queued (offline)

function generateId() {
  return `cap_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

/**
 * Hook principal para o fluxo de capture.
 * Gere toda a máquina de estados.
 */
export function useCapture() {
  const { apiKey, parsedCharacters, parsedLocations, parsedScripts, projectName, auth, addCapture, updateCapture, removeCapture, shootingDays, captures } = useStore(useShallow(s => ({
    apiKey: s.apiKey, parsedCharacters: s.parsedCharacters, parsedLocations: s.parsedLocations,
    parsedScripts: s.parsedScripts, projectName: s.projectName, auth: s.auth,
    addCapture: s.addCapture, updateCapture: s.updateCapture, removeCapture: s.removeCapture,
    shootingDays: s.shootingDays, captures: s.captures,
  })))

  // Shooting store — contexto de rodagem em tempo real
  const shootingDay = useShootingStore(s => s.day)
  const shootingScenes = useShootingStore(s => s.scenes)

  const [state, setState] = useState('idle')
  const [capture, setCapture] = useState(null)
  const [error, setError] = useState(null)
  const [setMode, setSetMode] = useState(false)

  // ── Offline Queue ───────────────────────────────────────────────
  const [offlineQueue, setOfflineQueue] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fb_capture_queue') || '[]') } catch { return [] }
  })

  const addToQueue = useCallback((captureItem) => {
    setOfflineQueue(prev => {
      const q = [...prev, { ...captureItem, queuedAt: Date.now() }]
      localStorage.setItem('fb_capture_queue', JSON.stringify(q))
      return q
    })
  }, [])

  // Contagem de itens no inbox (status='inbox')
  const capturesList = captures || []
  const inboxCount = capturesList.filter(c => c.status === 'inbox').length

  // ── Set Mode — detectar contexto de rodagem ───────────────────
  const shootingSceneOrder = useShootingStore(s => s.sceneOrder)

  const setModeContext = useMemo(() => {
    if (!setMode) return null
    if (!shootingDay) return null

    const currentSceneId = shootingDay.currentSceneId
    const currentScene = currentSceneId ? shootingScenes[currentSceneId] : null

    // Encontrar o shooting day correspondente no store principal
    const matchingDay = (shootingDays || []).find(d => d.date === shootingDay.date)

    // Construir lista de cenas do dia para contexto enriquecido
    const dayScenes = (shootingSceneOrder || []).map(id => shootingScenes[id]).filter(Boolean)

    return {
      dayNumber: matchingDay?.dayNumber || matchingDay?.id || shootingDay.date || '?',
      episode: currentScene?.episodeId || matchingDay?.episodeNumber || '?',
      currentScene: currentScene ? `${currentScene.episodeId || ''}-${currentScene.sceneNumber || currentScene.id}` : null,
      currentSceneDesc: currentScene?.description || null,
      currentLocation: currentScene?.location || null,
      currentSceneCharacters: currentScene?.characters || [],
      currentSceneStatus: currentScene?.status || null,
      dayScenes: dayScenes.map(s => ({
        id: `${s.episodeId || ''}-${s.sceneNumber || s.id}`,
        location: s.location,
        characters: s.characters || [],
        status: s.status,
      })),
    }
  }, [setMode, shootingDay, shootingScenes, shootingDays, shootingSceneOrder])

  // Auto-detectar se devemos sugerir set mode (shooting day activo)
  const canSetMode = !!shootingDay

  const toggleSetMode = useCallback(() => {
    setSetMode(prev => !prev)
  }, [])

  /**
   * Constrói contexto do projecto para o interpretador.
   */
  const buildProjectContext = useCallback(() => ({
    projectName: projectName || 'Projecto',
    parsedCharacters: parsedCharacters || [],
    parsedLocations: parsedLocations || [],
    parsedScripts: parsedScripts || {},
  }), [projectName, parsedCharacters, parsedLocations, parsedScripts])

  /**
   * Constrói contexto de autenticação para o interpretador.
   * Inclui role, departamento do utilizador, e mapeamento para dept config.
   */
  const buildAuthContext = useCallback(() => {
    if (!auth?.role) return null
    const roleData = ROLES[auth.role]
    const deptData = roleData?.dept ? Object.values(DEPARTMENTS).find(d => d.id === roleData.dept) : null
    const deptConfigId = roleData?.dept ? (ROLE_DEPT_TO_CONFIG[roleData.dept] || null) : null

    return {
      role: auth.role,
      roleLabel: roleData?.label || auth.role,
      department: roleData?.dept || auth.department,
      departmentLabel: deptData?.label || auth.department || '',
      deptConfigId,
      userName: typeof auth.user === 'object' ? auth.user?.name : auth.user,
      accessLevel: roleData?.level || 4,
    }
  }, [auth])

  /**
   * Interpreta e encaminha um item (usado para retry de queue também).
   */
  const interpretAndRoute = useCallback(async (item) => {
    const interpType = item.type === 'video' ? (item.base64 ? 'image' : 'text') : (item.type === 'audio' ? 'text' : item.type)
    const interpBase64 = (item.type === 'image' || item.type === 'video') ? item.base64 : null
    const interpText = item.type === 'text' ? item.textContent : (item.type === 'audio' ? item.textContent : (item.type === 'video' ? item.textContent : null))

    const interpretation = await interpretCapture({
      type: interpType,
      base64: interpBase64,
      text: interpText,
      apiKey,
      projectContext: buildProjectContext(),
      setModeContext,
      authContext: buildAuthContext(),
    })

    const questions = interpretation.perguntas || []
    if (questions.length > 0) {
      // Item needs manual attention — put in inbox
      updateCapture(item.id, { interpretation, questions, status: 'inbox' })
      return
    }

    const itemWithInterp = { ...item, interpretation, questions: [], answers: {} }
    const results = await routeCapture(itemWithInterp, {}, useStore.getState())

    // Use batched notifications
    for (const dest of results) {
      if (dest.success) {
        queueNotification({
          recipient: dest.module,
          tipo: interpretation.tipo || 'capture',
          descricao: interpretation.descricao || 'Novo item capturado',
          capturedBy: item.capturedBy || 'Equipa',
          label: dest.label,
        })
      }
    }

    updateCapture(item.id, { interpretation, status: 'done', destinations: results })
  }, [apiKey, buildProjectContext, buildAuthContext, setModeContext, updateCapture])

  /**
   * Processa a queue offline — retenta itens pendentes.
   */
  const processQueue = useCallback(async () => {
    if (offlineQueue.length === 0) return
    const remaining = []
    for (const item of offlineQueue) {
      try {
        await interpretAndRoute(item)
      } catch {
        remaining.push(item) // still offline, keep in queue
      }
    }
    setOfflineQueue(remaining)
    localStorage.setItem('fb_capture_queue', JSON.stringify(remaining))
  }, [offlineQueue, interpretAndRoute])

  // Auto-process when coming online
  useEffect(() => {
    const handler = () => processQueue()
    window.addEventListener('online', handler)
    return () => window.removeEventListener('online', handler)
  }, [processQueue])

  // Listen for service worker background sync message
  useEffect(() => {
    const handler = (event) => {
      if (event.data?.type === 'FLUSH_CAPTURE_QUEUE') {
        processQueue()
      }
    }
    navigator.serviceWorker?.addEventListener('message', handler)
    return () => navigator.serviceWorker?.removeEventListener('message', handler)
  }, [processQueue])

  // Register store for batched notifications & start/stop timer
  useEffect(() => {
    registerStore(useStore)
    startBatchTimer()
    return () => stopBatchTimer()
  }, [])

  /**
   * Inicia o fluxo de capture com um ficheiro de media ou texto.
   * @param {'image'|'text'|'audio'|'video'} type
   * @param {File|Blob|string|object} input — File/Blob para media, string para texto, object para vídeo
   */
  const startCapture = useCallback(async (type, input) => {
    setError(null)
    setState('interpreting')

    try {
      const id = generateId()
      let base64 = null
      let thumbnail = null
      let textContent = null
      let videoMeta = null

      if (type === 'image' && input instanceof File) {
        // Comprimir imagem e criar thumbnail
        const [b64, thumb] = await Promise.all([
          compressImage(input),
          createThumbnail(input),
        ])
        base64 = b64
        thumbnail = thumb

        // Guardar blob original em IndexedDB
        await saveMedia(id, input)
        await clearOld(100)

      } else if (type === 'video' && input && typeof input === 'object' && input.type === 'video') {
        // Vídeo — guardar blob em IndexedDB, usar thumbnail para API
        thumbnail = input.thumbnail
        if (input.thumbnail) {
          base64 = input.thumbnail.replace(/^data:image\/\w+;base64,/, '')
        }
        textContent = `[Vídeo capturado: ${input.duration || '?'}s] ${input.fileName || ''}`
        videoMeta = { duration: input.duration, fileName: input.fileName }

        if (input.blob) {
          await saveMedia(id, input.blob)
          await clearOld(100)
        }

      } else if (type === 'audio') {
        // Áudio — com transcrição via Web Speech API
        const audioBlob = input instanceof Blob ? input : input?.blob
        const audioTranscript = input?.transcript || ''
        textContent = audioTranscript
          ? audioTranscript
          : '[Nota de voz — sem transcrição disponível]'
        if (audioBlob) await saveMedia(id, audioBlob)

      } else if (type === 'text' && typeof input === 'string') {
        textContent = input.trim()
      }

      // Criar objecto capture provisório
      const newCapture = {
        id,
        type,
        base64,           // comprimido para API
        thumbnail,        // pequeno para UI
        textContent,
        interpretation: null,
        questions: [],
        answers: {},
        status: 'interpreting',
        capturedAt: Date.now(),
        capturedBy: auth?.user || 'Equipa',
        destinations: [],
        videoMeta,
      }

      setCapture(newCapture)

      // Persistir no store (sem base64 para não encher o localStorage)
      addCapture({
        ...newCapture,
        base64: null,      // não persistir
        thumbnail: null,   // não persistir
      })

      // Chamar API para interpretar
      if (!apiKey) {
        setError('API key não configurada.')
        // Colocar no inbox para classificação manual
        updateCapture(id, { status: 'inbox' })
        setCapture(prev => ({ ...prev, status: 'inbox' }))
        setState('idle')
        return
      }

      // Para vídeo, enviamos o thumbnail como imagem + texto descritivo
      const interpType = type === 'video' ? (base64 ? 'image' : 'text') : (type === 'audio' ? 'text' : type)
      const interpBase64 = (type === 'image' || type === 'video') ? base64 : null
      const interpText = type === 'text' ? textContent : (type === 'audio' ? textContent : (type === 'video' ? textContent : null))

      let interpretation
      try {
        interpretation = await interpretCapture({
          type: interpType,
          base64: interpBase64,
          text: interpText,
          apiKey,
          projectContext: buildProjectContext(),
          setModeContext,
          authContext: buildAuthContext(),
        })
      } catch (apiErr) {
        // Network error or API failure — queue for later
        console.warn('[useCapture] API falhou, a guardar na queue offline:', apiErr.message)
        addToQueue({ id, type, base64, textContent, capturedBy: auth?.user || 'Equipa' })
        updateCapture(id, { status: 'queued' })
        setCapture(prev => prev ? { ...prev, status: 'queued' } : prev)
        setState('queued')

        // Reset after brief delay
        setTimeout(() => {
          setState('idle')
          setCapture(null)
        }, 3000)
        return
      }

      // Se há perguntas → estado questioning; senão → confirming
      const questions = interpretation.perguntas || []
      const nextState = questions.length > 0 ? 'questioning' : 'confirming'

      const updatedCapture = {
        ...newCapture,
        interpretation,
        questions,
        status: nextState,
      }

      setCapture(updatedCapture)
      updateCapture(id, { interpretation, questions, status: nextState })
      setState(nextState)

    } catch (err) {
      console.error('[useCapture] Erro:', err)
      setError(err.message || 'Erro desconhecido')
      setState('idle')
    }
  }, [apiKey, addCapture, updateCapture, auth, buildProjectContext, buildAuthContext, addToQueue, setModeContext])

  /**
   * Submete texto directamente (para o modo texto).
   */
  const submitInput = useCallback((text) => {
    if (!text?.trim()) return
    startCapture('text', text)
  }, [startCapture])

  /**
   * Responde a uma pergunta do interpretador.
   */
  const answerQuestion = useCallback((campo, resposta) => {
    setCapture(prev => {
      if (!prev) return prev
      const answers = { ...prev.answers, [campo]: resposta }
      return { ...prev, answers }
    })
  }, [])

  /**
   * Avança do estado questioning para confirming.
   */
  const proceedToConfirm = useCallback(() => {
    setState('confirming')
    setCapture(prev => prev ? { ...prev, status: 'confirming' } : prev)
  }, [])

  /**
   * Confirma e encaminha o capture.
   */
  const confirmCapture = useCallback(async (silent = false) => {
    if (!capture) return
    setState('routing')

    try {
      const results = await routeCapture(capture, capture.answers, useStore.getState())

      if (!silent) {
        // Use batched notifications instead of direct notify
        for (const dest of results) {
          if (dest.success) {
            queueNotification({
              recipient: dest.module,
              tipo: capture.interpretation?.tipo || 'capture',
              descricao: capture.interpretation?.descricao || 'Novo item capturado',
              capturedBy: capture.capturedBy || auth?.user || 'Equipa',
              label: dest.label,
            })
          }
        }
      }

      updateCapture(capture.id, {
        status: 'done',
        destinations: results,
      })

      setCapture(prev => prev ? { ...prev, status: 'done', destinations: results } : prev)
      setState('done')

      // Limpar após breve delay
      setTimeout(() => {
        setState('idle')
        setCapture(null)
      }, 1800)

    } catch (err) {
      console.error('[useCapture] Erro ao confirmar:', err)
      setError(err.message)
      setState('confirming')
    }
  }, [capture, auth, updateCapture])

  /**
   * Cancela o fluxo actual e guarda no inbox (se já interpretado).
   */
  const cancelCapture = useCallback(() => {
    if (capture) {
      // Se já foi interpretado, guardar no inbox
      if (capture.interpretation) {
        updateCapture(capture.id, { status: 'inbox' })
      } else {
        // Remover se ainda não foi interpretado
        removeCapture?.(capture.id)
      }
    }
    setState('idle')
    setCapture(null)
    setError(null)
  }, [capture, removeCapture, updateCapture])

  /**
   * Retoma o fluxo para um capture no inbox.
   */
  const resumeCapture = useCallback((existingCapture) => {
    setCapture({
      ...existingCapture,
      base64: null,
      thumbnail: null,
    })
    const questions = existingCapture.questions || []
    setState(questions.length > 0 ? 'questioning' : 'confirming')
    setError(null)
  }, [])

  return {
    state,
    capture,
    error,
    inboxCount,
    offlineQueue,
    startCapture,
    submitInput,
    answerQuestion,
    proceedToConfirm,
    confirmCapture,
    cancelCapture,
    resumeCapture,
    processQueue,
    // Set mode
    setMode,
    setModeContext,
    canSetMode,
    toggleSetMode,
  }
}
