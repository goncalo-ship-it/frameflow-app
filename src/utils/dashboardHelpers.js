// ── Helpers partilhados entre dashboards de role ──────────────────
// Extraídos de DirectorDashboard, DopDashboard, ActorDashboard, ApDashboard

import { classifyScene as classifySceneRaw } from '../modules/production/schedule/utils/sceneDuration.js'

export function getTodayDay(shootingDays) {
  const today = new Date().toISOString().split('T')[0]
  return shootingDays.find(d => d.date === today) || shootingDays[0]
}

export function getNextDay(shootingDays) {
  const today = new Date().toISOString().split('T')[0]
  const idx = shootingDays.findIndex(d => d.date === today)
  return idx >= 0 ? shootingDays[idx + 1] : shootingDays[1]
}

export function getScenesForDay(dayId, sceneAssignments, parsedScripts) {
  if (!dayId) return []
  return Object.entries(sceneAssignments || {})
    .filter(([, id]) => id === dayId)
    .map(([key]) => {
      const [epId, sceneNum] = key.split('-')
      const ep = parsedScripts?.[epId]
      const scene = ep?.scenes?.find(s => String(s.sceneNumber) === sceneNum)
      return scene ? { ...scene, epId, sceneKey: key } : null
    })
    .filter(Boolean)
    .sort((a, b) => (a.sceneNumber || 0) - (b.sceneNumber || 0))
}

export function formatDate(iso, options = {}) {
  if (!iso) return '—'
  const { withWeekday = true } = options
  const d = new Date(iso)
  const opts = { day: 'numeric', month: 'long' }
  if (withWeekday) opts.weekday = 'long'
  return d.toLocaleDateString('pt-PT', opts)
}

// Single source of truth: sceneDuration.js (returns capitalised);
// dashboards expect lowercase keys matching SCENE_TYPE_COLORS.
export function classifyScene(scene) {
  return classifySceneRaw(scene).toLowerCase()
}

export const SCENE_TYPE_COLORS = {
  âncora: '#A02E6F',
  diálogo: '#2EA080',
  solo: '#7B4FBF',
  transição: '#6E6E78',
  grupo: '#2E6FA0',
  gag: '#BF6A2E',
}
