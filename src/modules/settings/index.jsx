// Definições — Perfil, API keys, língua, tema, wallpaper, projecto, dados
import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  KeyRound, Eye, EyeOff, CheckCircle, AlertCircle, Copy, Check,
  Sun, Moon, Cloud, Database, Wifi, WifiOff, Image, Upload,
  Settings2, Download, LogOut, User, Globe, Palette, Film, Sliders,
} from 'lucide-react'
import { GlassTray, NestedTray, PillButton } from '../../components/LiquidGlass.jsx'
import { BackgroundOrbs } from '../../components/shared/BackgroundOrbs.jsx'
import { useStore } from '../../core/store.js'
import { useShootingStore } from '../../core/shootingStore.js'
import { useShallow } from 'zustand/react/shallow'
import { useI18n, LANGUAGES } from '../../core/i18n/index.js'
import { seedDummyData, resetProjectData } from '../../dev/seedDummyData.js'
import styles from './Settings.module.css'

const WALLPAPER_PRESETS = [
  { id: 'aurora', name: 'Aurora', gradient: 'linear-gradient(135deg, #0a1628 0%, #1a0a2e 30%, #0d2847 60%, #0a1628 100%)' },
  { id: 'sunset', name: 'Pôr do Sol', gradient: 'linear-gradient(to bottom, #1a0a0a 0%, #4a1a0a 30%, #8a3a0a 50%, #1a0a2a 100%)' },
  { id: 'ocean', name: 'Oceano', gradient: 'linear-gradient(180deg, #020c1b 0%, #0a192f 30%, #0d4f6e 60%, #020c1b 100%)' },
  { id: 'forest', name: 'Floresta', gradient: 'linear-gradient(160deg, #0a1a0a 0%, #0d2a0d 40%, #1a3a1a 70%, #0a1a0a 100%)' },
  { id: 'minimal', name: 'Minimal', gradient: 'linear-gradient(180deg, #0f1520 0%, #172030 50%, #0f1520 100%)' },
  { id: 'cosmos', name: 'Cosmos', gradient: 'radial-gradient(ellipse at 30% 20%, #1a0a3a 0%, #0a0a2a 40%, #050510 100%)' },
]

const anim = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay },
})

