// Pré-Produção — cards expansíveis por entidade
// Equipa · Elenco · Locais · Checklist
// Cada card: status inline + painel de detalhe com notas, contactos, cobre-também

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash2, Check, Clock, Circle, Clapperboard,
  Users, MapPin, ListChecks, UserCheck,
  ChevronDown, ChevronRight, Phone, Mail, Home,
  FileText, Link2, Camera, Euro,
} from 'lucide-react'
import { useStore } from '../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import styles from './PreProduction.module.css'

// ── Checklist geral ───────────────────────────────────────────────
const CHECKLIST = [
  { title: 'Guião — versão final aprovada',           daysBeforeShoot: 60 },
  { title: 'Breakdown do guião por cena',             daysBeforeShoot: 55 },
  { title: 'Plano de rodagem preliminar',             daysBeforeShoot: 50 },
  { title: 'Seguros de produção activos',             daysBeforeShoot: 30 },
  { title: 'Lista de adereços por cena',              daysBeforeShoot: 21 },
  { title: 'Guarda-roupa — aprovação e continuidade', daysBeforeShoot: 14 },
  { title: 'Table read — elenco completo',            daysBeforeShoot: 14 },
  { title: 'Fotos de referência — continuidade',      daysBeforeShoot: 7  },
  { title: 'Ensaios de cena — cenas âncora',          daysBeforeShoot: 7  },
  { title: 'Figurantes confirmados',                  daysBeforeShoot: 7  },
  { title: 'Folhas de serviço — todas as rodagens',   daysBeforeShoot: 3  },
  { title: 'Ensaio técnico — dias de rodagem',        daysBeforeShoot: 3  },
  { title: 'Protocolo de media management',           daysBeforeShoot: 3  },
  { title: 'Transporte equipa confirmado',            daysBeforeShoot: 5  },
  { title: 'Catering confirmado',                     daysBeforeShoot: 5  },
  { title: 'Verificação equipamento completo',        daysBeforeShoot: 1  },
]

// ── Cargos técnicos standard ──────────────────────────────────────
const CREW_POSITIONS = [
  { id: 'realizador',   label: 'Realizador',                  group: 'Realização' },
  { id: 'ad1',          label: '1º Assistente de Realização',  group: 'Realização' },
  { id: 'ad2',          label: '2º Assistente de Realização',  group: 'Realização' },
  { id: 'scriptsup',   label: 'Script Supervisor',             group: 'Realização' },
  { id: 'dop',          label: 'Director de Fotografia',       group: 'Imagem' },
  { id: 'cam_op',       label: 'Operador de Câmara',           group: 'Imagem' },
  { id: 'ac1',          label: '1º Assistente de Câmara',      group: 'Imagem' },
  { id: 'gaffer',       label: 'Gaffer',                       group: 'Electricidade' },
  { id: 'electricista', label: 'Electricista',                 group: 'Electricidade' },
  { id: 'sound_dir',   label: 'Director de Som',               group: 'Som' },
  { id: 'boom',         label: 'Operador de Boom',             group: 'Som' },
  { id: 'art_dir',      label: 'Director de Arte',             group: 'Arte' },
  { id: 'cenografo',    label: 'Cenógrafo',                    group: 'Arte' },
  { id: 'aderecador',   label: 'Adereçador',                   group: 'Arte' },
  { id: 'guarda_roupa', label: 'Guarda-Roupa',                 group: 'Arte' },
  { id: 'maquilhagem',  label: 'Maquilhagem',                  group: 'Arte' },
  { id: 'prod_dir',     label: 'Director de Produção',         group: 'Produção' },
  { id: 'prod_coord',   label: 'Coordenador de Produção',      group: 'Produção' },
  { id: 'ap',           label: 'Assistente de Produção',       group: 'Produção' },
  { id: 'continuidade', label: 'Continuidade',                 group: 'Produção' },
]
const CREW_GROUPS = ['Realização', 'Imagem', 'Electricidade', 'Som', 'Arte', 'Produção']

// ── Status cycles ─────────────────────────────────────────────────
const TASK_CYCLE = { 'a fazer':'em curso',       'em curso':'feito',         'feito':'a fazer'              }
const CAST_CYCLE = { 'a contactar':'em audição', 'em audição':'confirmado',  'confirmado':'contratado',  'contratado':'a contactar' }
const CREW_CYCLE = { 'por confirmar':'confirmado','confirmado':'contratado', 'contratado':'por confirmar'   }
const LOC_CYCLE  = { 'pendente':'em curso',       'em curso':'ok',           'ok':'pendente'                }

const TASK_CLS = { 'feito':'done','em curso':'inprog','a fazer':'todo' }
const TASK_ICO = { 'feito':<Check size={13}/>,'em curso':<Clock size={13}/>,'a fazer':<Circle size={13}/> }

