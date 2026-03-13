// ── Shooting Day Store ─────────────────────────────────────────────
// Estado em tempo real de um dia de rodagem
// Funciona local (Zustand) e opcionalmente sincroniza com Firestore
//
// Padrão: local-first. Quando connectFirestore() é chamado,
// abre listeners onSnapshot e sincroniza writes.

import { create } from 'zustand'

// ── Helpers ──────────────────────────────────────────────────────
const now = () => new Date().toISOString()
const genId = () => Math.random().toString(36).slice(2, 10)

export const SCENE_STATUS = {
  WAITING:   'waiting',
  PREPPING:  'prepping',
  ROLLING:   'rolling',
  DONE:      'done',
  POSTPONED: 'postponed',
}

export const TAKE_STATUS = {
  OK:          'ok',
  NOK:         'nok',
  MAYBE:       'maybe',
  FALSE_START: 'false_start',
}

export const DAY_STATUS = {
  PREP:    'prep',
  ROLLING: 'rolling',
  CUT:     'cut',
  WRAP:    'wrap',
}

const ALL_DEPTS = ['luz', 'camara', 'arte', 'guardaroupa', 'maquilhagem', 'som']

// Mapa de role → departamento para confirmações (IDs de roles.js)
const ROLE_TO_DEPT = {
  gaffer:            'luz',
  electricista:      'luz',
  dir_fotografia:    'camara',
  operador_camara:   'camara',
  primeiro_ac:       'camara',
  segundo_ac:        'camara',
  director_arte:     'arte',
  set_decorator:     'arte',
  prop_master:       'arte',
  set_dresser:       'arte',
  figurinista:       'guardaroupa',
  wardrobe_supervisor: 'guardaroupa',
  set_costumer:      'guardaroupa',
  chefe_maquilhagem: 'maquilhagem',
  chefe_cabelos:     'maquilhagem',
  assistente_mua:    'maquilhagem',
  operador_som:      'som',
  boom_operator:     'som',
  dit:               'camara',
  video_assist:      'camara',
}