export function SettingsModule() {
  const {
    apiKey, setApiKey, owmApiKey, setOwmApiKey,
    auth, setLang, setTheme, logout,
    wallpaper, setWallpaper,
    projectName, setProjectName, projectFps, setProjectFps,
    projectParams, setProjectParams,
    teamCount, locCount, daysCount, deptCount, budgetCount, captureCount,
  } = useStore(useShallow(s => ({
    apiKey: s.apiKey, setApiKey: s.setApiKey,
    owmApiKey: s.owmApiKey, setOwmApiKey: s.setOwmApiKey,
    auth: s.auth, setLang: s.setLang, setTheme: s.setTheme, logout: s.logout,
    wallpaper: s.wallpaper, setWallpaper: s.setWallpaper,
    projectName: s.projectName, setProjectName: s.setProjectName,
    projectFps: s.projectFps, setProjectFps: s.setProjectFps,
    projectParams: s.projectParams, setProjectParams: s.setProjectParams,
    teamCount: s.team?.length || 0, locCount: s.locations?.length || 0,
    daysCount: s.shootingDays?.length || 0, deptCount: s.departmentItems?.length || 0,
    budgetCount: s.budgets?.length || 0, captureCount: s.captures?.length || 0,
  })))

  const { t } = useI18n()
  const lang = auth.lang || 'pt'
  const theme = auth.theme || 'dark'

  // API key state
  const [showKey, setShowKey] = useState(false)
  const [input, setInput] = useState(apiKey || '')
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  // OWM key state
  const [owmKey, setOwmKey] = useState(owmApiKey || '')
  const [owmSaved, setOwmSaved] = useState(false)
  const [showOwm, setShowOwm] = useState(false)
  const owmChanged = owmKey !== (owmApiKey || '')

  const wallpaperInputRef = useRef(null)
  const importInputRef = useRef(null)
  const [importMsg, setImportMsg] = useState(null)

  const isValid = input.startsWith('sk-ant-')
  const hasChanged = input !== (apiKey || '')

  const handleSave = () => {
    setApiKey(input.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleCopy = () => {
    if (!apiKey) return
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setInput(text.trim())
    } catch {}
  }

  // User info
  const userName = typeof auth.user === 'string' ? auth.user : auth.user?.name || null
  const userEmail = typeof auth.user === 'object' ? auth.user?.email : null
  const userPhoto = typeof auth.user === 'object' ? auth.user?.photo : null
  const userInitial = userName ? userName.charAt(0).toUpperCase() : '?'

  // Export / Import
  const handleExportJSON = () => {
    const state = useStore.getState()
    const data = {
      projectName: state.projectName, team: state.team, locations: state.locations,
      shootingDays: state.shootingDays, sceneAssignments: state.sceneAssignments,
      departmentItems: state.departmentItems, budgets: state.budgets,
      suppliers: state.suppliers, parsedScripts: state.parsedScripts,
      parsedCharacters: state.parsedCharacters, parsedLocations: state.parsedLocations,
      continuityData: state.continuityData, universe: state.universe,
      rsvp: state.rsvp, captures: state.captures, suggestions: state.suggestions,
      exportedAt: new Date().toISOString(), version: 'frameflow-v1',
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `frameflow-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImportJSON = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (data.version !== 'frameflow-v1') {
          setImportMsg({ ok: false, text: 'Formato inválido ou versão incompatível' })
          return
        }
        if (!window.confirm('Importar vai SUBSTITUIR todos os dados actuais. Continuar?')) return
        useStore.setState({
          ...(data.projectName !== undefined && { projectName: data.projectName }),
          ...(data.team && { team: data.team }),
          ...(data.locations && { locations: data.locations }),
          ...(data.shootingDays && { shootingDays: data.shootingDays }),
          ...(data.sceneAssignments && { sceneAssignments: data.sceneAssignments }),
          ...(data.departmentItems && { departmentItems: data.departmentItems }),
          ...(data.budgets && { budgets: data.budgets }),
          ...(data.suppliers && { suppliers: data.suppliers }),
          ...(data.parsedScripts && { parsedScripts: data.parsedScripts }),
          ...(data.parsedCharacters && { parsedCharacters: data.parsedCharacters }),
          ...(data.parsedLocations && { parsedLocations: data.parsedLocations }),
          ...(data.continuityData && { continuityData: data.continuityData }),
          ...(data.universe && { universe: data.universe }),
          ...(data.rsvp && { rsvp: data.rsvp }),
          ...(data.suggestions && { suggestions: data.suggestions }),
        })
        setImportMsg({ ok: true, text: `Importado com sucesso (${new Date(data.exportedAt).toLocaleDateString('pt-PT')})` })
      } catch {
        setImportMsg({ ok: false, text: 'Erro ao ler ficheiro JSON' })
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className={styles.root}>
      <div className={styles.orbs}><BackgroundOrbs /></div>

      <div className={styles.content}>

        {/* ── Header ── */}
        <div className={styles.pageHeader}>
          <h2 className={styles.title}>{t('settings.title')}</h2>
          <p className={styles.subtitle}>Configuração da aplicação e do projecto</p>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            1. PERFIL DO UTILIZADOR
           ═══════════════════════════════════════════════════════════ */}
        <motion.div {...anim(0)}>
          <GlassTray accentColor="#8B5CF6">
            <div className={styles.sectionLabel}>Perfil do Utilizador</div>

            <div className={styles.profileRow}>
              {userPhoto
                ? <img src={userPhoto} alt="" className={styles.avatar} />
                : <div className={styles.avatarPlaceholder}>{userInitial}</div>
              }
              <div className={styles.profileInfo}>
                <div className={styles.profileName}>{userName || 'Utilizador'}</div>
                {userEmail && <div className={styles.profileDetail}>{userEmail}</div>}
                {auth.role && <div className={styles.profileDetail}>{auth.role}{auth.department ? ` — ${auth.department}` : ''}</div>}
              </div>

              <button
                className={styles.btnDanger}
                onClick={() => {
                  try { import('../../core/firebase.js').then(m => m.auth?.signOut?.()) } catch {}
                  logout()
                }}
              >
                <LogOut size={14} />
                Terminar Sessão
              </button>
            </div>
          </GlassTray>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════
            2. CHAVES API
           ═══════════════════════════════════════════════════════════ */}
        <motion.div {...anim(0.05)}>
          <GlassTray accentColor="#10b981">
            <div className={styles.sectionLabel}>Chaves API</div>

            {/* Anthropic */}
            <NestedTray>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <KeyRound size={15} style={{ color: '#10b981' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>Anthropic (Claude)</span>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className={`${styles.statusDot} ${apiKey ? styles.statusDotOk : styles.statusDotOff}`} />
                  <span style={{ fontSize: 11, color: apiKey ? '#10b981' : 'rgba(255,255,255,0.35)' }}>
                    {apiKey ? 'Ligada' : 'Não definida'}
                  </span>
                </div>
              </div>

              <div className={styles.passwordRow}>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onPaste={e => {
                    e.stopPropagation()
                    const text = e.clipboardData.getData('text').trim()
                    if (text) { setInput(text); e.preventDefault() }
                  }}
                  placeholder="sk-ant-api03-..."
                  spellCheck={false}
                  autoComplete="off"
                />
                <button className={styles.iconBtn} onClick={() => setShowKey(v => !v)}>
                  {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                {apiKey && (
                  <button className={styles.iconBtn} onClick={handleCopy}>
                    {copied ? <Check size={15} style={{ color: '#10b981' }} /> : <Copy size={15} />}
                  </button>
                )}
              </div>

              {input ? (
                isValid
                  ? <div className={styles.statusOk}><CheckCircle size={12} /> {t('sidebar.keyValid')}</div>
                  : <div className={styles.statusWarn}><AlertCircle size={12} /> {t('sidebar.keyInvalid')}</div>
              ) : (
                <div className={styles.statusHint}>console.anthropic.com → API Keys</div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <button className={styles.btnPrimary} onClick={handleSave} disabled={!hasChanged || !input}>
                  {saved ? <><CheckCircle size={13} /> {t('common.done')}</> : t('common.save')}
                </button>
              </div>
            </NestedTray>

            {/* OpenWeatherMap */}
            <NestedTray style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Cloud size={15} style={{ color: '#5B8DEF' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>OpenWeatherMap</span>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className={`${styles.statusDot} ${owmApiKey ? styles.statusDotOk : styles.statusDotOff}`} />
                  <span style={{ fontSize: 11, color: owmApiKey ? '#10b981' : 'rgba(255,255,255,0.35)' }}>
                    {owmApiKey ? 'Ligada' : 'Não definida'}
                  </span>
                </div>
              </div>

              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '0 0 8px', lineHeight: 1.5 }}>
                Chave gratuita para previsão meteorológica na Folha de Serviço.
              </p>

              <div className={styles.passwordRow}>
                <input
                  type={showOwm ? 'text' : 'password'}
                  value={owmKey}
                  onChange={e => setOwmKey(e.target.value)}
                  placeholder="Cole a chave da API aqui..."
                  spellCheck={false}
                  autoComplete="off"
                />
                <button className={styles.iconBtn} onClick={() => setShowOwm(v => !v)}>
                  {showOwm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <button
                  className={styles.btnPrimary}
                  onClick={() => {
                    setOwmApiKey(owmKey.trim())
                    setOwmSaved(true)
                    setTimeout(() => setOwmSaved(false), 2500)
                  }}
                  disabled={!owmChanged}
                >
                  {owmSaved ? <><CheckCircle size={13} /> Guardado</> : 'Guardar'}
                </button>
              </div>
            </NestedTray>
          </GlassTray>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════
            3. IDIOMA
           ═══════════════════════════════════════════════════════════ */}
        <motion.div {...anim(0.1)}>
          <GlassTray accentColor="#F59E0B">
            <div className={styles.sectionLabel}>Idioma</div>
            <div className={styles.pillGroup}>
              {LANGUAGES.map(l => (
                <button
                  key={l.code}
                  className={`${styles.pill} ${l.code === lang ? styles.pillActive : ''}`}
                  onClick={() => setLang(l.code)}
                >
                  <span style={{ fontSize: 17 }}>{l.flag}</span>
                  {l.label}
                </button>
              ))}
            </div>
          </GlassTray>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════
            4. APARÊNCIA
           ═══════════════════════════════════════════════════════════ */}
        <motion.div {...anim(0.15)}>
          <GlassTray accentColor="#8B5CF6">
            <div className={styles.sectionLabel}>Aparência</div>

            {/* Theme toggle */}
            <NestedTray>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Palette size={15} style={{ color: '#8B5CF6' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>Tema</span>
              </div>
              <div className={styles.pillGroup}>
                <button
                  className={`${styles.pill} ${theme === 'dark' ? styles.pillActive : ''}`}
                  onClick={() => setTheme('dark')}
                >
                  <Moon size={13} /> Dark
                </button>
                <button
                  className={`${styles.pill} ${theme === 'light' ? styles.pillActive : ''}`}
                  onClick={() => setTheme('light')}
                >
                  <Sun size={13} /> Light
                </button>
              </div>
            </NestedTray>

            {/* Wallpaper */}
            <NestedTray style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Image size={15} style={{ color: '#8B5CF6' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>Fundo</span>
              </div>

              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '0 0 10px' }}>
                Imagem de fundo da aplicação. Combina com o efeito Liquid Glass.
              </p>

              {/* Type selector */}
              <div className={styles.pillGroup} style={{ marginBottom: 12 }}>
                {[
                  { value: 'none', label: 'Sem fundo' },
                  { value: 'gradient', label: 'Gradiente' },
                  { value: 'custom', label: 'Imagem' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    className={`${styles.pill} ${(wallpaper?.type || 'none') === opt.value ? styles.pillActive : ''}`}
                    onClick={() => setWallpaper({ type: opt.value })}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Gradient presets */}
              {(wallpaper?.type === 'gradient' || wallpaper?.type === 'preset') && (
                <div className={styles.presetGrid} style={{ marginBottom: 12 }}>
                  {WALLPAPER_PRESETS.map(p => (
                    <button
                      key={p.id}
                      className={`${styles.presetBtn} ${wallpaper?.preset === p.id ? styles.presetBtnActive : ''}`}
                      style={{ background: p.gradient }}
                      onClick={() => setWallpaper({ type: 'gradient', gradient: p.gradient, preset: p.id })}
                    >
                      <span className={styles.presetLabel}>{p.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Custom upload */}
              {wallpaper?.type === 'custom' && (
                <div style={{ marginBottom: 12 }}>
                  <button
                    className={styles.btnSecondary}
                    onClick={() => wallpaperInputRef.current?.click()}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <Upload size={13} />
                    {wallpaper?.customUrl ? 'Trocar imagem' : 'Carregar imagem'}
                  </button>
                  <input ref={wallpaperInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const reader = new FileReader()
                      reader.onload = ev => setWallpaper({ customUrl: ev.target.result })
                      reader.readAsDataURL(file)
                    }}
                  />
                  {wallpaper?.customUrl && (
                    <div style={{ marginTop: 8, borderRadius: 12, overflow: 'hidden', height: 80 }}>
                      <img src={wallpaper.customUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                </div>
              )}

              {/* Sliders */}
              {wallpaper?.type && wallpaper.type !== 'none' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className={styles.slider}>
                    <div className={styles.sliderHeader}>
                      <span>Desfoque (Glass)</span>
                      <span>{wallpaper?.blur ?? 20}px</span>
                    </div>
                    <input className={styles.sliderInput} type="range" min="0" max="50" step="1"
                      value={wallpaper?.blur ?? 20}
                      onChange={e => setWallpaper({ blur: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className={styles.slider}>
                    <div className={styles.sliderHeader}>
                      <span>Opacidade das superfícies</span>
                      <span>{Math.round((wallpaper?.opacity ?? 0.85) * 100)}%</span>
                    </div>
                    <input className={styles.sliderInput} type="range" min="0.3" max="1" step="0.05"
                      value={wallpaper?.opacity ?? 0.85}
                      onChange={e => setWallpaper({ opacity: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className={styles.slider}>
                    <div className={styles.sliderHeader}>
                      <span>Escurecimento</span>
                      <span>{Math.round((wallpaper?.dim ?? 0.3) * 100)}%</span>
                    </div>
                    <input className={styles.sliderInput} type="range" min="0" max="0.8" step="0.05"
                      value={wallpaper?.dim ?? 0.3}
                      onChange={e => setWallpaper({ dim: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
              )}
            </NestedTray>
          </GlassTray>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════
            5. PROJECTO
           ═══════════════════════════════════════════════════════════ */}
        <motion.div {...anim(0.2)}>
          <GlassTray accentColor="#5B8DEF">
            <div className={styles.sectionLabel}>Projecto</div>

            {/* Project name */}
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Nome do Projecto</label>
              <input
                className={styles.glassInput}
                value={projectName || ''}
                onChange={e => setProjectName(e.target.value)}
                placeholder="Ex: ROAST, Castelões..."
              />
            </div>

            {/* FPS */}
            <div className={styles.field} style={{ marginTop: 14 }}>
              <label className={styles.fieldLabel}>FPS do Projecto</label>
              <div className={styles.fpsRow}>
                {[24, 25, 30, 50, 60].map(f => (
                  <button
                    key={f}
                    className={`${styles.fpsBtn} ${(projectFps || 25) === f ? styles.fpsBtnActive : ''}`}
                    onClick={() => setProjectFps(f)}
                  >
                    {f}fps
                  </button>
                ))}
              </div>
            </div>

            {/* Project Params */}
            <NestedTray style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Film size={15} style={{ color: '#5B8DEF' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>Parâmetros de Produção</span>
              </div>
              <div className={styles.paramsGrid}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Episódios</label>
                  <input
                    className={styles.glassInput}
                    type="number"
                    min="0"
                    value={projectParams?.episodes || ''}
                    onChange={e => setProjectParams({ episodes: e.target.value })}
                    placeholder="6"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Duração (min)</label>
                  <input
                    className={styles.glassInput}
                    type="number"
                    min="0"
                    value={projectParams?.episodeDuration || ''}
                    onChange={e => setProjectParams({ episodeDuration: e.target.value })}
                    placeholder="52"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Dias de Rodagem</label>
                  <input
                    className={styles.glassInput}
                    type="number"
                    min="0"
                    value={projectParams?.shootDays || ''}
                    onChange={e => setProjectParams({ shootDays: e.target.value })}
                    placeholder="45"
                  />
                </div>
              </div>
            </NestedTray>
          </GlassTray>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════
            6. EXPORTAR & BACKUP
           ═══════════════════════════════════════════════════════════ */}
        <motion.div {...anim(0.25)}>
          <GlassTray accentColor="#2EA080">
            <div className={styles.sectionLabel}>Exportar & Backup</div>

            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 12px', lineHeight: 1.5 }}>
              Exporta todos os dados do projecto em JSON. Podes reimportar mais tarde ou noutra máquina.
            </p>

            <div className={styles.actionRow}>
              <button className={styles.btnPrimary} onClick={handleExportJSON}>
                <Download size={13} /> Exportar JSON
              </button>
              <button className={styles.btnSecondary} onClick={() => importInputRef.current?.click()}>
                <Upload size={13} /> Importar JSON
              </button>
              <input ref={importInputRef} type="file" accept=".json" style={{ display: 'none' }}
                onChange={handleImportJSON} />
            </div>

            {importMsg && (
              <p style={{ marginTop: 8, fontSize: 11, color: importMsg.ok ? '#10b981' : '#ef4444' }}>
                {importMsg.text}
              </p>
            )}
          </GlassTray>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════
            7. DADOS & ARMAZENAMENTO
           ═══════════════════════════════════════════════════════════ */}
        <motion.div {...anim(0.3)}>
          <GlassTray accentColor="#F5A623">
            <div className={styles.sectionLabel}>Dados & Armazenamento</div>

            <NestedTray>
              {[
                { label: 'Equipa', count: teamCount },
                { label: 'Locais', count: locCount },
                { label: 'Dias de Rodagem', count: daysCount },
                { label: 'Items de Dept.', count: deptCount },
                { label: 'Orçamentos', count: budgetCount },
                { label: 'Capturas', count: captureCount },
              ].map(row => (
                <div key={row.label} className={styles.dataRow}>
                  <span className={styles.dataLabel}>{row.label}</span>
                  <span className={styles.dataValue}>{row.count}</span>
                </div>
              ))}
            </NestedTray>

            <div className={styles.divider} />

            <div className={styles.actionRow}>
              <button className={styles.btnSecondary} onClick={() => {
                seedDummyData(useStore)
                window.location.reload()
              }}>
                Carregar Dados Demo
              </button>
              <button
                className={styles.btnSecondary}
                style={{ borderColor: 'rgba(245, 158, 11, 0.4)', color: '#F59E0B' }}
                onClick={() => {
                  if (!window.confirm('RESET PROJECTO? Todos os dados serão apagados!')) return
                  resetProjectData(useStore)
                  window.location.reload()
                }}
              >
                Reset Projecto
              </button>
              <button className={styles.btnDanger} onClick={() => {
                if (!window.confirm('APAGAR TUDO? Esta acção não pode ser desfeita. Faz backup primeiro!')) return
                localStorage.removeItem('frame-v3')
                window.location.reload()
              }}>
                Apagar Todos os Dados
              </button>
            </div>
          </GlassTray>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════
            8. FIRESTORE SYNC
           ═══════════════════════════════════════════════════════════ */}
        <motion.div {...anim(0.35)}>
          <FirestoreSyncSection />
        </motion.div>

      </div>
    </div>
  )
}

// ── Firestore Sync Section ──────────────────────────────────────────
function FirestoreSyncSection() {
  const firestoreConnected = useShootingStore(s => s.firestoreConnected)
  const currentProjectId = useStore(s => s.currentProjectId)

  const [syncEnabled, setSyncEnabled] = useState(() =>
    localStorage.getItem('frame_firestore_sync') === 'true'
  )

  const handleToggle = () => {
    const next = !syncEnabled
    setSyncEnabled(next)
    localStorage.setItem('frame_firestore_sync', String(next))

    if (!next) {
      const store = useShootingStore.getState()
      if (store.firestoreConnected) store.disconnectFirestore()
    }
    if (next) {
      const store = useShootingStore.getState()
      const projectId = currentProjectId
      const dayDate = store.day?.date
      if (projectId && dayDate && !store.firestoreConnected) {
        store.connectFirestore(projectId, dayDate)
      }
    }
  }

  return (
    <GlassTray accentColor="#F5A623">
      <div className={styles.sectionLabel}>Sincronização Firestore</div>

      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 12px', lineHeight: 1.5 }}>
        Sincronização em tempo real do Live Board via Firebase Firestore.
        A app funciona normalmente sem esta opção.
      </p>

      <NestedTray>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span className={`${styles.statusDot} ${firestoreConnected ? styles.statusDotOk : styles.statusDotOff}`} />
          <span style={{ fontSize: 12, color: firestoreConnected ? '#10b981' : 'rgba(255,255,255,0.4)' }}>
            {firestoreConnected ? (
              <><Wifi size={13} style={{ verticalAlign: -2, marginRight: 4 }} />Ligado ao Firestore</>
            ) : (
              <><WifiOff size={13} style={{ verticalAlign: -2, marginRight: 4 }} />Modo local (offline)</>
            )}
          </span>
        </div>

        <div className={styles.toggleRow}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Activar sincronização</span>
          <button
            className={styles.toggleTrack}
            onClick={handleToggle}
            style={{
              background: syncEnabled ? '#10b981' : 'rgba(255,255,255,0.08)',
              outline: syncEnabled ? '2px solid rgba(16,185,129,0.3)' : 'none',
            }}
          >
            <span
              className={styles.toggleThumb}
              style={{
                left: syncEnabled ? 23 : 3,
                background: syncEnabled ? '#fff' : 'rgba(255,255,255,0.3)',
              }}
            />
          </button>
        </div>

        {syncEnabled && !firestoreConnected && (
          <p style={{ fontSize: 11, color: '#F59E0B', marginTop: 6 }}>
            A ligação será estabelecida quando abrires o Live Board com um dia activo.
          </p>
        )}
      </NestedTray>
    </GlassTray>
  )
}
