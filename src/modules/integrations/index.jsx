// Integrations — Hub de integracoes com servicos externos
// Cards visuais · Status · Coming soon badges

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Plug, CloudOff, Cloud, ExternalLink, Clock, CheckCircle,
  HardDrive, MessageSquare, Calendar, Film, Clapperboard,
  FolderOpen, Send, Key, RefreshCw,
} from 'lucide-react'
import { useStore } from '../../core/store.js'
import { useShallow } from 'zustand/react/shallow'
import { useI18n } from '../../core/i18n/index.js'
import { GoogleDriveEmbed } from '../../components/embeds/GoogleDriveEmbed.jsx'
import s from './Integrations.module.css'

// ── Integration definitions ─────────────────────────────────────
const INTEGRATIONS_DEF = [
  { id: 'google-drive', name: 'Google Drive', icon: FolderOpen, descKey: 'integrations.descGoogleDrive', color: '#4285F4', status: 'coming_soon' },
  { id: 'dropbox', name: 'Dropbox', icon: HardDrive, descKey: 'integrations.descDropbox', color: '#0061FF', status: 'coming_soon' },
  { id: 'frame-io', name: 'Frame.io', icon: Film, descKey: 'integrations.descFrameIo', color: '#6C3BF5', status: 'coming_soon' },
  { id: 'slack', name: 'Slack', icon: MessageSquare, descKey: 'integrations.descSlack', color: '#4A154B', status: 'coming_soon' },
  { id: 'whatsapp', name: 'WhatsApp', icon: Send, descKey: 'integrations.descWhatsApp', color: '#25D366', status: 'coming_soon' },
  { id: 'google-calendar', name: 'Google Calendar', icon: Calendar, descKey: 'integrations.descGoogleCalendar', color: '#0F9D58', status: 'coming_soon' },
  { id: 'final-cut', name: 'Final Cut Pro', icon: Clapperboard, descKey: 'integrations.descFinalCut', color: '#555555', status: 'coming_soon' },
  { id: 'davinci', name: 'DaVinci Resolve', icon: Clapperboard, descKey: 'integrations.descDaVinci', color: '#FF6B35', status: 'coming_soon' },
  { id: 'movie-magic', name: 'Movie Magic', icon: Film, descKey: 'integrations.descMovieMagic', color: '#B8860B', status: 'coming_soon' },
]

