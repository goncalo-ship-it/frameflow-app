// ── Live Board — "Ao Momento" ─────────────────────────────────────
// Cockpit em tempo real do set de rodagem
// Duas vistas: HOJE (briefing estático) + AO MOMENTO (tempo real)

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clapperboard, Play, Square, SkipForward, Check, X,
  AlertTriangle, Clock, Users, MapPin, Wifi, WifiOff,
  CircleDot, ChevronRight,
} from 'lucide-react'
import { useStore } from '../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { useShootingStore, SCENE_STATUS, TAKE_STATUS, DAY_STATUS } from '../../core/shootingStore.js'
import { resolveRole, ROLES, isAdmin } from '../../core/roles.js'
import { DailiesView } from './DailiesView.jsx'
import { DigitalSlate } from '../../components/embeds/DigitalSlate.jsx'
import { WalkieTalkieInterface } from '../../components/embeds/WalkieTalkieInterface.jsx'
import { SceneCard } from '../../components/shared/ui'
import { useVirtualizer } from '@tanstack/react-virtual'
import styles from './LiveBoard.module.css'

// ── Adapter: shootingStore scene → SceneData ──────────────────────
function toLiveSceneData(scene, takes = []) {
  return {
    sceneKey: scene.id,
    sceneNumber: displaySceneNum(scene),
    epId: scene.episodeId,
    location: scene.location,
    intExt: scene.intExt,
    timeOfDay: scene.dayNight,
    characters: scene.characters || [],
    takes: takes.map((t, i) => ({
      id: t.id || String(i),
      number: t.number || i + 1,
      status: t.status === 'ok' ? 'BOM' : t.status === 'nok' ? 'NG' : 'HOLD',
      notes: t.notes,
    })),
  }
}

// Role-to-dept map (for HOD views)
const ROLE_DEPT_MAP = {
  gaffer: 'luz', chefe_electricos: 'luz',
  dir_fotografia: 'camara', operador_camara: 'camara',
  dir_arte: 'arte', cenografo: 'arte', aderecista: 'arte',
  figurinista: 'guardaroupa',
  chefe_maquilhagem: 'maquilhagem',
  dir_som: 'som', perchista: 'som',
}

const DEPT_LABELS = {
  luz: 'Luz', camara: 'Câmara', arte: 'Arte',
  guardaroupa: 'Guarda-roupa', maquilhagem: 'Makeup', som: 'Som',
}

// Roles que podem controlar a rodagem
const CONTROL_ROLES = ['director_producao', 'produtor_executivo', 'chefe_producao', 'primeiro_ad', 'segundo_ad', 'realizador']

// Roles elenco
const CAST_ROLES = ['elenco_principal', 'elenco_secundario', 'elenco_figuracao']

// Helper: extract a display-friendly scene number from sceneNumber or scene id
// Handles: "5" → "5", "SC003" → "SC003", "003" → "003", undefined/NaN → id fallback
const displaySceneNum = (scene) => {
  const num = scene?.sceneNumber
  if (num != null && num !== '' && !(typeof num === 'number' && isNaN(num))) return String(num)
  // Fallback: extract from scene id (format "EP01-SC003" → "SC003")
  const id = scene?.id || ''
  const parts = id.split('-')
  return parts.length > 1 ? parts.slice(1).join('-') : id
}