function castCls(s)  { return s==='contratado'||s==='confirmado'?'done':s==='em audição'?'inprog':'todo' }
function castIco(s)  { return s==='contratado'||s==='confirmado'?<Check size={13}/>:s==='em audição'?<Clock size={13}/>:<Circle size={13}/> }
function crewCls(s)  { return s==='contratado'?'done':s==='confirmado'?'inprog':'todo' }
function crewIco(s)  { return s==='contratado'?<Check size={13}/>:s==='confirmado'?<Check size={13}/>:<Circle size={13}/> }
function locCls(s)   { return s==='ok'?'done':s==='em curso'?'inprog':'todo' }
function locIco(s)   { return s==='ok'?<Check size={13}/>:s==='em curso'?<Clock size={13}/>:<Circle size={13}/> }

const TABS = [
  { id:'checklist', label:'Checklist', icon:ListChecks },
  { id:'elenco',    label:'Elenco',    icon:Users },
  { id:'locais',    label:'Locais',    icon:MapPin },
  { id:'equipa',    label:'Equipa',    icon:UserCheck },
]

// ── Helpers UI ────────────────────────────────────────────────────
function ParamField({ label, value, onChange, placeholder }) {
  return (
    <div style={{ display:'flex',flexDirection:'column',gap:2 }}>
      <span style={{ fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'var(--text-muted)' }}>{label}</span>
      <input style={{ background:'var(--bg-elevated)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-md)',padding:'4px 8px',width:80,fontFamily:'var(--font-display)',fontSize:'var(--text-sm)',fontWeight:700,color:'var(--text-primary)',outline:'none' }}
        value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} />
    </div>
  )
}

function daysUntil(d) {
  if (!d) return null
  return Math.ceil((new Date(d)-new Date())/86400000)
}
function deadline(days, shoot) {
  if (!shoot||!days) return null
  const d=new Date(shoot); d.setDate(d.getDate()-Number(days))
  return d.toLocaleDateString('pt-PT',{day:'numeric',month:'short'})
}

function StatPill({ label, value, color }) {
  return (
    <span style={{ display:'inline-flex',alignItems:'center',gap:4,padding:'2px 8px',borderRadius:'var(--radius-full)',background:color?`${color}18`:'var(--bg-elevated)',border:`1px solid ${color?`${color}40`:'var(--border-subtle)'}`,fontSize:'var(--text-xs)',color:color||'var(--text-muted)',fontWeight:600 }}>
      {value} <span style={{ fontWeight:400,opacity:0.7 }}>{label}</span>
    </span>
  )
}

function SBtn({ cls, ico, onCycle, title }) {
  return (
    <button className={`${styles.statusBtn} ${styles[cls]}`} onClick={e=>{e.stopPropagation();onCycle()}} title={title}>
      {ico}
    </button>
  )
}

// ── Painel de detalhe inline ──────────────────────────────────────
function DetailField({ label, value, onChange, placeholder, multiline, icon: Icon }) {
  return (
    <div className={styles.detailField}>
      {Icon && <Icon size={12} style={{ color:'var(--text-muted)',flexShrink:0,marginTop:3 }} />}
      <div className={styles.detailFieldInner}>
        <label className={styles.detailLabel}>{label}</label>
        {multiline
          ? <textarea className={styles.detailTextarea} placeholder={placeholder} value={value||''} onChange={e=>onChange(e.target.value)} rows={3} />
          : <input    className={styles.detailInput}    placeholder={placeholder} value={value||''} onChange={e=>onChange(e.target.value)} />
        }
      </div>
    </div>
  )
}

