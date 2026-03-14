/**
 * FrameFlow UI System — Shared Entity Types
 * Used by all entity card components. Pure data interfaces — no store coupling.
 */

import type { ReactNode } from 'react'

// ── Take ─────────────────────────────────────────────────────────
export interface TakeData {
  id: string
  number: number
  status: 'BOM' | 'NG' | 'REC' | 'HOLD'
  notes?: string
  timestamp?: string
  duration?: number // seconds
}

// ── Department item (continuity photo, prop, etc.) ────────────────
export interface DeptItem {
  id: string
  name: string
  department: string
  photos?: string[]
  approved?: boolean
  notes?: string
}

// ── Scene (core production entity) ───────────────────────────────
export interface SceneData {
  sceneKey: string
  sceneNumber: string
  epId: string
  intExt?: 'INT' | 'EXT' | 'INT/EXT' | string
  location?: string
  timeOfDay?: string
  description?: string
  characters?: string[]
  duration?: number       // eighths of a page
  dialogue?: string[]
  storyboardUrl?: string
  thumbnailUrl?: string
  notes?: string
  directorNotes?: string
  continuityNotes?: string[]
  tags?: string[]
  sceneType?: string
  locationColor?: string
  // enrichments (optional — not always present)
  takes?: TakeData[]
  departmentItems?: DeptItem[]
  callTime?: string
  dayNumber?: number
  prevSceneKey?: string
  nextSceneKey?: string
}

export type SceneCardVariant = 'dashboard' | 'callsheet' | 'schedule' | 'dailies' | 'live' | 'detail'

// ── Person ───────────────────────────────────────────────────────
export interface PersonData {
  id: string
  name: string
  role?: string
  group?: string
  photo?: string
  phone?: string
  email?: string
  status?: 'confirmed' | 'pending' | 'absent'
  callTime?: string
  character?: string
  department?: string
  nif?: string
  iban?: string
  cacheDiario?: number
}

// ── Location ──────────────────────────────────────────────────────
export interface LocationData {
  id: string
  name: string
  displayName?: string
  address?: string
  city?: string
  lat?: number
  lng?: number
  googleMapsUrl?: string
  photos?: string[]
  travelTime?: string
  restrictions?: string[]
  contacts?: { name: string; phone: string }[]
  accentColor?: string
}

// ── Shooting day ──────────────────────────────────────────────────
export interface DayData {
  id: string
  date: string
  dayNumber: number
  episodeNumber?: string
  callTime?: string
  wrapTime?: string
  location?: string
  sceneCount?: number
  status?: 'planned' | 'filming' | 'done' | 'hold'
  scenes?: SceneData[]
}

// ── Day timeline item ─────────────────────────────────────────────
export type DayTimelineItemType = 'scene' | 'meal' | 'move' | 'break' | 'call' | 'wrap' | 'technical'

export interface DayTimelineItemData {
  id?: string
  type: DayTimelineItemType
  time: string
  duration?: number          // minutes
  label: string
  sublabel?: string
  location?: string
  scene?: SceneData
  accentColor?: string
  note?: string
  status?: 'upcoming' | 'active' | 'done'
}

// ── Weather ───────────────────────────────────────────────────────
export interface WeatherData {
  temp: number
  feelsLike?: number
  description: string
  wind?: number
  humidity?: number
  visibility?: number
  uvIndex?: number
  city?: string
  hourly?: { hour: string; temp: number; iconKey?: string }[]
  sunrise?: string
  sunset?: string
  moonPhase?: string
  tides?: { time: string; type: 'high' | 'low'; height?: number }[]
}

// ── Meal ─────────────────────────────────────────────────────────
export interface MealData {
  id: string
  type: 'catering' | 'lunch' | 'dinner' | 'breakfast' | 'snack'
  time: string
  location?: string
  menu?: string[]
  headcount?: number
  supplier?: string
  notes?: string
  confirmed?: boolean
}

// ── Department status ─────────────────────────────────────────────
export interface DepartmentStatusData {
  id: string
  department: string
  label: string
  color: string
  ready: boolean
  readyCount: number
  totalCount: number
  pendingItems?: string[]
  hod?: PersonData
  notes?: string
}

// ── Alert ────────────────────────────────────────────────────────
export interface AlertData {
  id: string
  type: 'error' | 'warning' | 'info' | 'success'
  title: string
  message?: string
  action?: { label: string; onPress: () => void }
  timestamp?: string
  dismissed?: boolean
  source?: string
}

// ── Metric ───────────────────────────────────────────────────────
export interface MetricData {
  label: string
  value: string | number
  unit?: string
  delta?: { value: number; direction: 'up' | 'down' | 'neutral'; label?: string }
  accentColor?: string
  icon?: ReactNode
  trend?: number[] // sparkline data
}

// ── Logistics point ──────────────────────────────────────────────
export interface LogisticsPointData {
  id: string
  type: 'basecamp' | 'parking' | 'hospital' | 'fuel' | 'hotel' | 'custom'
  label: string
  address?: string
  distance?: string
  phone?: string
  notes?: string
  lat?: number
  lng?: number
}
