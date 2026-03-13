// ── GoogleDriveEmbed ─────────────────────────────────────────────
// Viewer de ficheiros Google Drive via iframe — widget autónomo
import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileText, Sheet, Presentation, File,
  ExternalLink, AlertCircle, Maximize2,
} from 'lucide-react'
import s from './GoogleDriveEmbed.module.css'

// Configuração por tipo: URL de embed, URL de edição, ícone, cor
const TYPE_CONFIG = {
  document: {
    embedUrl: (id) => `https://docs.google.com/document/d/${id}/preview`,
    editUrl: (id) => `https://docs.google.com/document/d/${id}/edit`,
    icon: FileText,
    color: '#4285f4',
    label: 'Documento',
  },
  spreadsheet: {
    embedUrl: (id) => `https://docs.google.com/spreadsheets/d/${id}/preview`,
    editUrl: (id) => `https://docs.google.com/spreadsheets/d/${id}/edit`,
    icon: Sheet,
    color: '#34a853',
    label: 'Folha de Cálculo',
  },
  presentation: {
    embedUrl: (id) => `https://docs.google.com/presentation/d/${id}/embed?start=false&loop=false&delayms=3000`,
    editUrl: (id) => `https://docs.google.com/presentation/d/${id}/edit`,
    icon: Presentation,
    color: '#fbbc04',
    label: 'Apresentação',
  },
  pdf: {
    embedUrl: (id) => `https://drive.google.com/file/d/${id}/preview`,
    editUrl: (id) => `https://drive.google.com/file/d/${id}/view`,
    icon: File,
    color: '#ea4335',
    label: 'PDF',
  },
}

export function GoogleDriveEmbed({
  fileId,
  type = 'document',
}) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  const config = TYPE_CONFIG[type] || TYPE_CONFIG.document
  const Icon = config.icon

  if (!fileId) {
    return (
      <div className={s.container}>
        <div className={s.empty}>
          <AlertCircle size={24} />
          <span>ID do ficheiro não definido</span>
        </div>
      </div>
    )
  }

  const embedUrl = config.embedUrl(fileId)
  const editUrl = config.editUrl(fileId)

  return (
    <motion.div
      className={s.container}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Barra de ferramentas */}
      <div className={s.toolbar}>
        <div
          className={s.fileIconWrap}
          style={{ background: `${config.color}20`, color: config.color }}
        >
          <Icon size={16} />
        </div>
        <div className={s.toolbarInfo}>
          <span className={s.titleText}>{config.label}</span>
          <span className={s.fileIdText}>{fileId}</span>
        </div>
        <div className={s.toolbarActions}>
          <a
            href={editUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={s.toolbarBtn}
            title="Abrir no Google Drive"
          >
            <ExternalLink size={14} />
          </a>
          <a
            href={embedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={s.toolbarBtn}
            title="Ecrã inteiro"
          >
            <Maximize2 size={14} />
          </a>
        </div>
      </div>

      {/* Área de visualização */}
      <div className={s.viewerWrap}>
        {!loaded && !error && (
          <div className={s.loading}>A carregar ficheiro...</div>
        )}

        {error ? (
          <div className={s.empty}>
            <AlertCircle size={20} />
            <span>Não foi possível carregar o ficheiro</span>
            <a
              href={editUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={s.fallbackLink}
            >
              Abrir no Google Drive
            </a>
          </div>
        ) : (
          <iframe
            className={s.iframe}
            src={embedUrl}
            loading="lazy"
            allowFullScreen
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            title={`Google Drive: ${config.label}`}
          />
        )}
      </div>

      {/* Rodapé */}
      <div className={s.footer}>
        <span className={s.fileCount}>Powered by Google Drive</span>
        <a
          href={editUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={s.footerLink}
        >
          <ExternalLink size={10} />
          Abrir
        </a>
      </div>
    </motion.div>
  )
}