// ── Store ────────────────────────────────────────────────────────
export const useShootingStore = create((set, get) => ({
  // Estado do dia
  day: null,  // { date, status, currentSceneId, currentTake, updatedAt, updatedBy }

  // Cenas do dia (keyed by sceneId)
  scenes: {},  // { [sceneId]: { status, currentTake, goodTake, startedAt, wrappedAt, readyDepts:{}, takes:{} } }

  // Ordem das cenas no dia
  sceneOrder: [],  // [sceneId, sceneId, ...]

  // Log de takes (array cronológico)
  takeLog: [],  // [{ id, sceneId, number, status, notes, notedBy, notedByRole, createdAt }]

  // Firestore connection state
  firestoreConnected: false,
  _unsubscribers: [],

  // ── Inicializar dia de rodagem ──────────────────────────────
  initDay: (date, scenesForDay) => {
    const sceneOrder = scenesForDay.map(s => s.id)
    const scenes = {}
    scenesForDay.forEach(s => {
      scenes[s.id] = {
        id: s.id,
        sceneNumber: s.sceneNumber,
        episodeId: s.episodeId,
        location: s.location,
        intExt: s.intExt,
        dayNight: s.dayNight,
        characters: s.characters || [],
        description: s.description || '',
        status: SCENE_STATUS.WAITING,
        currentTake: 0,
        goodTake: null,
        startedAt: null,
        wrappedAt: null,
        readyDepts: Object.fromEntries(ALL_DEPTS.map(d => [d, false])),
        takes: {},
        notes: [],
      }
    })

    set({
      day: {
        date,
        status: DAY_STATUS.PREP,
        currentSceneId: sceneOrder[0] || null,
        currentTake: 0,
        updatedAt: now(),
        updatedBy: null,
      },
      scenes,
      sceneOrder,
      takeLog: [],
    })
  },

  // ── Mudar estado da cena (1º AD / chefia) ──────────────────
  setSceneStatus: (sceneId, status, userId) => {
    const state = get()
    const scene = state.scenes[sceneId]
    if (!scene) return

    const updates = { status }
    if (status === SCENE_STATUS.ROLLING && !scene.startedAt) {
      updates.startedAt = now()
      updates.currentTake = 1
    }
    if (status === SCENE_STATUS.DONE || status === SCENE_STATUS.POSTPONED) {
      updates.wrappedAt = now()
    }
    // Reset dept readiness quando muda de cena
    if (status === SCENE_STATUS.PREPPING) {
      updates.readyDepts = Object.fromEntries(ALL_DEPTS.map(d => [d, false]))
    }

    set(state => ({
      scenes: { ...state.scenes, [sceneId]: { ...state.scenes[sceneId], ...updates } },
      day: {
        ...state.day,
        currentSceneId: sceneId,
        currentTake: updates.currentTake ?? state.day.currentTake,
        status: status === SCENE_STATUS.ROLLING ? DAY_STATUS.ROLLING : state.day.status,
        updatedAt: now(),
        updatedBy: userId,
      },
    }))

    // Sync to Firestore if connected
    get()._syncScene(sceneId)
    get()._syncDay()
  },

  // ── Avançar para próxima cena ──────────────────────────────
  advanceToNextScene: (userId) => {
    const { sceneOrder, scenes, day } = get()
    const currentIdx = sceneOrder.indexOf(day.currentSceneId)

    // Encontrar próxima cena que não esteja done/postponed
    for (let i = currentIdx + 1; i < sceneOrder.length; i++) {
      const nextId = sceneOrder[i]
      if (scenes[nextId]?.status !== SCENE_STATUS.DONE && scenes[nextId]?.status !== SCENE_STATUS.POSTPONED) {
        get().setSceneStatus(nextId, SCENE_STATUS.PREPPING, userId)
        return nextId
      }
    }

    // Não há mais cenas — wrap
    set(state => ({
      day: { ...state.day, status: DAY_STATUS.WRAP, updatedAt: now(), updatedBy: userId },
    }))
    get()._syncDay()
    return null
  },

  // ── Incrementar take ───────────────────────────────────────
  incrementTake: (sceneId, userId) => {
    set(state => {
      const scene = state.scenes[sceneId]
      if (!scene) return state
      const nextTake = (scene.currentTake || 0) + 1
      return {
        scenes: { ...state.scenes, [sceneId]: { ...scene, currentTake: nextTake } },
        day: { ...state.day, currentTake: nextTake, updatedAt: now() },
      }
    })
    get()._syncScene(sceneId)
    get()._syncDay()
  },

  // ── Registar resultado de take ─────────────────────────────
  recordTake: (sceneId, takeNumber, status, notes, userId, userRole) => {
    const takeEntry = {
      id: genId(),
      sceneId,
      number: takeNumber,
      status,
      notes: notes || '',
      notedBy: userId,
      notedByRole: userRole,
      createdAt: now(),
    }

    set(state => {
      const scene = state.scenes[sceneId]
      if (!scene) return state
      const takes = { ...scene.takes, [takeNumber]: { status, note: notes || '' } }
      const goodTake = status === TAKE_STATUS.OK ? takeNumber : scene.goodTake
      return {
        scenes: { ...state.scenes, [sceneId]: { ...scene, takes, goodTake } },
        takeLog: [...state.takeLog, takeEntry],
      }
    })
    get()._syncScene(sceneId)
    get()._syncTake(takeEntry)
  },

  // ── HOD confirma departamento pronto ───────────────────────
  setDeptReady: (sceneId, dept, ready = true) => {
    set(state => {
      const scene = state.scenes[sceneId]
      if (!scene) return state
      return {
        scenes: {
          ...state.scenes,
          [sceneId]: {
            ...scene,
            readyDepts: { ...scene.readyDepts, [dept]: ready },
          },
        },
      }
    })
    get()._syncScene(sceneId)
  },

  // Marcar pronto pelo role (resolve dept automaticamente)
  setMyDeptReady: (sceneId, role, ready = true) => {
    const dept = ROLE_TO_DEPT[role]
    if (dept) get().setDeptReady(sceneId, dept, ready)
  },

  // ── Adicionar nota a uma cena ──────────────────────────────
  addSceneNote: (sceneId, note, userId, userRole) => {
    set(state => {
      const scene = state.scenes[sceneId]
      if (!scene) return state
      return {
        scenes: {
          ...state.scenes,
          [sceneId]: {
            ...scene,
            notes: [...(scene.notes || []), { text: note, by: userId, role: userRole, at: now() }],
          },
        },
      }
    })
    get()._syncScene(sceneId)
  },

  // ── Queries / Computed ─────────────────────────────────────
  getCurrentScene: () => {
    const { day, scenes } = get()
    return day?.currentSceneId ? scenes[day.currentSceneId] : null
  },

  getNextScene: () => {
    const { day, scenes, sceneOrder } = get()
    if (!day?.currentSceneId) return null
    const idx = sceneOrder.indexOf(day.currentSceneId)
    for (let i = idx + 1; i < sceneOrder.length; i++) {
      const s = scenes[sceneOrder[i]]
      if (s && s.status !== SCENE_STATUS.DONE && s.status !== SCENE_STATUS.POSTPONED) return s
    }
    return null
  },

  getProgress: () => {
    const { scenes, sceneOrder } = get()
    const total = sceneOrder.length
    const done = sceneOrder.filter(id => scenes[id]?.status === SCENE_STATUS.DONE).length
    const postponed = sceneOrder.filter(id => scenes[id]?.status === SCENE_STATUS.POSTPONED).length
    return { total, done, postponed, remaining: total - done - postponed, pct: total ? Math.round((done / total) * 100) : 0 }
  },

  getEstimatedWrap: (scheduledWrap) => {
    const { scenes, sceneOrder } = get()
    const done = sceneOrder.filter(id => scenes[id]?.status === SCENE_STATUS.DONE)
    if (done.length === 0) return scheduledWrap

    // Calcular média de tempo por cena
    const durations = done.map(id => {
      const s = scenes[id]
      if (s?.startedAt && s?.wrappedAt) {
        return new Date(s.wrappedAt) - new Date(s.startedAt)
      }
      return null
    }).filter(Boolean)

    if (durations.length === 0) return scheduledWrap
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length
    const remaining = sceneOrder.filter(id => {
      const s = scenes[id]
      return s && s.status !== SCENE_STATUS.DONE && s.status !== SCENE_STATUS.POSTPONED
    }).length

    const msLeft = remaining * avg
    return new Date(Date.now() + msLeft)
  },

  getAllDeptReady: (sceneId) => {
    const scene = get().scenes[sceneId]
    if (!scene) return false
    return ALL_DEPTS.every(d => scene.readyDepts[d])
  },

  // ── Firestore sync (opcional) ──────────────────────────────
  connectFirestore: async (projectId, date) => {
    try {
      const { db, doc, collection, onSnapshot, query, orderBy } = await import('./firebase.js')

      const unsubs = []

      // Listener: day state
      unsubs.push(onSnapshot(doc(db, `projects/${projectId}/shooting/${date}`), snap => {
        if (snap.exists()) {
          set(state => ({ day: { ...state.day, ...snap.data() } }))
        }
      }))

      // Listener: scenes
      unsubs.push(onSnapshot(collection(db, `projects/${projectId}/shooting/${date}/scenes`), snap => {
        snap.docChanges().forEach(change => {
          if (change.type === 'added' || change.type === 'modified') {
            set(state => ({
              scenes: { ...state.scenes, [change.doc.id]: { ...state.scenes[change.doc.id], ...change.doc.data() } },
            }))
          }
        })
      }))

      // Listener: takes
      unsubs.push(onSnapshot(
        query(collection(db, `projects/${projectId}/shooting/${date}/takes`), orderBy('createdAt')),
        snap => {
          const takes = snap.docs.map(d => ({ id: d.id, ...d.data() }))
          set({ takeLog: takes })
        }
      ))

      set({ firestoreConnected: true, _unsubscribers: unsubs, _projectId: projectId, _date: date })
    } catch (e) {
      console.warn('Firestore connection failed, using local-only mode:', e.message)
    }
  },

  disconnectFirestore: () => {
    get()._unsubscribers.forEach(fn => fn?.())
    set({ firestoreConnected: false, _unsubscribers: [] })
  },

  // Sync helpers (no-op if not connected)
  _syncDay: async () => {
    const state = get()
    if (!state.firestoreConnected) return
    try {
      const { db, doc, setDoc } = await import('./firebase.js')
      await setDoc(doc(db, `projects/${state._projectId}/shooting/${state._date}`), state.day, { merge: true })
    } catch {}
  },

  _syncScene: async (sceneId) => {
    const state = get()
    if (!state.firestoreConnected) return
    try {
      const { db, doc, setDoc } = await import('./firebase.js')
      await setDoc(doc(db, `projects/${state._projectId}/shooting/${state._date}/scenes/${sceneId}`), state.scenes[sceneId], { merge: true })
    } catch {}
  },

  _syncTake: async (take) => {
    const state = get()
    if (!state.firestoreConnected) return
    try {
      const { db, doc, setDoc } = await import('./firebase.js')
      await setDoc(doc(db, `projects/${state._projectId}/shooting/${state._date}/takes/${take.id}`), take)
    } catch {}
  },

  _projectId: null,
  _date: null,
}))