export default function LiveBoard() {
  const {  auth, shootingDays, sceneAssignments, parsedScripts, currentProjectId  } = useStore(useShallow(s => ({ auth: s.auth, shootingDays: s.shootingDays, sceneAssignments: s.sceneAssignments, parsedScripts: s.parsedScripts, currentProjectId: s.currentProjectId })))
  const shooting = useShootingStore()
  const [activeTab, setActiveTab] = useState('agora') // 'hoje' | 'agora' | 'dailies'
  const [selectedDay, setSelectedDay] = useState('')

  const role = resolveRole(auth.role)

  // ── Firestore real-time sync (opt-in via localStorage toggle) ──
  useEffect(() => {
    const syncEnabled = localStorage.getItem('frame_firestore_sync') === 'true'
    const dayDate = shooting.day?.date
    const projectId = currentProjectId

    if (!syncEnabled || !dayDate || !projectId) return

    // Connect to Firestore for this shooting day
    shooting.connectFirestore(projectId, dayDate)

    return () => {
      shooting.disconnectFirestore()
    }
  }, [shooting.day?.date, currentProjectId])
  const userId = auth.user?.uid || auth.user?.email || 'dev'
  const canControl = CONTROL_ROLES.includes(role)
  const isCast = CAST_ROLES.includes(role)
  const myDept = ROLE_DEPT_MAP[role]
  const isAnotadora = role === 'anotadora'

  // Se não há dia iniciado, mostra setup
  if (!shooting.day) {
    return (
      <div className={styles.container}>
        <Header activeTab={activeTab} setActiveTab={setActiveTab} connected={shooting.firestoreConnected} />
        <div className={styles.main}>
          <SetupPanel
            shootingDays={shootingDays}
            sceneAssignments={sceneAssignments}
            parsedScripts={parsedScripts}
            selectedDay={selectedDay}
            setSelectedDay={setSelectedDay}
            onStart={(date, scenes) => shooting.initDay(date, scenes)}
          />
        </div>
      </div>
    )
  }

  // Dia em wrap
  if (shooting.day.status === DAY_STATUS.WRAP) {
    return (
      <div className={styles.container}>
        <Header activeTab={activeTab} setActiveTab={setActiveTab} connected={shooting.firestoreConnected} date={shooting.day.date} />
        <div className={styles.main}>
          <div className={styles.wrapCard}>
            <Clapperboard size={32} style={{ color: 'var(--health-green)', marginBottom: 8 }} />
            <h2 className={styles.wrapTitle}>WRAP!</h2>
            <p className={styles.wrapSub}>
              {shooting.getProgress().done} cenas filmadas
              {shooting.getProgress().postponed > 0 && `, ${shooting.getProgress().postponed} adiadas`}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <Header activeTab={activeTab} setActiveTab={setActiveTab} connected={shooting.firestoreConnected} date={shooting.day.date} />
      <div className={styles.main}>
        {activeTab === 'dailies' ? (
          <DailiesView shooting={shooting} />
        ) : activeTab === 'hoje' ? (
          <HojeView shooting={shooting} />
        ) : isCast ? (
          <CastView shooting={shooting} role={role} />
        ) : (
          <AoMomentoView
            shooting={shooting}
            canControl={canControl}
            myDept={myDept}
            isAnotadora={isAnotadora}
            role={role}
            userId={userId}
          />
        )}
      </div>
    </div>
  )
}

// ── Header ───────────────────────────────────────────────────────
function Header({ activeTab, setActiveTab, connected, date }) {
  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <Clapperboard size={20} />
        <div>
          <h1 className={styles.headerTitle}>Live Board</h1>
          {date && <span className={styles.headerDate}>{date}</span>}
        </div>
      </div>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'hoje' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('hoje')}
        >
          Hoje
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'agora' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('agora')}
        >
          Ao Momento
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'dailies' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('dailies')}
        >
          Dailies
        </button>
      </div>
      <div className={styles.connectionBadge}>
        <span className={styles.connectionDot} style={{ background: connected ? 'var(--health-green)' : 'var(--text-muted)' }} />
        {connected ? 'Firestore' : 'Local'}
      </div>
    </header>
  )
}