// ── Módulo principal ──────────────────────────────────────────────
export function PreProductionModule() {
  const {
    preProduction, projectName, projectParams,
    parsedCharacters, parsedLocations, parsedScripts,
    team, locations, budgets,
    setShootDate, setProjectParams,
    addTask, updateTask, removeTask,
    setCastingStatus, setCastingDetail,
    setCrewMember,
    setLocationSubStatus, setLocationDetail,
   } = useStore(useShallow(s => ({ preProduction: s.preProduction, projectName: s.projectName, projectParams: s.projectParams, parsedCharacters: s.parsedCharacters, parsedLocations: s.parsedLocations, parsedScripts: s.parsedScripts, team: s.team, locations: s.locations, budgets: s.budgets, setShootDate: s.setShootDate, setProjectParams: s.setProjectParams, addTask: s.addTask, updateTask: s.updateTask, removeTask: s.removeTask, setCastingStatus: s.setCastingStatus, setCastingDetail: s.setCastingDetail, setCrewMember: s.setCrewMember, setLocationSubStatus: s.setLocationSubStatus, setLocationDetail: s.setLocationDetail })))

  const {
    shootDate, tasks,
    castingStatus={}, castingDetails={},
    crewStatus={},
    locationSubStatus={}, locationDetails={},
  } = preProduction

  useEffect(() => {
    if (tasks.length===0) {
      CHECKLIST.forEach(t=>addTask({
        id:`t_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
        title:t.title, daysBeforeShoot:t.daysBeforeShoot,
        assignee:'', status:'a fazer', notes:'',
      }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  const [activeTab,    setActiveTab]    = useState('checklist')
  const [filterStatus, setFilterStatus] = useState('all')
  const [search,       setSearch]       = useState('')
  const [expandedKey,  setExpandedKey]  = useState(null)   // key único do card aberto
  const [addingTask,   setAddingTask]   = useState(false)
  const [newTask,      setNewTask]      = useState({title:'',daysBeforeShoot:14,assignee:'',notes:''})
  const [openGroups,   setOpenGroups]   = useState(CREW_GROUPS.reduce((a,g)=>({...a,[g]:true}),{}))

  const toggleExpand = (key) => setExpandedKey(prev=>prev===key?null:key)
  const toggleGroup  = (g)   => setOpenGroups(prev=>({...prev,[g]:!prev[g]}))

  const dToShoot = daysUntil(shootDate)
  const nScripts = Object.keys(parsedScripts).length

  // Stats
  const taskStats = {
    todo:  tasks.filter(t=>t.status==='a fazer').length,
    inprog:tasks.filter(t=>t.status==='em curso').length,
    done:  tasks.filter(t=>t.status==='feito').length,
  }
  const castDone    = parsedCharacters.filter(c=>{
    if (['confirmado','contratado'].includes(castingStatus[c.name])) return true
    // Also count as done if matched from team module
    if (!castingStatus[c.name]) {
      const castMatch = team.find(m => m.characterName?.toLowerCase() === c.name.toLowerCase())
      if (castMatch) return true
    }
    return false
  }).length
  const locDone     = parsedLocations.filter(l=>{const s=locationSubStatus[l]||{};return s.autorização==='ok'&&s.recce==='ok'}).length
  const crewDone    = CREW_POSITIONS.filter(p=>{
    const cs = crewStatus[p.id]||{}
    if (['confirmado','contratado'].includes(cs.status)) return true
    // Also count as done if matched from team module
    if (!cs.status || cs.status === 'por confirmar') {
      const teamMatch = team.find(m => {
        const role = (m.role || '').toLowerCase()
        const label = p.label.toLowerCase()
        return role.includes(label) || label.includes(role)
      })
      if (teamMatch) return true
    }
    return false
  }).length

  const tabBadge = {
    checklist: taskStats.todo+taskStats.inprog,
    elenco:    parsedCharacters.length-castDone,
    locais:    parsedLocations.length-locDone,
    equipa:    CREW_POSITIONS.length-crewDone,
  }

  const handleAddTask = () => {
    if (!newTask.title.trim()) return
    addTask({ id:`t_${Date.now()}`, title:newTask.title.trim(), daysBeforeShoot:Number(newTask.daysBeforeShoot)||7, assignee:newTask.assignee.trim(), status:'a fazer', notes:newTask.notes.trim() })
    setNewTask({title:'',daysBeforeShoot:14,assignee:'',notes:''})
    setAddingTask(false)
  }

  const STATUS_FILTERS = {
    checklist:[['all','Todos'],['a fazer','Por fazer'],['em curso','Em curso'],['feito','Feitos']],
    elenco:   [['all','Todos'],['a contactar','A contactar'],['em audição','Em audição'],['confirmado','Confirmado'],['contratado','Contratado']],
    locais:   [['all','Todos'],['pendente','Pendente'],['em curso','Em curso'],['ok','OK']],
    equipa:   [['all','Todos'],['por confirmar','Por confirmar'],['confirmado','Confirmado'],['contratado','Contratado']],
  }

  return (
    <div className={styles.root}>
      {/* ── Cabeçalho ── */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Pré-Produção</h2>
          <p className={styles.sub}>{projectName}</p>
        </div>
        <div style={{display:'flex',gap:'var(--space-2)',flexWrap:'wrap',alignSelf:'center'}}>
          {nScripts>0
            ?<>
              <StatPill value={nScripts}               label={nScripts===1?'guião':'guiões'}  color="var(--mod-script)" />
              <StatPill value={parsedCharacters.length} label="personagens" />
              <StatPill value={parsedLocations.length}  label="locais" />
            </>
            :<span style={{fontSize:'var(--text-xs)',color:'var(--text-muted)'}}>Carrega guiões para povoar Elenco e Locais</span>
          }
          {budgets?.[0]&&(()=>{
            const b=budgets[0]
            const total=b.categories?.reduce((s,cat)=>s+(cat.items||[]).reduce((ss,it)=>ss+(Number(it.total)||0),0),0)||b.total||0
            return total>0?<StatPill value={`€${Math.round(total).toLocaleString('pt-PT')}`} label="orçamento" color="var(--health-yellow)"/>:null
          })()}
          {team.length>0&&<StatPill value={team.length} label="equipa" color="var(--accent)"/>}
        </div>
        <div className={styles.paramsBar}>
          <ParamField label="Episódios"  value={projectParams.episodes}       onChange={v=>setProjectParams({episodes:v})}       placeholder="6"      />
          <ParamField label="Duração"    value={projectParams.episodeDuration} onChange={v=>setProjectParams({episodeDuration:v})} placeholder="25 min" />
          <ParamField label="Dias rod."  value={projectParams.shootDays}       onChange={v=>setProjectParams({shootDays:v})}       placeholder="6"      />
          <div className={styles.shootDateBlock}>
            <Clapperboard size={13} color="var(--mod-pre-prod)" />
            <span className={styles.shootLabel}>Início</span>
            <input type="date" className={styles.dateInput} value={shootDate} onChange={e=>setShootDate(e.target.value)} />
            {dToShoot!==null&&(
              <span className={styles.dcount}>
                {dToShoot>0?`D-${dToShoot}`:dToShoot===0?'Hoje!':`D+${Math.abs(dToShoot)}`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className={styles.tabBar}>
        {TABS.map(tab=>{
          const Icon=tab.icon; const n=tabBadge[tab.id]
          return (
            <button key={tab.id}
              className={`${styles.tab} ${activeTab===tab.id?styles.tabActive:''}`}
              onClick={()=>{setActiveTab(tab.id);setFilterStatus('all');setSearch('');setExpandedKey(null)}}>
              <Icon size={14}/> {tab.label}
              {n>0&&<span className={styles.tabBadge}>{n}</span>}
            </button>
          )
        })}
      </div>

      {/* ── Corpo ── */}
      <div className={styles.taskCol}>
        {/* Barra de controlo */}
        <div className={styles.colHeader}>
          <div style={{display:'flex',gap:'var(--space-2)',flex:1,flexWrap:'wrap',alignItems:'center'}}>
            {STATUS_FILTERS[activeTab].map(([val,lbl])=>(
              <button key={val} onClick={()=>setFilterStatus(val===filterStatus?'all':val)}
                className={`${styles.filterPill} ${filterStatus===val?styles.filterPillActive:''}`}>{lbl}</button>
            ))}
            <input className={styles.searchInput} placeholder="Pesquisar…" value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          {activeTab==='checklist'&&(
            <button className={styles.btnAdd} onClick={()=>setAddingTask(v=>!v)}><Plus size={14}/> Nova tarefa</button>
          )}
        </div>

        {/* ════ CHECKLIST ════ */}
        {activeTab==='checklist'&&(
          <>
            <div className={styles.tabContext}>
              <StatPill value={taskStats.done}  label="concluídas" color="var(--health-green)" />
              <StatPill value={taskStats.inprog} label="em curso"  color="var(--health-yellow)" />
              <StatPill value={taskStats.todo}   label="por fazer" />
            </div>
            <AnimatePresence>
              {addingTask&&(
                <motion.div className={styles.addTaskForm} initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}>
                  <input className={styles.inputLarge} placeholder="Nome da tarefa" autoFocus
                    value={newTask.title} onChange={e=>setNewTask(v=>({...v,title:e.target.value}))}
                    onKeyDown={e=>e.key==='Enter'&&handleAddTask()} />
                  <div className={styles.formRow}>
                    <div className={styles.formField}>
                      <label className={styles.fieldLabel}>Dias antes da rodagem</label>
                      <input type="number" className={styles.inputSmall} min={1} max={365}
                        value={newTask.daysBeforeShoot} onChange={e=>setNewTask(v=>({...v,daysBeforeShoot:e.target.value}))} />
                      {shootDate&&<span className={styles.dateHint}>{deadline(newTask.daysBeforeShoot,shootDate)}</span>}
                    </div>
                    <div className={styles.formField}>
                      <label className={styles.fieldLabel}>Responsável</label>
                      <input className={styles.input} placeholder="Nome…" value={newTask.assignee} onChange={e=>setNewTask(v=>({...v,assignee:e.target.value}))} />
                    </div>
                  </div>
                  <div className={styles.formBtns}>
                    <button className={styles.btnCancel} onClick={()=>setAddingTask(false)}>Cancelar</button>
                    <button className={styles.btnConfirm} onClick={handleAddTask}>Adicionar</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className={styles.taskList}>
              {tasks
                .filter(t=>filterStatus==='all'||t.status===filterStatus)
                .filter(t=>!search||t.title.toLowerCase().includes(search.toLowerCase()))
                .sort((a,b)=>Number(b.daysBeforeShoot)-Number(a.daysBeforeShoot))
                .map(task=>{
                  const dl=deadline(task.daysBeforeShoot,shootDate)
                  const key=`task-${task.id}`
                  const open=expandedKey===key
                  return (
                    <motion.div key={task.id} className={`${styles.card} ${styles[TASK_CLS[task.status]]}`} layout>
                      {/* Row */}
                      <div className={styles.cardRow} onClick={()=>toggleExpand(key)}>
                        <SBtn cls={TASK_CLS[task.status]} ico={TASK_ICO[task.status]}
                          onCycle={()=>updateTask(task.id,{status:TASK_CYCLE[task.status]})} title={task.status} />
                        <span className={styles.cardTitle}>{task.title}</span>
                        <div className={styles.cardMeta}>
                          {shootDate&&dl&&<span className={styles.taskDate}>D-{task.daysBeforeShoot} <span className={styles.taskDateReal}>{dl}</span></span>}
                          {task.assignee&&<span className={styles.assigneeChip} style={{background:'rgba(100,100,200,0.1)',borderColor:'rgba(100,100,200,0.25)',color:'var(--text-secondary)'}}>{task.assignee}</span>}
                          <button className={styles.deleteBtn} onClick={e=>{e.stopPropagation();removeTask(task.id)}}><Trash2 size={12}/></button>
                        </div>
                        <ChevronDown size={13} className={`${styles.expandIcon} ${open?styles.expandIconOpen:''}`} />
                      </div>
                      {/* Detalhe */}
                      <AnimatePresence>
                        {open&&(
                          <motion.div className={styles.cardDetail} initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}>
                            <div className={styles.detailGrid}>
                              <DetailField icon={UserCheck} label="Responsável" placeholder="Quem trata disto?"
                                value={task.assignee} onChange={v=>updateTask(task.id,{assignee:v})} />
                              <DetailField icon={FileText} label="Notas" placeholder="Contexto, observações…"
                                value={task.notes} onChange={v=>updateTask(task.id,{notes:v})} multiline />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
            </div>
          </>
        )}

        {/* ════ ELENCO ════ */}
        {activeTab==='elenco'&&(
          <>
            <div className={styles.tabContext}>
              {nScripts===0
                ?<span style={{fontSize:'var(--text-xs)',color:'var(--text-muted)'}}>Carrega guiões — as personagens aparecem aqui</span>
                :<><StatPill value={castDone} label="confirmados/contratados" color="var(--health-green)"/>
                   <StatPill value={parsedCharacters.length-castDone} label="por tratar"/></>
              }
            </div>
            <div className={styles.taskList}>
              {parsedCharacters
                .filter(c=>{
                  const castMatch = team.find(m => m.characterName?.toLowerCase() === c.name.toLowerCase())
                  const effectiveSt = castingStatus[c.name] || (castMatch ? 'confirmado' : 'a contactar')
                  return filterStatus==='all' || effectiveSt===filterStatus
                })
                .filter(c=>!search||c.name.toLowerCase().includes(search.toLowerCase()))
                .sort((a,b)=>(b.lineCount||0)-(a.lineCount||0))
                .map(c=>{
                  const castMatch = team.find(m => m.characterName?.toLowerCase() === c.name.toLowerCase())
                  const manualSt = castingStatus[c.name]
                  const st  = manualSt || (castMatch ? 'confirmado' : 'a contactar')
                  const det = castingDetails[c.name]||{}
                  const actorName = det.actorName || (castMatch?.name || '')
                  const contact = det.contact || (castMatch ? (castMatch.phone || castMatch.email || '') : '')
                  const fromTeam = !manualSt && !!castMatch
                  const key = `cast-${c.name}`
                  const open= expandedKey===key
                  return (
                    <motion.div key={c.name} className={`${styles.card} ${styles[castCls(st)]}`} layout>
                      <div className={styles.cardRow} onClick={()=>toggleExpand(key)}>
                        <SBtn cls={castCls(st)} ico={castIco(st)}
                          onCycle={()=>setCastingStatus(c.name,CAST_CYCLE[st])} title={st} />
                        <div className={styles.cardInfo}>
                          <span className={styles.cardTitle}>{c.name}</span>
                          <span className={styles.cardSub}>
                            {c.scenes?.length??0} cenas · {c.lineCount??0} falas
                            {actorName&&<> · <strong>{actorName}</strong></>}
                          </span>
                        </div>
                        {fromTeam&&<span style={{fontSize:9,padding:'1px 6px',borderRadius:'var(--radius-full)',background:'var(--accent-light)',color:'var(--accent)',fontWeight:600,whiteSpace:'nowrap'}}>← Equipa</span>}
                        <span className={styles.statusLabel} style={{color:st==='contratado'?'var(--health-green)':st==='confirmado'?'var(--health-green)':st==='em audição'?'var(--health-yellow)':'var(--text-muted)'}}>{st}</span>
                        <ChevronDown size={13} className={`${styles.expandIcon} ${open?styles.expandIconOpen:''}`} />
                      </div>
                      <AnimatePresence>
                        {open&&(
                          <motion.div className={styles.cardDetail} initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}>
                            <div className={styles.detailGrid}>
                              <DetailField icon={UserCheck} label="Interpretado por" placeholder="Nome do actor/actriz"
                                value={det.actorName || actorName} onChange={v=>setCastingDetail(c.name,{actorName:v})} />
                              <DetailField icon={Phone} label="Contacto" placeholder="Telefone ou email"
                                value={det.contact || contact} onChange={v=>setCastingDetail(c.name,{contact:v})} />
                              <DetailField icon={FileText} label="Notas" placeholder="Disponibilidade, observações, agente…"
                                value={det.notes} onChange={v=>setCastingDetail(c.name,{notes:v})} multiline />
                              {castMatch&&!det.actorName&&(
                                <div style={{fontSize:'var(--text-xs)',color:'var(--text-muted)',fontStyle:'italic',padding:'4px 0'}}>
                                  Dados preenchidos a partir do módulo Equipa ({castMatch.name})
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              {parsedCharacters.length===0&&(
                <div className={styles.empty}><Users size={28} color="var(--text-muted)"/><p>Sem personagens — carrega um guião</p></div>
              )}
            </div>
          </>
        )}

        {/* ════ LOCAIS ════ */}
        {activeTab==='locais'&&(
          <>
            <div className={styles.tabContext}>
              {nScripts===0
                ?<span style={{fontSize:'var(--text-xs)',color:'var(--text-muted)'}}>Carrega guiões — os locais aparecem aqui</span>
                :<><StatPill value={locDone} label="locais OK" color="var(--health-green)"/>
                   <StatPill value={parsedLocations.length-locDone} label="por tratar"/></>
              }
            </div>
            <div className={styles.taskList}>
              {parsedLocations
                .filter(l=>{
                  if (filterStatus==='all') return true
                  const s=locationSubStatus[l]||{}
                  if (filterStatus==='ok')       return s.autorização==='ok'&&s.recce==='ok'
                  if (filterStatus==='em curso') return s.autorização==='em curso'||s.recce==='em curso'
                  return (!s.autorização||s.autorização==='pendente')&&(!s.recce||s.recce==='pendente')
                })
                .filter(l=>!search||l.toLowerCase().includes(search.toLowerCase()))
                .sort()
                .map(loc=>{
                  const sub = locationSubStatus[loc]||{}
                  const det = locationDetails[loc]||{}
                  const locMatch = locations.find(l =>
                    l.name?.toLowerCase() === loc.toLowerCase() ||
                    l.displayName?.toLowerCase() === loc.toLowerCase()
                  )
                  const address = det.address || (locMatch?.address || '')
                  const contact = det.contact || (locMatch?.contact || '')
                  const notes = det.notes || (locMatch?.notes || '')
                  const fromLocs = !!locMatch && !det.address && !det.contact
                  const autSt=sub.autorização||'pendente'
                  const recSt=sub.recce||'pendente'
                  const key=`loc-${loc}`
                  const open=expandedKey===key
                  return (
                    <motion.div key={loc} className={`${styles.card} ${locDone&&autSt==='ok'&&recSt==='ok'?styles.done:''}`} layout>
                      <div className={styles.cardRow} onClick={()=>toggleExpand(key)}>
                        <span className={styles.cardTitle} style={{flex:1}}>{loc}</span>
                        {fromLocs&&<span style={{fontSize:9,padding:'1px 6px',borderRadius:'var(--radius-full)',background:'var(--accent-light)',color:'var(--accent)',fontWeight:600,whiteSpace:'nowrap'}}>← Locais</span>}
                        {locMatch?.status&&<span style={{fontSize:9,padding:'1px 6px',borderRadius:'var(--radius-full)',background:locMatch.status==='confirmado'?'rgba(46,160,128,0.15)':locMatch.status==='recusado'?'rgba(231,76,60,0.15)':'rgba(245,166,35,0.15)',color:locMatch.status==='confirmado'?'var(--health-green)':locMatch.status==='recusado'?'#E74C3C':'var(--health-yellow)',fontWeight:600}}>{locMatch.status}</span>}
                        {/* Sub-estados inline */}
                        <div className={styles.locSubTasks} onClick={e=>e.stopPropagation()}>
                          <div className={styles.locSubTask}>
                            <SBtn cls={locCls(autSt)} ico={locIco(autSt)}
                              onCycle={()=>setLocationSubStatus(loc,'autorização',LOC_CYCLE[autSt])} title={`Autorização: ${autSt}`} />
                            <span className={styles.locSubLabel}>Autorização</span>
                          </div>
                          <div className={styles.locSubTask}>
                            <SBtn cls={locCls(recSt)} ico={locIco(recSt)}
                              onCycle={()=>setLocationSubStatus(loc,'recce',LOC_CYCLE[recSt])} title={`Recce: ${recSt}`} />
                            <span className={styles.locSubLabel}>Recce</span>
                          </div>
                        </div>
                        <ChevronDown size={13} className={`${styles.expandIcon} ${open?styles.expandIconOpen:''}`} />
                      </div>
                      <AnimatePresence>
                        {open&&(
                          <motion.div className={styles.cardDetail} initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}>
                            <div className={styles.detailGrid}>
                              <DetailField icon={Home} label="Morada" placeholder="Rua, cidade…"
                                value={det.address || address} onChange={v=>setLocationDetail(loc,{address:v})} />
                              <DetailField icon={Phone} label="Contacto responsável" placeholder="Nome + telefone"
                                value={det.contact || contact} onChange={v=>setLocationDetail(loc,{contact:v})} />
                              <DetailField icon={FileText} label="Notas" placeholder="Acesso, restrições, horários…"
                                value={det.notes || notes} onChange={v=>setLocationDetail(loc,{notes:v})} multiline />
                              {locMatch?.accessNotes&&(
                                <div style={{fontSize:'var(--text-xs)',color:'var(--text-muted)',padding:'4px 0'}}>
                                  <strong>Acesso:</strong> {locMatch.accessNotes}
                                </div>
                              )}
                              {locMatch&&!det.address&&(
                                <div style={{fontSize:'var(--text-xs)',color:'var(--text-muted)',fontStyle:'italic',padding:'4px 0'}}>
                                  Dados preenchidos a partir do módulo Locais
                                </div>
                              )}
                              <div className={styles.mediaPlaceholder}>
                                <Camera size={14} color="var(--text-muted)"/>
                                <span>Fotos e documentos — em breve</span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              {parsedLocations.length===0&&(
                <div className={styles.empty}><MapPin size={28} color="var(--text-muted)"/><p>Sem locais — carrega um guião</p></div>
              )}
            </div>
          </>
        )}

        {/* ════ EQUIPA ════ */}
        {activeTab==='equipa'&&(
          <>
            <div className={styles.tabContext}>
              <StatPill value={crewDone}                      label="confirmados/contratados" color="var(--health-green)"/>
              <StatPill value={CREW_POSITIONS.length-crewDone} label="por confirmar"/>
            </div>
            <div className={styles.crewList}>
              {CREW_GROUPS.map(group=>{
                const positions=CREW_POSITIONS.filter(p=>p.group===group)
                const visible=positions
                  .filter(p=>{
                    if (filterStatus==='all') return true
                    const cs = crewStatus[p.id]||{}
                    const hasManual = cs.status && cs.status !== 'por confirmar'
                    const tm = team.find(m => {
                      const role = (m.role || '').toLowerCase()
                      const label = p.label.toLowerCase()
                      return role.includes(label) || label.includes(role)
                    })
                    const effectiveSt = hasManual ? cs.status : (tm ? 'confirmado' : 'por confirmar')
                    return effectiveSt === filterStatus
                  })
                  .filter(p=>!search||p.label.toLowerCase().includes(search.toLowerCase()))
                if (visible.length===0) return null
                const doneInGroup=positions.filter(p=>['confirmado','contratado'].includes((crewStatus[p.id]||{}).status)).length
                return (
                  <div key={group} className={styles.crewGroup}>
                    <button className={styles.crewGroupHeader} onClick={()=>toggleGroup(group)}>
                      {openGroups[group]?<ChevronDown size={14}/>:<ChevronRight size={14}/>}
                      <span>{group}</span>
                      <span className={styles.crewGroupCount}>{doneInGroup}/{positions.length}</span>
                    </button>
                    <AnimatePresence>
                      {openGroups[group]&&(
                        <motion.div className={styles.crewGroupItems}
                          initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}>
                          {visible.map(pos=>{
                            const cs  = crewStatus[pos.id]||{}
                            // Check if team has a matching member
                            const teamMatch = team.find(m => {
                              const role = (m.role || '').toLowerCase()
                              const label = pos.label.toLowerCase()
                              return role.includes(label) || label.includes(role)
                            })
                            const hasManualEntry = cs.status && cs.status !== 'por confirmar'
                            const fromTeam = !hasManualEntry && !!teamMatch
                            const st  = hasManualEntry ? cs.status : (teamMatch ? 'confirmado' : (cs.status||'por confirmar'))
                            const nm  = cs.name || (teamMatch?.name || '')
                            const key = `crew-${pos.id}`
                            const open= expandedKey===key
                            // Se este cargo está coberto por outra pessoa via coversRoles
                            const coveredBy = CREW_POSITIONS.find(p=>p.id!==pos.id&&((crewStatus[p.id]||{}).coversRoles||[]).includes(pos.id))
                            return (
                              <div key={pos.id} className={styles.crewCardWrap}>
                                <div className={`${styles.crewRow} ${styles[crewCls(st)]}`} onClick={()=>toggleExpand(key)}>
                                  <SBtn cls={crewCls(st)} ico={crewIco(st)}
                                    onCycle={()=>setCrewMember(pos.id,{status:CREW_CYCLE[st]})} title={st} />
                                  <span className={styles.crewLabel}>{pos.label}</span>
                                  {coveredBy
                                    ?<span className={styles.crewCoveredBy}>→ {(crewStatus[coveredBy.id]||{}).name||coveredBy.label}</span>
                                    :<input className={styles.crewNameInput} placeholder="Nome…" value={nm}
                                        onClick={e=>e.stopPropagation()}
                                        onChange={e=>setCrewMember(pos.id,{name:e.target.value})} />
                                  }
                                  {fromTeam&&<span style={{fontSize:9,padding:'1px 6px',borderRadius:'var(--radius-full)',background:'var(--accent-light)',color:'var(--accent)',fontWeight:600,whiteSpace:'nowrap'}}>← Equipa</span>}
                                  <span className={styles.crewStatus} style={{color:st==='contratado'?'var(--health-green)':st==='confirmado'?'var(--health-yellow)':'var(--text-muted)'}}>{st}</span>
                                  <ChevronDown size={13} className={`${styles.expandIcon} ${open?styles.expandIconOpen:''}`}/>
                                </div>
                                <AnimatePresence>
                                  {open&&(
                                    <motion.div className={styles.cardDetail} initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}>
                                      <div className={styles.detailGrid}>
                                        <DetailField icon={UserCheck} label="Nome" placeholder="Nome completo"
                                          value={nm} onChange={v=>setCrewMember(pos.id,{name:v})} />
                                        <DetailField icon={Phone} label="Contacto" placeholder="Telefone ou email"
                                          value={cs.contact || (teamMatch?.phone || teamMatch?.email || '')} onChange={v=>setCrewMember(pos.id,{contact:v})} />
                                        <DetailField icon={FileText} label="Notas" placeholder="Empresa, observações, disponibilidade…"
                                          value={cs.notes} onChange={v=>setCrewMember(pos.id,{notes:v})} multiline />
                                        {fromTeam&&(
                                          <div style={{fontSize:'var(--text-xs)',color:'var(--text-muted)',fontStyle:'italic',padding:'4px 0'}}>
                                            Dados preenchidos a partir do módulo Equipa ({teamMatch.name}{teamMatch.company?` · ${teamMatch.company}`:''})
                                          </div>
                                        )}
                                        {/* Cobre também */}
                                        <div className={styles.detailField}>
                                          <Link2 size={12} style={{color:'var(--text-muted)',flexShrink:0,marginTop:3}}/>
                                          <div className={styles.detailFieldInner}>
                                            <label className={styles.detailLabel}>Cobre também</label>
                                            <div className={styles.coversGrid}>
                                              {CREW_POSITIONS.filter(p=>p.id!==pos.id&&p.group===group).map(p=>{
                                                const covered=(cs.coversRoles||[]).includes(p.id)
                                                return (
                                                  <label key={p.id} className={styles.coversItem}>
                                                    <input type="checkbox" checked={covered}
                                                      onChange={e=>{
                                                        const prev=cs.coversRoles||[]
                                                        const next=e.target.checked?[...prev,p.id]:prev.filter(x=>x!==p.id)
                                                        setCrewMember(pos.id,{coversRoles:next})
                                                      }} />
                                                    {p.label}
                                                  </label>
                                                )
                                              })}
                                              {/* Outros grupos */}
                                              {CREW_POSITIONS.filter(p=>p.id!==pos.id&&p.group!==group).map(p=>{
                                                const covered=(cs.coversRoles||[]).includes(p.id)
                                                return (
                                                  <label key={p.id} className={styles.coversItem}>
                                                    <input type="checkbox" checked={covered}
                                                      onChange={e=>{
                                                        const prev=cs.coversRoles||[]
                                                        const next=e.target.checked?[...prev,p.id]:prev.filter(x=>x!==p.id)
                                                        setCrewMember(pos.id,{coversRoles:next})
                                                      }} />
                                                    {p.label} <span style={{opacity:0.5,fontSize:10}}>({p.group})</span>
                                                  </label>
                                                )
                                              })}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            )
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