export default function IntegrationsModule() {
  const { t } = useI18n()
  const { apiKey } = useStore(useShallow(st => ({ apiKey: st.apiKey })))

  const [filter, setFilter] = useState('all')
  const [driveFileId, setDriveFileId] = useState('')
  const [driveFileType, setDriveFileType] = useState('document')
  const [showDrivePreview, setShowDrivePreview] = useState(false)

  // API key is the only "real" integration
  const integrations = useMemo(() => {
    const apiIntegration = {
      id: 'anthropic-api', name: 'Anthropic API', icon: Key,
      description: t('integrations.descAnthropicApi'),
      color: '#D4A574',
      status: apiKey ? 'connected' : 'disconnected',
      lastSync: apiKey ? t('integrations.statusActive') : null,
    }
    const resolved = INTEGRATIONS_DEF.map(intg => ({ ...intg, description: t(intg.descKey) }))
    return [apiIntegration, ...resolved]
  }, [apiKey, t])

  const filtered = useMemo(() => {
    if (filter === 'all') return integrations
    return integrations.filter(i => i.status === filter)
  }, [integrations, filter])

  const connectedCount = integrations.filter(i => i.status === 'connected').length
  const totalCount = integrations.length

  return (
    <motion.div className={s.root} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      {/* ── Header ── */}
      <div className={s.header}>
        <div>
          <div className={s.title}><Plug size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />{t('integrations.title')}</div>
          <div className={s.sub}>{t('integrations.sub', { connected: connectedCount, total: totalCount })}</div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className={s.filterBar}>
        {[
          { id: 'all', label: t('integrations.filterAll') },
          { id: 'connected', label: t('integrations.filterConnected') },
          { id: 'disconnected', label: t('integrations.filterDisconnected') },
          { id: 'coming_soon', label: t('integrations.filterComingSoon') },
        ].map(f => (
          <button
            key={f.id}
            className={filter === f.id ? s.filterActive : s.filter}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className={s.content}>
        <div className={s.grid}>
          {filtered.map((intg, i) => {
            const Icon = intg.icon
            const isConnected = intg.status === 'connected'
            const isComingSoon = intg.status === 'coming_soon'
            return (
              <motion.div
                key={intg.id}
                className={`${s.card} ${isConnected ? s.cardConnected : ''} ${isComingSoon ? s.cardComingSoon : ''}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={intg.id === 'google-drive' ? () => setShowDrivePreview(v => !v) : undefined}
                style={intg.id === 'google-drive' ? { cursor: 'pointer' } : undefined}
              >
                <div className={s.cardIcon} style={{ background: `${intg.color}18`, color: intg.color }}>
                  <Icon size={24} />
                </div>
                <div className={s.cardBody}>
                  <div className={s.cardName}>{intg.name}</div>
                  <div className={s.cardDesc}>{intg.description}</div>
                </div>
                <div className={s.cardFooter}>
                  {isConnected && (
                    <span className={s.statusConnected}>
                      <CheckCircle size={12} /> {t('integrations.statusConnected')}
                      {intg.lastSync && <span className={s.lastSync}> · {intg.lastSync}</span>}
                    </span>
                  )}
                  {intg.status === 'disconnected' && (
                    <span className={s.statusDisconnected}>
                      <CloudOff size={12} /> {t('integrations.statusDisconnected')}
                    </span>
                  )}
                  {isComingSoon && (
                    <span className={s.statusComingSoon}>
                      <Clock size={12} /> {t('integrations.statusComingSoon')}
                    </span>
                  )}
                  {isComingSoon ? (
                    <button className={s.btnDisabled} disabled onClick={() => alert('Em breve')}>{t('integrations.connect')}</button>
                  ) : isConnected ? (
                    <button className={s.btnConnected} onClick={() => {
                      if (intg.id === 'anthropic-api') useStore.getState().navigate('settings')
                    }}><RefreshCw size={12} /> {t('integrations.sync')}</button>
                  ) : (
                    <button className={s.btnConnect} onClick={() => {
                      if (intg.id === 'anthropic-api') useStore.getState().navigate('settings')
                      else alert('Em breve')
                    }}><Cloud size={12} /> {t('integrations.connect')}</button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Google Drive Preview */}
        {showDrivePreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            style={{ marginTop: 16, padding: 16, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}
          >
            <div style={{ marginBottom: 12, fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
              <FolderOpen size={14} style={{ verticalAlign: -2, marginRight: 6 }} />
              {t('integrations.drivePreview')}
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <input
                style={{
                  flex: 1, minWidth: 200, padding: '8px 12px',
                  background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
                  fontSize: 'var(--text-sm)', outline: 'none',
                }}
                placeholder={t('integrations.driveFileIdPlaceholder')}
                value={driveFileId}
                onChange={e => setDriveFileId(e.target.value)}
              />
              <select
                style={{
                  padding: '8px 12px',
                  background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
                  fontSize: 'var(--text-sm)', outline: 'none',
                }}
                value={driveFileType}
                onChange={e => setDriveFileType(e.target.value)}
              >
                <option value="document">{t('integrations.driveDocument')}</option>
                <option value="spreadsheet">{t('integrations.driveSpreadsheet')}</option>
                <option value="presentation">{t('integrations.drivePresentation')}</option>
                <option value="pdf">{t('integrations.drivePdf')}</option>
              </select>
            </div>
            <GoogleDriveEmbed fileId={driveFileId} type={driveFileType} />
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export { IntegrationsModule }