// ── Setup Panel ──────────────────────────────────────────────────
function SetupPanel({ shootingDays, sceneAssignments, parsedScripts, selectedDay, setSelectedDay, onStart }) {
  const buildScenes = () => {
    if (!selectedDay) return []
    const day = shootingDays.find(d => d.id === selectedDay)
    if (!day) return []

    // Encontrar cenas atribuídas a este dia
    const scenes = []
    Object.entries(sceneAssignments || {}).forEach(([sceneKey, dayId]) => {
      if (dayId === selectedDay) {
        const [epId, sceneNum] = sceneKey.split('-')
        const ep = parsedScripts?.[epId]
        const scene = ep?.scenes?.find(s => String(s.sceneNumber) === sceneNum)
        scenes.push({
          id: sceneKey,
          sceneNumber: sceneNum,
          episodeId: epId,
          location: scene?.heading?.location || scene?.location || 'Local TBD',
          intExt: scene?.heading?.intExt || scene?.intExt || '',
          dayNight: scene?.heading?.timeOfDay || scene?.dayNight || '',
          characters: scene?.characters || [],
          description: scene?.heading?.full || scene?.description || '',
        })
      }
    })

    // Ordenar por número de cena (handle string scene numbers like "SC003")
    scenes.sort((a, b) => {
      const na = parseInt(String(a.sceneNumber).replace(/\D/g, ''), 10) || 0
      const nb = parseInt(String(b.sceneNumber).replace(/\D/g, ''), 10) || 0
      return na - nb
    })
    return scenes
  }

  const scenes = buildScenes()

  return (
    <div className={styles.setup}>
      <Clapperboard size={36} style={{ color: 'var(--accent)' }} />
      <h2 className={styles.setupTitle}>Iniciar Dia de Rodagem</h2>
      <p className={styles.setupSub}>Seleciona o dia para iniciar o Live Board</p>

      <select
        className={styles.setupSelect}
        value={selectedDay}
        onChange={e => setSelectedDay(e.target.value)}
      >
        <option value="">Selecionar dia…</option>
        {shootingDays.map(d => (
          <option key={d.id} value={d.id}>
            Dia {d.dayNumber || d.id} — {d.date || 'sem data'}
            {d.location ? ` — ${d.location}` : ''}
          </option>
        ))}
      </select>

      {selectedDay && (
        <p className={styles.setupSub}>
          {scenes.length} cena{scenes.length !== 1 ? 's' : ''} atribuída{scenes.length !== 1 ? 's' : ''} a este dia
        </p>
      )}

      <button
        className={styles.setupBtn}
        disabled={!selectedDay || scenes.length === 0}
        onClick={() => onStart(shootingDays.find(d => d.id === selectedDay)?.date || selectedDay, scenes)}
      >
        <Play size={16} /> Iniciar Live Board
      </button>
    </div>
  )
}

// ── Vista HOJE ───────────────────────────────────────────────────
function HojeView({ shooting }) {
  const { sceneOrder, scenes, takeLog } = shooting
  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 0' }}>
        {sceneOrder.map((id) => {
          const scene = scenes[id]
          if (!scene) return null
          const takes = (takeLog || []).filter(t => t.sceneId === id)
          return (
            <SceneCard
              key={id}
              context="live"
              scene={toLiveSceneData(scene, takes)}
            />
          )
        })}
      </div>
    </div>
  )
}

// ── Vista AO MOMENTO ─────────────────────────────────────────────
function AoMomentoView({ shooting, canControl, myDept, isAnotadora, role, userId }) {
  const currentScene = shooting.getCurrentScene()
  const nextScene = shooting.getNextScene()
  const progress = shooting.getProgress()

  return (
    <div>
      {/* NOW FILMING */}
      {currentScene && (
        <NowFilmingCard
          scene={currentScene}
          canControl={canControl}
          isAnotadora={isAnotadora}
          shooting={shooting}
          role={role}
          userId={userId}
        />
      )}

      {/* My dept ready (HOD view) */}
      {myDept && currentScene && (
        <MyDeptCard
          scene={currentScene}
          dept={myDept}
          shooting={shooting}
        />
      )}

      {/* Departments */}
      {(canControl || isAnotadora) && currentScene && (
        <DeptReadyCard scene={currentScene} canControl={canControl} shooting={shooting} />
      )}

      {/* Progress */}
      <ProgressCard progress={progress} shooting={shooting} />

      {/* Next scene */}
      {nextScene && (
        <div className={styles.nextCard}>
          <h3 className={styles.nextLabel}>Próxima</h3>
          <div className={styles.nextScene}>
            <span className={styles.nextSceneNum}>Sc.{displaySceneNum(nextScene)}</span>
            <span className={styles.nextSceneLocation}>{nextScene.location}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
              {nextScene.intExt} {nextScene.dayNight}
            </span>
          </div>
        </div>
      )}

      {/* Take log */}
      {(canControl || isAnotadora) && <TakeLogCard shooting={shooting} />}

      {/* Walkie-Talkie */}
      <div style={{ marginTop: 16 }}>
        <WalkieTalkieInterface />
      </div>
    </div>
  )
}

