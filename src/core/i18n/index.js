// i18n — Sistema de internacionalização do FrameBoard
// Língua por user (auth.lang), não por projecto

import { useStore } from '../store.js'
import pt from './pt.json'
import ptBR from './pt-BR.json'
import en from './en.json'
import es from './es.json'
import fr from './fr.json'
import zh from './zh.json'
import ko from './ko.json'
import hi from './hi.json'

const TRANSLATIONS = { pt, 'pt-BR': ptBR, en, es, fr, zh, ko, hi }

export const LANGUAGES = [
  { code: 'pt',    label: 'Português',    flag: '🇵🇹', speechCode: 'pt-PT' },
  { code: 'pt-BR', label: 'Português BR', flag: '🇧🇷', speechCode: 'pt-BR' },
  { code: 'en',    label: 'English',      flag: '🇬🇧', speechCode: 'en-US' },
  { code: 'es',    label: 'Español',      flag: '🇪🇸', speechCode: 'es-ES' },
  { code: 'fr',    label: 'Français',     flag: '🇫🇷', speechCode: 'fr-FR' },
  { code: 'zh',    label: '中文',          flag: '🇨🇳', speechCode: 'zh-CN' },
  { code: 'ko',    label: '한국어',        flag: '🇰🇷', speechCode: 'ko-KR' },
  { code: 'hi',    label: 'हिन्दी',         flag: '🇮🇳', speechCode: 'hi-IN' },
]

/**
 * Resolve uma chave nested: t('sidebar.dashboard') → translations.sidebar.dashboard
 */
function resolve(obj, path) {
  return path.split('.').reduce((acc, key) => acc?.[key], obj)
}

/**
 * Hook de tradução.
 * @returns {{ t: (key: string, vars?: object) => string, lang: string, speechLang: string }}
 */
export function useI18n() {
  const lang = useStore(s => s.auth.lang) || 'pt'
  const dict = TRANSLATIONS[lang] || pt

  function t(key, vars) {
    let str = resolve(dict, key)
    // Fallback para PT se a chave não existe na língua actual
    if (str === undefined) str = resolve(pt, key)
    // Fallback para a própria chave
    if (str === undefined) return key

    // Interpolação simples: {{var}}
    if (vars && typeof str === 'string') {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v)
      }
    }
    return str
  }

  const speechLang = LANGUAGES.find(l => l.code === lang)?.speechCode || 'pt-PT'

  return { t, lang, speechLang }
}

/**
 * Obter tradução fora de componentes React (para utils).
 */
export function getT() {
  const lang = useStore.getState().auth.lang || 'pt'
  const dict = TRANSLATIONS[lang] || pt

  return function t(key, vars) {
    let str = resolve(dict, key)
    if (str === undefined) str = resolve(pt, key)
    if (str === undefined) return key
    if (vars && typeof str === 'string') {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v)
      }
    }
    return str
  }
}