// ── NOW FILMING card ─────────────────────────────────────────────
function NowFilmingCard({ scene, canControl, isAnotadora, shooting, role, userId }) {
  const [noteInput, setNoteInput] = useState('')
  const [timer, setTimer] = useState('00:00')

  // Timer desde startedAt
  useEffect(() => {
    if (!scene.startedAt) return
    const start = new Date(scene.startedAt).getTime()
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000)
      const m = String(Math.floor(elapsed / 60)).padStart(2, '0')
      const s = String(elapsed % 60).padStart(2, '0')
      setTimer(`${m}:${s}`)
    }, 1000)
    return () => clearInterval(interval)
  }, [scene.startedAt])

  const statusLabel = {
    [SCENE_STATUS.WAITING]: 'Em espera',
    [SCENE_STATUS.PREPPING]: 'A preparar',
    [SCENE_STATUS.ROLLING]: 'A filmar',
    [SCENE_STATUS.DONE]: 'Filmada',
    [SCENE_STATUS.POSTPONED]: 'Adiada',
  }

  const handleRecordTake = (status) => {
    // Only allow recording takes when scene is actively rolling
    if (scene.status !== SCENE_STATUS.ROLLING) return
    shooting.recordTake(scene.id, scene.currentTake, status, noteInput, userId, role)
    setNoteInput('')
    if (status !== TAKE_STATUS.OK) {
      shooting.incrementTake(scene.id, userId)
    }
  }

  return (
    <div className={styles.nowCard}>
      <div className={styles.nowHeader}>
        <div className={styles.nowLabel}>
          {scene.status === SCENE_STATUS.ROLLING && <span className={styles.nowPulse} />}
          <Clapperboard size={16} />
          {statusLabel[scene.status] || 'A FILMAR'}
        </div>
        {scene.startedAt && <span className={styles.nowTimer}>{timer}</span>}
      </div>

      <div className={styles.nowScene}>
        <span className={styles.nowSceneNum}>Sc.{displaySceneNum(scene)}</span>
        <div className={styles.nowSceneInfo}>
          <span className={styles.nowSceneLocation}>{scene.location}</span>
          <span className={styles.nowSceneMeta}>
            {scene.intExt && <span>{scene.intExt}</span>}
            {scene.dayNight && <span>{scene.dayNight}</span>}
            {scene.characters?.length > 0 && <span><Users size={11} /> {scene.characters.length}</span>}
          </span>
        </div>
      </div>

      {/* Take counter */}
      {scene.currentTake > 0 && (
        <div className={styles.nowTake}>
          <span className={styles.takeLabel}>Take {scene.currentTake}</span>
          {scene.goodTake && (
            <span style={{ color: 'var(--health-green)', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
              <Check size={12} /> Good take: T{scene.goodTake}
            </span>
          )}
        </div>
      )}

      {/* Digital Slate */}
      {scene.status === SCENE_STATUS.ROLLING && (
        <div style={{ margin: '12px 0' }}>
          <DigitalSlate
            sceneNumber={displaySceneNum(scene)}
            takeNumber={scene.currentTake || 1}
            episode={scene.episodeId || ''}
            date={shooting.day?.date}
            onMark={(data) => {
              shooting.recordTake(scene.id, scene.currentTake, TAKE_STATUS.OK, `Slate mark T${data.take}`, userId, role)
            }}
          />
        </div>
      )}

      {/* Note input for takes */}
      {(canControl || isAnotadora) && scene.status === SCENE_STATUS.ROLLING && (
        <input
          style={{
            width: '100%', padding: '8px 12px', marginBottom: 10,
            background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
            fontSize: 'var(--text-sm)', outline: 'none',
          }}
          placeholder="Nota do take…"
          value={noteInput}
          onChange={e => setNoteInput(e.target.value)}
        />
      )}

      {/* Control actions */}
      {canControl && (
        <div className={styles.actions}>
          {scene.status === SCENE_STATUS.WAITING && (
            <button className={styles.actionBtn} onClick={() => shooting.setSceneStatus(scene.id, SCENE_STATUS.PREPPING, userId)}>
              <Clock size={14} /> Preparar
            </button>
          )}
          {scene.status === SCENE_STATUS.PREPPING && (
            <button className={styles.actionBtn} onClick={() => shooting.setSceneStatus(scene.id, SCENE_STATUS.ROLLING, userId)}>
              <Play size={14} /> Rodar
            </button>
          )}
          {scene.status === SCENE_STATUS.ROLLING && (
            <>
              <button className={`${styles.actionBtn} ${styles.actionBtnOk}`} onClick={() => handleRecordTake(TAKE_STATUS.OK)}>
                <Check size={14} /> BOA
              </button>
              <button className={`${styles.actionBtn} ${styles.actionBtnNok}`} onClick={() => handleRecordTake(TAKE_STATUS.NOK)}>
                <X size={14} /> NOK
              </button>
              <button className={styles.actionBtn} onClick={() => handleRecordTake(TAKE_STATUS.MAYBE)}>
                <AlertTriangle size={14} /> Maybe
              </button>
            </>
          )}
          {(scene.status === SCENE_STATUS.DONE || scene.status === SCENE_STATUS.ROLLING) && (
            <button className={`${styles.actionBtn} ${styles.actionBtnNext}`} onClick={() => {
              if (scene.status === SCENE_STATUS.ROLLING) {
                shooting.setSceneStatus(scene.id, SCENE_STATUS.DONE, userId)
              }
              shooting.advanceToNextScene(userId)
            }}>
              <SkipForward size={14} /> Próxima
            </button>
          )}
          {scene.status !== SCENE_STATUS.DONE && scene.status !== SCENE_STATUS.POSTPONED && (
            <button className={styles.actionBtn} onClick={() => {
              shooting.setSceneStatus(scene.id, SCENE_STATUS.POSTPONED, userId)
              shooting.advanceToNextScene(userId)
            }}>
              Adiar
            </button>
          )}
        </div>
      )}

      {/* Anotadora can also record takes */}
      {isAnotadora && !canControl && scene.status === SCENE_STATUS.ROLLING && (
        <div className={styles.actions}>
          <button className={`${styles.actionBtn} ${styles.actionBtnOk}`} onClick={() => handleRecordTake(TAKE_STATUS.OK)}>
            <Check size={14} /> BOA
          </button>
          <button className={`${styles.actionBtn} ${styles.actionBtnNok}`} onClick={() => handleRecordTake(TAKE_STATUS.NOK)}>
            <X size={14} /> NOK
          </button>
          <button className={styles.actionBtn} onClick={() => handleRecordTake(TAKE_STATUS.MAYBE)}>
            <AlertTriangle size={14} /> Maybe
          </button>
        </div>
      )}
    </div>
  )
}

// ── My Department Card (HOD) ─────────────────────────────────────
function MyDeptCard({ scene, dept, shooting }) {
  const isReady = scene.readyDepts?.[dept]
  const label = DEPT_LABELS[dept] || dept

  return (
    <div className={styles.myDeptCard}>
      <h3 className={styles.deptsTitle}>O meu departamento — {label}</h3>
      <button
        className={`${styles.myDeptBtn} ${isReady ? styles.myDeptBtnReady : ''}`}
        onClick={() => shooting.setDeptReady(scene.id, dept, !isReady)}
      >
        {isReady ? <><Check size={16} /> {label} pronto</> : <><CircleDot size={16} /> Marcar {label} como pronto</>}
      </button>
    </div>
  )
}

// ── Departments Ready Card ───────────────────────────────────────
function DeptReadyCard({ scene, canControl, shooting }) {
  return (
    <div className={styles.deptsCard}>
      <h3 className={styles.deptsTitle}>Departamentos</h3>
      <div className={styles.deptsGrid}>
        {Object.entries(DEPT_LABELS).map(([dept, label]) => {
          const ready = scene.readyDepts?.[dept]
          return (
            <div
              key={dept}
              className={`${styles.deptChip} ${ready ? styles.deptReady : styles.deptWaiting} ${canControl ? styles.deptBtn : ''}`}
              style={{ cursor: canControl ? 'pointer' : 'default' }}
              onClick={canControl ? () => shooting.setDeptReady(scene.id, dept, !ready) : undefined}
            >
              <span className={styles.deptDot} style={{ background: ready ? 'var(--health-green)' : 'var(--text-muted)' }} />
              {label}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Progress Card ────────────────────────────────────────────────
function ProgressCard({ progress, shooting }) {
  const { sceneOrder, scenes } = shooting
  return (
    <div className={styles.progressCard}>
      <h3 className={styles.progressTitle}>Progresso do dia</h3>
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progress.pct}%` }} />
      </div>
      <div className={styles.progressStats}>
        <span>{progress.done}/{progress.total} cenas</span>
        <span>{progress.pct}%</span>
        {progress.postponed > 0 && <span>{progress.postponed} adiadas</span>}
      </div>
      <div className={styles.sceneTimeline}>
        {sceneOrder.map(id => {
          const s = scenes[id]
          if (!s) return null
          const isDone = s.status === SCENE_STATUS.DONE
          const isActive = s.status === SCENE_STATUS.ROLLING || s.status === SCENE_STATUS.PREPPING
          const isPostponed = s.status === SCENE_STATUS.POSTPONED
          return (
            <span
              key={id}
              className={`${styles.scenePill} ${isDone ? styles.scenePillDone : ''} ${isActive ? styles.scenePillActive : ''} ${isPostponed ? styles.scenePillPostponed : ''}`}
            >
              Sc.{displaySceneNum(s)}
            </span>
          )
        })}
      </div>
    </div>
  )
}

// ── Take Log Card (virtualized for 500+ takes) ─────────────────
function TakeLogCard({ shooting }) {
  const { takeLog } = shooting
  const parentRef = useRef(null)

  const reversed = useMemo(() => [...takeLog].reverse(), [takeLog])

  const virtualizer = useVirtualizer({
    count: reversed.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 10,
  })

  if (takeLog.length === 0) return null

  return (
    <div className={styles.takeLogCard}>
      <h3 className={styles.takeLogTitle}>Registo de Takes</h3>
      <div ref={parentRef} className={styles.takeLogList}>
        <div style={{ height: virtualizer.getTotalSize(), position: 'relative', width: '100%' }}>
          {virtualizer.getVirtualItems().map(virtualRow => {
            const t = reversed[virtualRow.index]
            return (
              <div
                key={t.id}
                ref={virtualizer.measureElement}
                data-index={virtualRow.index}
                className={styles.takeLogItem}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <span className={styles.takeLogNum}>Sc.{t.sceneId?.split('-').slice(1).join('-') || t.sceneId} T{t.number}</span>
                <span className={`${styles.takeLogStatus} ${t.status === 'ok' ? styles.takeLogOk : t.status === 'nok' ? styles.takeLogNok : styles.takeLogMaybe}`}>
                  {t.status.toUpperCase()}
                </span>
                <span className={styles.takeLogNote}>{t.notes || '—'}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {ROLES[t.notedByRole]?.label || t.notedByRole}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Cast View (read-only) ────────────────────────────────────────
function CastView({ shooting, role }) {
  const currentScene = shooting.getCurrentScene()
  const nextScene = shooting.getNextScene()
  const progress = shooting.getProgress()

  return (
    <div className={styles.actorCard}>
      {currentScene ? (
        <>
          <h2 className={styles.actorCardTitle}>
            <Clapperboard size={18} style={{ marginRight: 6 }} />
            Sc.{displaySceneNum(currentScene)} — {currentScene.location}
          </h2>
          <p className={styles.actorCardSub}>
            {currentScene.status === SCENE_STATUS.ROLLING
              ? `A filmar — Take ${currentScene.currentTake}`
              : currentScene.status === SCENE_STATUS.PREPPING
                ? 'A preparar'
                : 'Em espera'}
          </p>

          {nextScene && (
            <div className={styles.actorNextScene}>
              <p className={styles.actorNextLabel}>A tua próxima cena</p>
              <p className={styles.actorNextTitle}>
                Sc.{displaySceneNum(nextScene)} — {nextScene.location}
              </p>
            </div>
          )}

          {nextScene && (
            <div className={styles.actorAlert}>
              <AlertTriangle size={16} />
              Prepara-te para a próxima cena
            </div>
          )}
        </>
      ) : (
        <>
          <h2 className={styles.actorCardTitle}>Sem cena activa</h2>
          <p className={styles.actorCardSub}>{progress.done}/{progress.total} cenas feitas hoje</p>
        </>
      )}
    </div>
  )
}
