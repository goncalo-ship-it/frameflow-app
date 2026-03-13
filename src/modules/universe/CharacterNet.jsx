// CharacterNet — canvas network with concentric group rings, visible edges, floating card
// Dark-theme · fluid · pan/zoom/drag · episode overlay · parallax · liquid motion

import { useEffect, useRef, useCallback, useState } from 'react'
import { RotateCcw, X, ChevronRight } from 'lucide-react'
import { ARC_MAP, ARC_TYPES, RELATION_TYPES, REL_MAP, SCALES, SCALE_MAP } from './utils.js'
import styles from './Universe.module.css'

// ── Group color palette (dark-theme optimised) ───────────────
const GROUP_PALETTE = [
  '#22c55e', '#ef4444', '#3b82f6', '#a855f7',
  '#f59e0b', '#06b6d4', '#ec4899', '#84cc16',
]
function groupColor(i) { return GROUP_PALETTE[i % GROUP_PALETTE.length] }

// ── Per-character unique color (from name hash) ──────────────
const CHAR_HUES = [
  '#22c55e', '#3b82f6', '#ef4444', '#a855f7', '#f59e0b',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#e11d48', '#8b5cf6', '#0ea5e9', '#d946ef',
  '#10b981', '#f43f5e', '#7c3aed', '#0891b2', '#c026d3',
]
function charColor(name, index) {
  let hash = 0
  for (let i = 0; i < (name || '').length; i++) hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0
  return CHAR_HUES[Math.abs(hash + index) % CHAR_HUES.length]
}

// ── Derive groups from chars — uses scale if set, else group/arcType ──
function deriveGroups(chars) {
  // Check if any char has a scale set
  const hasScales = chars.some(c => c.scale && c.scale !== 'centro')

  const map = new Map()
  for (const c of chars) {
    const g = hasScales
      ? (c.scale || (c.arcType === 'protagonista' ? 'centro' : 'real'))
      : (c.group || c.arcType || 'outros')
    if (!map.has(g)) map.set(g, [])
    map.get(g).push(c)
  }
  const entries = [...map.entries()]

  if (hasScales) {
    // Sort by SCALES order
    const scaleOrder = SCALES.map(s => s.id)
    entries.sort((a, b) => {
      const ia = scaleOrder.indexOf(a[0])
      const ib = scaleOrder.indexOf(b[0])
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
    })
    return entries.map(([name, members], i) => {
      const scaleInfo = SCALE_MAP[name]
      return { name: scaleInfo?.label || name, members, ring: i, col: scaleInfo?.color || groupColor(i), scaleId: name }
    })
  }

  // Legacy: sort by protagonist presence
  entries.sort((a, b) => {
    const w = arr => arr.some(c => c.arcType === 'protagonista') ? 0 : arr.some(c => c.arcType === 'mentor') ? 1 : 2
    return w(a[1]) - w(b[1])
  })
  return entries.map(([name, members], i) => ({ name, members, ring: i, col: groupColor(i) }))
}

// ── Color helpers ────────────────────────────────────────────
function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function lighten(hex, a) { const [r, g, b] = hexToRgb(hex); return `rgb(${Math.min(255, r + a * 255)},${Math.min(255, g + a * 255)},${Math.min(255, b + a * 255)})` }
function darken(hex, a) { const [r, g, b] = hexToRgb(hex); return `rgb(${Math.max(0, r - a * 255)},${Math.max(0, g - a * 255)},${Math.max(0, b - a * 255)})` }
function hexAlpha(hex, alpha) { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${alpha})` }

// ── Node sizing ──────────────────────────────────────────────
const NODE_R_BASE = { protagonista: 48, antagonista: 38, mentor: 34, aliado: 36, secundário: 28, episódico: 22 }
function nodeRadius(arcType, totalChars) {
  const base = NODE_R_BASE[arcType] || 24
  const scale = totalChars > 20 ? 0.6 : totalChars > 14 ? 0.75 : totalChars > 8 ? 0.85 : 1.0
  return Math.max(14, Math.round(base * scale))
}

// Smooth lerp
function lerp(a, b, t) { return a + (b - a) * t }

// ══════════════════════════════════════════════════════════════

export function CharacterNet({ chars, relations, episodeData, episodeFilter, onSelectChar, onUpdatePositions }) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const rafRef = useRef(null)
  const tickRef = useRef(0)

  const st = useRef({
    nodes: [], groups: [],
    W: 0, H: 0, CX: 0, CY: 0,
    zoom: 1, zoomTarget: 1,
    panX: 0, panY: 0,
    panXTarget: 0, panYTarget: 0,
    drag: null, pan0: null,
    hov: null, sel: null,
    clickStart: { x: 0, y: 0 },
    ringRadii: [],
    stars: [],
    // Parallax layers
    nebOff: { x: 0, y: 0 },
  })

  // ── Photo image cache ──────────────────────────────────────
  const imgCache = useRef({}) // { [url]: HTMLImageElement | 'loading' | 'error' }
  const loadPhoto = useCallback((url) => {
    if (!url || imgCache.current[url]) return imgCache.current[url]
    imgCache.current[url] = 'loading'
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => { imgCache.current[url] = img }
    img.onerror = () => { imgCache.current[url] = 'error' }
    img.src = url
    return 'loading'
  }, [])

  const [cardInfo, setCardInfo] = useState(null)
  const [, forceUpdate] = useState(0)

  // ── Layer toggles (Google Maps style) ─────────────────────
  // Only edges off by default — everything else visible
  const [layers, setLayers] = useState({
    edges: true,       // show relation lines (permanently)
    labels: true,      // show labels on edges
    rings: true,       // show orbital rings
    ringLabels: true,  // show group name labels
    stars: true,       // show starfield + nebula
    orbits: true,      // orbital animation
  })
  const toggleLayer = (key) => setLayers(prev => ({ ...prev, [key]: !prev[key] }))

  // ── Transforms ─────────────────────────────────────────────
  const w2s = useCallback((wx, wy) => {
    const s = st.current
    return { x: s.CX + (wx - s.CX) * s.zoom + s.panX * s.zoom, y: s.CY + (wy - s.CY) * s.zoom + s.panY * s.zoom }
  }, [])
  const s2w = useCallback((sx, sy) => {
    const s = st.current
    return { x: (sx - s.CX - s.panX * s.zoom) / s.zoom + s.CX, y: (sy - s.CY - s.panY * s.zoom) / s.zoom + s.CY }
  }, [])

  // ── Place nodes on rings ───────────────────────────────────
  const placeNodes = useCallback(() => {
    const s = st.current
    const { W, H, CX, CY } = s
    const base = Math.min(W, H)
    const groups = deriveGroups(chars)
    s.groups = groups

    const nGroups = groups.length
    const maxR = (base / 2) - 40
    const radii = []
    let prevR = 0
    for (let i = 0; i < nGroups; i++) {
      const count = groups[i].members.length
      const maxNR = Math.max(...groups[i].members.map(c => nodeRadius(c.arcType, chars.length)))
      const minR = count > 1 ? (count * maxNR * 2.4) / (2 * Math.PI) : 0
      const baseR = nGroups <= 1 ? maxR * 0.5
        : maxR * (0.15 + (i / Math.max(1, nGroups - 1)) * 0.75)
      const r = Math.max(baseR, minR, prevR + maxNR * 2.5 + 20)
      radii.push(Math.min(r, maxR))
      prevR = r
    }
    // Protagonist group always near center — tight ring or single center
    if (nGroups > 0 && groups[0].members.some(c => c.arcType === 'protagonista')) {
      if (groups[0].members.length === 1) radii[0] = 0
      else radii[0] = Math.min(radii[0], base * 0.08 + groups[0].members.length * 12)
    }
    s.ringRadii = radii

    const nodes = []
    let globalIdx = 0
    for (const group of groups) {
      const r = radii[group.ring]
      const count = group.members.length
      const useDouble = count > 7 && r > 0
      const inner = useDouble ? Math.ceil(count / 2) : 0
      const outer = useDouble ? count - inner : count

      group.members.forEach((c, j) => {
        const nodeR = nodeRadius(c.arcType, chars.length)
        const col = charColor(c.name, globalIdx)
        globalIdx++

        let wx, wy
        if (r === 0) {
          wx = CX; wy = CY
        } else if (useDouble) {
          const isOuter = j < outer
          const ringR = isOuter ? r : r * 0.65
          const ringCount = isOuter ? outer : inner
          const ringJ = isOuter ? j : j - outer
          const ang = -Math.PI / 2 + (2 * Math.PI * ringJ) / ringCount
          wx = CX + Math.cos(ang) * ringR
          wy = CY + Math.sin(ang) * ringR
        } else {
          const ang = -Math.PI / 2 + (2 * Math.PI * j) / count
          wx = CX + Math.cos(ang) * r
          wy = CY + Math.sin(ang) * r
        }

        const baseAngle = r === 0 ? 0 : Math.atan2(wy - CY, wx - CX)
        const orbitR = r === 0 ? 0 : Math.sqrt((wx - CX) ** 2 + (wy - CY) ** 2)

        const existing = s.nodes.find(nd => nd.id === c.id)
        nodes.push({
          ...c, r: nodeR,
          col, groupCol: group.col,
          stroke: darken(col, 0.15),
          ring: group.ring, groupName: group.name,
          baseAngle, orbitR,
          wx, wy,
          x: existing ? existing.x : wx,
          y: existing ? existing.y : wy,
          pinned: existing ? existing.pinned : false, // stays where dropped
          breathPhase: Math.random() * Math.PI * 2, // liquid breathing offset
        })
      })
    }
    s.nodes = nodes
  }, [chars])

  // ── Hit detection ──────────────────────────────────────────
  const hitNode = useCallback((sx, sy) => {
    const w = s2w(sx, sy)
    for (const n of st.current.nodes) {
      const dx = w.x - n.x, dy = w.y - n.y
      if (dx * dx + dy * dy < (n.r + 6) * (n.r + 6)) return n
    }
    return null
  }, [s2w])

  // ── Is char present in selected episode? ───────────────────
  const isPresent = useCallback((nd) => {
    if (!episodeFilter) return true
    const key = (nd.name || '').toUpperCase()
    return !!episodeData[episodeFilter]?.[key]
  }, [episodeFilter, episodeData])

  // ── DRAW ───────────────────────────────────────────────────
  const draw = useCallback(() => {
    const cv = canvasRef.current
    if (!cv) return
    const cx = cv.getContext('2d')
    const s = st.current
    const { W, H, CX, CY, zoom, panX, panY, nodes, groups, ringRadii, sel, hov, nebOff } = s
    const tick = tickRef.current
    const hasFilter = !!episodeFilter

    cx.clearRect(0, 0, W, H)

    const ly = layers // layer visibility

    // ── Semantic zoom levels ─────────────────────────────────
    // Level 0: zoomed out (<0.5) — dots + group names only
    // Level 1: medium (0.5–1.5) — photos/initials + first name
    // Level 2: zoomed in (>1.5) — full name, permanent edges
    const zoomLevel = zoom < 0.5 ? 0 : zoom > 1.5 ? 2 : 1

    // ── LIQUID GLASS BACKGROUND with PARALLAX ──────────────
    const pxFar = nebOff.x * 0.15
    const pyFar = nebOff.y * 0.15
    const pxMid = nebOff.x * 0.3
    const pyMid = nebOff.y * 0.3

    if (ly.stars) {
      // Organic gradient blobs — soft, moving, liquid feel
      const blobPhase = tick * 0.003

      // Blob 1: warm purple (top-left drift)
      const b1x = CX * 0.5 + Math.sin(blobPhase) * 60 + pxFar
      const b1y = CY * 0.4 + Math.cos(blobPhase * 0.7) * 40 + pyFar
      const b1 = cx.createRadialGradient(b1x, b1y, 0, b1x, b1y, Math.max(W, H) * 0.38)
      b1.addColorStop(0, 'rgba(139,92,246,0.12)')
      b1.addColorStop(0.4, 'rgba(99,60,200,0.06)')
      b1.addColorStop(1, 'transparent')
      cx.fillStyle = b1; cx.fillRect(0, 0, W, H)

      // Blob 2: cool blue (bottom-right drift)
      const b2x = CX * 1.4 + Math.cos(blobPhase * 0.8) * 50 + pxFar
      const b2y = CY * 1.3 + Math.sin(blobPhase * 0.6) * 35 + pyFar
      const b2 = cx.createRadialGradient(b2x, b2y, 0, b2x, b2y, Math.max(W, H) * 0.35)
      b2.addColorStop(0, 'rgba(59,130,246,0.10)')
      b2.addColorStop(0.4, 'rgba(30,64,175,0.04)')
      b2.addColorStop(1, 'transparent')
      cx.fillStyle = b2; cx.fillRect(0, 0, W, H)

      // Blob 3: teal accent (centre-bottom)
      const b3x = CX * 0.9 + Math.sin(blobPhase * 1.2) * 45 + pxMid
      const b3y = CY * 1.1 + Math.cos(blobPhase * 0.9) * 30 + pyMid
      const b3 = cx.createRadialGradient(b3x, b3y, 0, b3x, b3y, Math.max(W, H) * 0.28)
      b3.addColorStop(0, 'rgba(20,184,166,0.07)')
      b3.addColorStop(0.5, 'rgba(6,182,212,0.03)')
      b3.addColorStop(1, 'transparent')
      cx.fillStyle = b3; cx.fillRect(0, 0, W, H)

      // Centre glow — soft protagonist aura
      const cgx = CX + pxMid, cgy = CY + pyMid
      const cg = cx.createRadialGradient(cgx, cgy, 0, cgx, cgy, Math.min(W, H) * 0.25)
      cg.addColorStop(0, 'rgba(167,139,250,0.10)')
      cg.addColorStop(0.5, 'rgba(139,92,246,0.04)')
      cg.addColorStop(1, 'transparent')
      cx.fillStyle = cg; cx.fillRect(0, 0, W, H)

      // Starfield — subtle, parallax
      const pxStar = nebOff.x * 0.2
      const pyStar = nebOff.y * 0.2
      for (const star of s.stars) {
        const twinkle = 0.4 + 0.6 * Math.sin(tick * star.twinkleSpeed + star.twinkleOffset)
        cx.beginPath()
        cx.arc(star.x + pxStar, star.y + pyStar, star.r * 0.8, 0, Math.PI * 2)
        cx.fillStyle = `rgba(220,225,255,${star.a * twinkle * 0.6})`
        cx.fill()
      }
    }

    // ── WORLD SPACE: rings ─────────────────────────────────
    cx.save()
    cx.translate(CX, CY); cx.scale(zoom, zoom); cx.translate(-CX + panX, -CY + panY)

    if (ly.rings) {
      for (let i = ringRadii.length - 1; i >= 0; i--) {
        const col = groups[i]?.col || '#888'
        const r = ringRadii[i]
        if (r === 0) continue

        const breathR = r + Math.sin(tick * 0.008 + i * 1.5) * 2

        // Glass ring fill — soft translucent band
        cx.save()
        cx.beginPath(); cx.arc(CX, CY, breathR + 8, 0, Math.PI * 2)
        cx.beginPath()
        cx.arc(CX, CY, breathR + 8, 0, Math.PI * 2)
        cx.arc(CX, CY, breathR - 8, 0, Math.PI * 2, true) // cut inner
        cx.closePath()
        cx.fillStyle = hexAlpha(col, 0.025)
        cx.fill()
        cx.restore()

        // Glass border — white tint on top, color on bottom
        cx.save()
        cx.beginPath(); cx.arc(CX, CY, breathR, 0, Math.PI * 2)
        cx.strokeStyle = hexAlpha(col, 0.12)
        cx.lineWidth = 1.5; cx.stroke()
        cx.restore()

        // Top highlight arc (glass reflection)
        cx.save()
        cx.beginPath()
        cx.arc(CX, CY, breathR, -Math.PI * 0.8, -Math.PI * 0.2)
        cx.strokeStyle = 'rgba(255,255,255,0.06)'
        cx.lineWidth = 2; cx.stroke()
        cx.restore()
      }
    }

    // ── Ring labels — glass pills in world space ─────────────
    for (let i = 0; ly.ringLabels && i < groups.length; i++) {
      const r = ringRadii[i]
      if (r === 0) continue
      const col = groups[i].col
      const lbl = groups[i].name.toUpperCase()

      const labelScale = Math.max(0.6, Math.min(1.4, 1 / Math.sqrt(zoom)))
      const labelAlpha = zoom < 0.4 ? zoom / 0.4 : zoom > 2.5 ? Math.max(0, 1 - (zoom - 2.5) / 0.5) : 1
      if (labelAlpha < 0.05) continue

      cx.save()
      cx.globalAlpha = labelAlpha * 0.85
      const fs = Math.round(11 * labelScale)
      cx.font = `600 ${fs}px "DM Sans", sans-serif`
      const tw = cx.measureText(lbl).width
      const pw = tw + 24, ph = Math.round(26 * labelScale)
      const lx = CX, labelY = CY - r

      // Glass pill background
      cx.beginPath(); cx.roundRect(lx - pw / 2, labelY - ph / 2, pw, ph, ph / 2)
      cx.fillStyle = 'rgba(255,255,255,0.06)'; cx.fill()
      cx.strokeStyle = 'rgba(255,255,255,0.12)'; cx.lineWidth = 1; cx.stroke()

      // Top highlight (glass shine)
      cx.beginPath(); cx.roundRect(lx - pw / 2 + 2, labelY - ph / 2 + 1, pw - 4, ph * 0.45, ph / 2)
      cx.fillStyle = 'rgba(255,255,255,0.04)'; cx.fill()

      cx.fillStyle = hexAlpha(col, 0.9)
      cx.textAlign = 'center'; cx.textBaseline = 'middle'
      cx.fillText(lbl, lx, labelY + 0.5)
      cx.globalAlpha = 1
      cx.restore()
    }

    // ── EDGES ────────────────────────────────────────────────
    // Always collect edges (hover reveals them even when layer is off)
    const drawn = new Set()
    const edgeList = []
    for (const n of nodes) {
      const rels = relations.filter(r => r.from === n.id || r.to === n.id)
      for (const rel of rels) {
        const key = [rel.from, rel.to].sort().join('|')
        if (drawn.has(key)) continue
        drawn.add(key)
        const from = nodes.find(nd => nd.id === rel.from)
        const to = nodes.find(nd => nd.id === rel.to)
        if (!from || !to) continue
        const isSel = sel === from.id || sel === to.id
        const isHov = hov === from.id || hov === to.id
        edgeList.push({ rel, from, to, isSel, isHov })
      }
    }

    edgeList.sort((a, b) => (a.isSel ? 2 : a.isHov ? 1 : 0) - (b.isSel ? 2 : b.isHov ? 1 : 0))

    const edgesOn = ly.edges  // layer permanently on

    for (const { rel, from, to, isSel, isHov } of edgeList) {
      const relInfo = REL_MAP[rel.type] || RELATION_TYPES[0]
      const dash = relInfo.dash || []
      const anySel = sel !== null
      const anyHov = hov !== null

      const bothPresent = isPresent(from) && isPresent(to)
      const epMul = hasFilter ? (bothPresent ? 1.0 : 0.15) : 1.0

      // ── Edge visibility ─────────────────────────────────────
      let al = 0
      if (edgesOn) {
        // Layer ON: always show edges, brighter when zoomed in
        const baseAl = zoomLevel === 2 ? 0.35 : zoomLevel === 1 ? 0.25 : 0.18
        al = baseAl * epMul
        if (isSel) al = 1.0
        else if (isHov) al = 0.8
        else if (anySel) al = 0.06
        else if (anyHov) al = 0.12
      } else {
        // Layer OFF: only neighbourhood on hover/sel
        if (isSel) al = 0.7
        else if (isHov) al = 0.5
        else al = 0
      }

      if (al <= 0) continue  // skip invisible edges

      const same = from.ring === to.ring
      const perp = same ? 0.3 : 0.18
      const mx = (from.x + to.x) / 2 + (to.y - from.y) * perp
      const my = (from.y + to.y) / 2 - (to.x - from.x) * perp

      // Glow layer (only on hover/sel)
      if (isSel || isHov) {
        cx.save()
        cx.shadowColor = relInfo.color
        cx.shadowBlur = isSel ? 14 : 8
        cx.beginPath(); cx.moveTo(from.x, from.y)
        cx.quadraticCurveTo(mx, my, to.x, to.y)
        cx.strokeStyle = hexAlpha(relInfo.color, isSel ? 0.25 : 0.12)
        cx.lineWidth = isSel ? 5 : 4
        cx.setLineDash(dash); cx.stroke(); cx.setLineDash([])
        cx.restore()
      }

      // Main edge line — thinner for less clutter
      cx.save()
      cx.beginPath(); cx.moveTo(from.x, from.y)
      cx.quadraticCurveTo(mx, my, to.x, to.y)
      cx.strokeStyle = hexAlpha(relInfo.color, al)
      cx.lineWidth = isSel ? 2.5 : isHov ? 2 : 1.2
      cx.setLineDash(dash); cx.stroke(); cx.setLineDash([])
      cx.restore()

      // Small arrowhead (only hover/sel)
      if (isSel || isHov) {
        const ang = Math.atan2(to.y - my, to.x - mx)
        const ar = to.r + 5
        const ax = to.x - Math.cos(ang) * ar, ay = to.y - Math.sin(ang) * ar
        const arrowSize = isSel ? 10 : 8
        cx.beginPath(); cx.moveTo(ax, ay)
        cx.lineTo(ax - arrowSize * Math.cos(ang - 0.35), ay - arrowSize * Math.sin(ang - 0.35))
        cx.lineTo(ax - arrowSize * Math.cos(ang + 0.35), ay - arrowSize * Math.sin(ang + 0.35))
        cx.closePath(); cx.fillStyle = hexAlpha(relInfo.color, al * 0.8); cx.fill()
      }

      // Label — only on SELECT (not hover — reduces clutter massively)
      // On hover: just show the type as a tiny tag at midpoint
      if (isSel) {
        const labelText = rel.label || relInfo.label
        const t = 0.5
        const qx = (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * mx + t * t * to.x
        const qy = (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * my + t * t * to.y

        cx.save()
        cx.font = isSel ? '600 11px "DM Sans", sans-serif' : '500 10px "DM Sans", sans-serif'
        const tw = cx.measureText(labelText).width
        const pw = tw + 14, ph = isSel ? 22 : 18

        // Glass pill
        cx.beginPath(); cx.roundRect(qx - pw / 2, qy - ph / 2, pw, ph, ph / 2)
        cx.fillStyle = 'rgba(13,13,20,0.85)'; cx.fill()
        cx.strokeStyle = isSel ? hexAlpha(relInfo.color, 0.5) : 'rgba(255,255,255,0.12)'
        cx.lineWidth = 1; cx.stroke()
        cx.fillStyle = isSel ? '#fff' : hexAlpha(relInfo.color, 0.9)
        cx.textAlign = 'center'; cx.textBaseline = 'middle'
        cx.fillText(labelText, qx, qy + 0.5)
        cx.restore()

        // Type badge below the label (only when there's a custom label)
        if (rel.label) {
          cx.save()
          cx.font = '500 9px "DM Sans", sans-serif'
          const typeTw = cx.measureText(relInfo.label).width
          const typePw = typeTw + 10, typePh = 15
          cx.beginPath(); cx.roundRect(qx - typePw / 2, qy + ph / 2 + 3, typePw, typePh, typePh / 2)
          cx.fillStyle = 'rgba(13,13,20,0.85)'; cx.fill()
          cx.fillStyle = hexAlpha(relInfo.color, 0.8)
          cx.textAlign = 'center'; cx.textBaseline = 'middle'
          cx.fillText(relInfo.label, qx, qy + ph / 2 + 3 + typePh / 2)
          cx.restore()
        }
      } else if (isHov) {
        // Hover: tiny type tag at midpoint — minimal noise
        const t = 0.5
        const qx = (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * mx + t * t * to.x
        const qy = (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * my + t * t * to.y
        cx.save()
        cx.font = '600 9px "DM Sans", sans-serif'
        const tw = cx.measureText(relInfo.label).width
        const pw = tw + 10, ph = 16
        cx.beginPath(); cx.roundRect(qx - pw / 2, qy - ph / 2, pw, ph, ph / 2)
        cx.fillStyle = 'rgba(13,13,20,0.85)'; cx.fill()
        cx.fillStyle = hexAlpha(relInfo.color, 0.85)
        cx.textAlign = 'center'; cx.textBaseline = 'middle'
        cx.fillText(relInfo.label, qx, qy + 0.5)
        cx.restore()
      }
    }

    // ── NODES ────────────────────────────────────────────────
    const sorted = [...nodes].sort((a, b) => {
      if (a.id === sel) return 1; if (b.id === sel) return -1; return b.r - a.r
    })

    for (const nd of sorted) {
      const { x, y, r, col } = nd
      const isSel = sel === nd.id
      const isHov = hov === nd.id
      const anySel = sel !== null
      const anyHov = hov !== null
      const adj = anySel && !isSel && relations.some(rl =>
        (rl.from === sel && rl.to === nd.id) || (rl.to === sel && rl.from === nd.id)
      )
      const hovAdj = anyHov && !isHov && relations.some(rl =>
        (rl.from === hov && rl.to === nd.id) || (rl.to === hov && rl.from === nd.id)
      )

      // Episode overlay alpha + neighbourhood dimming (UX best practice: 20% for unrelated)
      const present = isPresent(nd)
      let nodeAlpha
      if (hasFilter) {
        nodeAlpha = present ? 1.0 : 0.15
      } else if (anySel) {
        nodeAlpha = isSel || adj ? 1 : 0.15  // 15% for unrelated (was 18%)
      } else if (anyHov) {
        nodeAlpha = isHov || hovAdj ? 1 : 0.2  // 20% for unrelated (was 50%)
      } else {
        nodeAlpha = 1
      }
      cx.globalAlpha = nodeAlpha

      const isProtag = nd.ring === 0 && nd.orbitR === 0
      // Liquid breathing
      const breath = 1 + Math.sin(tick * 0.02 + nd.breathPhase) * 0.03
      const pulse = isProtag ? breath + Math.sin(tick * 0.03) * 0.04 : breath
      const R = r * pulse

      // ── ZOOMED OUT: simple colored dot ─────────────────────
      if (zoomLevel === 0 && !isSel && !isHov) {
        cx.beginPath(); cx.arc(x, y, R * 0.7, 0, Math.PI * 2)
        const dotG = cx.createRadialGradient(x, y - R * 0.2, 0, x, y, R * 0.7)
        dotG.addColorStop(0, hexAlpha(col, 0.7))
        dotG.addColorStop(1, hexAlpha(col, 0.25))
        cx.fillStyle = dotG; cx.fill()
        cx.strokeStyle = hexAlpha(col, 0.3); cx.lineWidth = 1; cx.stroke()
        cx.globalAlpha = 1
        continue // skip detailed rendering
      }

      // ── LIQUID GLASS ORB ──────────────────────────────────
      cx.save()

      // Check for photo
      const photoUrl = nd.photo
      const photoImg = photoUrl ? loadPhoto(photoUrl) : null
      const hasPhoto = photoImg && photoImg !== 'loading' && photoImg !== 'error'

      // Outer glow (soft halo)
      cx.shadowColor = col
      cx.shadowBlur = isSel ? 50 : isHov ? 35 : isProtag ? 24 : 12

      // Protagonist aura
      if (isProtag) {
        for (let a = 0; a < 3; a++) {
          const auraR = R + 14 + a * 14
          const auraAlpha = 0.08 - a * 0.02
          const auraPhase = tick * 0.012 + a * 0.8
          const aR = auraR + Math.sin(auraPhase) * 3
          cx.beginPath(); cx.arc(x, y, aR, 0, Math.PI * 2)
          const ag = cx.createRadialGradient(x, y, aR - 4, x, y, aR + 4)
          ag.addColorStop(0, hexAlpha(col, auraAlpha))
          ag.addColorStop(1, 'transparent')
          cx.fillStyle = ag; cx.fill()
        }
      }

      if (hasPhoto) {
        // ── Photo orb: draw image clipped to circle ──────────
        cx.save()
        cx.beginPath(); cx.arc(x, y, R, 0, Math.PI * 2); cx.clip()
        // Draw image centered, cover-fit
        const imgW = photoImg.naturalWidth, imgH = photoImg.naturalHeight
        const imgScale = Math.max(R * 2 / imgW, R * 2 / imgH)
        const dw = imgW * imgScale, dh = imgH * imgScale
        cx.drawImage(photoImg, x - dw / 2, y - dh / 2, dw, dh)
        // Subtle dark overlay at bottom for depth
        const photoOverlay = cx.createLinearGradient(x, y - R, x, y + R)
        photoOverlay.addColorStop(0, 'rgba(0,0,0,0)')
        photoOverlay.addColorStop(0.7, 'rgba(0,0,0,0)')
        photoOverlay.addColorStop(1, 'rgba(0,0,0,0.3)')
        cx.fillStyle = photoOverlay; cx.fillRect(x - R, y - R, R * 2, R * 2)
        cx.restore()

        // Glass overlay — crescent highlight on top of photo
        cx.beginPath()
        cx.ellipse(x, y - R * 0.32, R * 0.55, R * 0.28, 0, 0, Math.PI * 2)
        const highG = cx.createRadialGradient(x, y - R * 0.38, 0, x, y - R * 0.32, R * 0.55)
        highG.addColorStop(0, 'rgba(255,255,255,0.20)')
        highG.addColorStop(0.5, 'rgba(255,255,255,0.05)')
        highG.addColorStop(1, 'transparent')
        cx.fillStyle = highG; cx.fill()
      } else {
        // ── Gradient orb (no photo) ──────────────────────────
        // 1. Base glass fill
        const baseFill = cx.createRadialGradient(x, y - R * 0.1, R * 0.1, x, y, R)
        baseFill.addColorStop(0, hexAlpha(col, 0.55))
        baseFill.addColorStop(0.5, hexAlpha(col, 0.35))
        baseFill.addColorStop(0.8, hexAlpha(col, 0.22))
        baseFill.addColorStop(1, hexAlpha(col, 0.12))
        cx.beginPath(); cx.arc(x, y, R, 0, Math.PI * 2)
        cx.fillStyle = baseFill; cx.fill()

        // 2. Inner white glow
        const innerGlow = cx.createRadialGradient(x - R * 0.15, y - R * 0.2, R * 0.05, x, y, R)
        innerGlow.addColorStop(0, 'rgba(255,255,255,0.25)')
        innerGlow.addColorStop(0.3, 'rgba(255,255,255,0.08)')
        innerGlow.addColorStop(1, 'transparent')
        cx.beginPath(); cx.arc(x, y, R, 0, Math.PI * 2)
        cx.fillStyle = innerGlow; cx.fill()

        // 3. Crescent highlight
        cx.beginPath()
        cx.ellipse(x, y - R * 0.32, R * 0.55, R * 0.28, 0, 0, Math.PI * 2)
        const highG = cx.createRadialGradient(x, y - R * 0.38, 0, x, y - R * 0.32, R * 0.55)
        highG.addColorStop(0, 'rgba(255,255,255,0.30)')
        highG.addColorStop(0.5, 'rgba(255,255,255,0.08)')
        highG.addColorStop(1, 'transparent')
        cx.fillStyle = highG; cx.fill()

        // Initials inside orb (only when no photo)
        const initFs = r > 44 ? 18 : r > 34 ? 15 : r > 26 ? 13 : 11
        const initials = (nd.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
        cx.font = `800 ${initFs}px "DM Sans", sans-serif`
        cx.fillStyle = 'rgba(255,255,255,0.7)'; cx.textAlign = 'center'; cx.textBaseline = 'middle'
        cx.fillText(initials, x, y)
      }

      cx.restore()

      // 4. Glass border
      cx.beginPath(); cx.arc(x, y, R, 0, Math.PI * 2)
      if (isSel) {
        cx.strokeStyle = 'rgba(255,255,255,0.7)'; cx.lineWidth = 2.5
      } else if (isHov) {
        cx.strokeStyle = 'rgba(255,255,255,0.45)'; cx.lineWidth = 2
      } else {
        cx.strokeStyle = hasPhoto ? hexAlpha(col, 0.4) : 'rgba(255,255,255,0.15)'; cx.lineWidth = 1.5
      }
      cx.stroke()

      // 5. Subtle bottom shadow
      cx.save()
      const shadow = cx.createRadialGradient(x, y + R * 0.8, R * 0.3, x, y + R * 0.8, R * 1.2)
      shadow.addColorStop(0, 'rgba(0,0,0,0.08)')
      shadow.addColorStop(1, 'transparent')
      cx.fillStyle = shadow; cx.fillRect(x - R * 1.5, y, R * 3, R * 2)
      cx.restore()

      // 6. Group color accent ring
      if (nd.groupCol && !isSel) {
        cx.beginPath(); cx.arc(x, y, R + 3, 0, Math.PI * 2)
        cx.strokeStyle = hexAlpha(nd.groupCol, 0.12); cx.lineWidth = 1.5; cx.stroke()
      }

      // Pinned indicator
      if (nd.pinned && !isProtag) {
        cx.save()
        cx.beginPath(); cx.arc(x + R * 0.55, y - R * 0.55, 3.5, 0, Math.PI * 2)
        cx.fillStyle = 'rgba(255,255,255,0.4)'; cx.fill()
        cx.strokeStyle = hexAlpha(col, 0.5); cx.lineWidth = 1; cx.stroke()
        cx.restore()
      }

      // ── Name BELOW the orb — semantic zoom aware ────────────
      // Level 0 (far): no name
      // Level 1 (medium): first name only
      // Level 2 (close): full name
      if (zoomLevel >= 1 || isSel || isHov) {
        const fs = r > 44 ? 13 : r > 34 ? 12 : r > 26 ? 11 : 10
        const fullName = nd.name.replace(/\s*\(.*\)/, '')
        const displayName = zoomLevel >= 2 || isSel ? fullName : fullName.split(' ')[0]
        cx.save()
        cx.shadowColor = 'rgba(0,0,0,0.8)'; cx.shadowBlur = 5
        cx.font = `600 ${fs}px "DM Sans", sans-serif`
        cx.fillStyle = isSel ? '#fff' : isHov ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.75)'
        cx.textAlign = 'center'; cx.textBaseline = 'top'
        cx.fillText(displayName, x, y + R + 6)
        cx.restore()
      }

      cx.globalAlpha = 1
    }

    cx.restore()
    tickRef.current++
  }, [chars, relations, episodeData, episodeFilter, w2s, isPresent, layers, loadPhoto])

  // ── Animation loop ──────────────────────────────────────────
  const loop = useCallback(() => {
    const s = st.current
    const tick = tickRef.current

    for (const n of s.nodes) {
      if (s.drag?.id === n.id) continue

      // Only orbit if not pinned and orbits layer is on
      if (n.orbitR > 0 && !s.sel && !n.pinned && layers.orbits) {
        const speed = 0.0003 / (1 + n.ring * 0.5)
        // Add organic sway
        const sway = Math.sin(tick * 0.005 + n.breathPhase) * 4
        const newAngle = n.baseAngle + tick * speed
        n.wx = s.CX + Math.cos(newAngle) * (n.orbitR + sway)
        n.wy = s.CY + Math.sin(newAngle) * (n.orbitR + sway)
      }

      // Smooth interpolation — softer easing
      n.x += (n.wx - n.x) * 0.06
      n.y += (n.wy - n.y) * 0.06
    }

    // Smooth zoom (exponential ease-out, much smoother)
    s.zoom = lerp(s.zoom, s.zoomTarget, 0.06)
    // Smooth pan
    s.panX = lerp(s.panX, s.panXTarget, 0.08)
    s.panY = lerp(s.panY, s.panYTarget, 0.08)
    // Parallax offset tracks pan
    s.nebOff.x = s.panX * s.zoom
    s.nebOff.y = s.panY * s.zoom

    draw()
    rafRef.current = requestAnimationFrame(loop)
  }, [draw, layers.orbits])

  // ── Resize ─────────────────────────────────────────────────
  const resize = useCallback(() => {
    const c = containerRef.current, cv = canvasRef.current
    if (!c || !cv) return
    const rect = c.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    cv.width = rect.width * dpr; cv.height = rect.height * dpr
    cv.style.width = rect.width + 'px'; cv.style.height = rect.height + 'px'
    cv.getContext('2d').scale(dpr, dpr)
    const s = st.current
    s.W = rect.width; s.H = rect.height; s.CX = rect.width / 2; s.CY = rect.height / 2

    if (s.stars.length === 0 || Math.abs(s.stars._w - rect.width) > 50) {
      const stars = []
      const count = Math.floor((rect.width * rect.height) / 1800)
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * rect.width,
          y: Math.random() * rect.height,
          r: Math.random() * 1.2 + 0.3,
          a: Math.random() * 0.5 + 0.1,
          twinkleSpeed: Math.random() * 0.03 + 0.01,
          twinkleOffset: Math.random() * Math.PI * 2,
        })
      }
      stars._w = rect.width
      s.stars = stars
    }

    placeNodes()
  }, [placeNodes])

  useEffect(() => {
    resize(); rafRef.current = requestAnimationFrame(loop)
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener('resize', resize) }
  }, [resize, loop])

  useEffect(() => { placeNodes() }, [chars.length, relations.length, placeNodes])

  // ── Mouse events ───────────────────────────────────────────
  const closeCard = useCallback(() => setCardInfo(null), [])

  const onMouseDown = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top
    const s = st.current
    s.clickStart = { x: e.clientX, y: e.clientY }
    const node = hitNode(sx, sy)
    if (node) {
      const w = s2w(sx, sy)
      s.drag = { id: node.id, ox: w.x - node.x, oy: w.y - node.y }
    } else {
      s.pan0 = { x: e.clientX - s.panXTarget * s.zoom, y: e.clientY - s.panYTarget * s.zoom }
      closeCard()
    }
  }, [hitNode, s2w, closeCard])

  const onMouseMove = useCallback((e) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top
    const s = st.current
    if (s.drag) {
      const w = s2w(sx, sy)
      const node = s.nodes.find(n => n.id === s.drag.id)
      if (node) {
        node.x = w.x - s.drag.ox
        node.y = w.y - s.drag.oy
        node.wx = node.x
        node.wy = node.y
      }
      return
    }
    if (s.pan0) {
      s.panXTarget = (e.clientX - s.pan0.x) / s.zoom
      s.panYTarget = (e.clientY - s.pan0.y) / s.zoom
      closeCard()
      return
    }
    const node = hitNode(sx, sy)
    s.hov = node ? node.id : null
    canvasRef.current.style.cursor = node ? 'pointer' : 'grab'
  }, [hitNode, s2w, closeCard])

  const onMouseUp = useCallback((e) => {
    const s = st.current
    const moved = Math.abs(e.clientX - s.clickStart.x) + Math.abs(e.clientY - s.clickStart.y) > 6
    if (s.drag) {
      if (!moved) {
        // Click — toggle selection
        const node = s.nodes.find(n => n.id === s.drag.id)
        if (node) {
          if (s.sel === node.id) { s.sel = null; closeCard() }
          else {
            s.sel = node.id
            const sp = w2s(node.x, node.y)
            setCardInfo({ node, x: sp.x, y: sp.y })
          }
        }
      } else {
        // Drag completed — pin the node where it was dropped
        const node = s.nodes.find(n => n.id === s.drag.id)
        if (node) {
          node.pinned = true
          node.wx = node.x
          node.wy = node.y
        }
        const posMap = {}
        for (const n of s.nodes) posMap[n.id] = { x: n.x, y: n.y }
        onUpdatePositions(posMap)
      }
      s.drag = null
    } else {
      if (!moved) {
        const rect = canvasRef.current?.getBoundingClientRect()
        if (rect) {
          const sx = e.clientX - rect.left, sy = e.clientY - rect.top
          const node = hitNode(sx, sy)
          if (node) {
            if (s.sel === node.id) { s.sel = null; closeCard() }
            else {
              s.sel = node.id
              const sp = w2s(node.x, node.y)
              setCardInfo({ node, x: sp.x, y: sp.y })
            }
          } else { s.sel = null; closeCard() }
        }
      }
      s.pan0 = null
    }
    forceUpdate(v => v + 1)
  }, [hitNode, w2s, onUpdatePositions, closeCard])

  const onWheel = useCallback((e) => {
    e.preventDefault()
    // Smoother zoom: smaller increments, zoom toward cursor
    const delta = e.deltaY > 0 ? -0.06 : 0.06
    st.current.zoomTarget = Math.min(3.5, Math.max(0.2, st.current.zoomTarget * (1 + delta)))
    closeCard()
  }, [closeCard])

  const recalc = useCallback(() => {
    const s = st.current
    // Unpin all nodes
    for (const n of s.nodes) n.pinned = false
    s.nodes = []
    s.panXTarget = 0; s.panYTarget = 0
    s.zoomTarget = 1
    s.sel = null; s.hov = null
    placeNodes(); closeCard()
  }, [placeNodes, closeCard])

  // ── Card position ──────────────────────────────────────────
  const cardPos = cardInfo ? (() => {
    const cw = 300, ch = 280
    const s = st.current
    let x = cardInfo.x + 20, y = cardInfo.y - ch / 2
    if (x + cw > s.W - 20) x = cardInfo.x - cw - 20
    if (y < 10) y = 10
    if (y + ch > s.H - 10) y = s.H - ch - 10
    return { left: x, top: y }
  })() : null

  // ── Empty state ────────────────────────────────────────────
  if (chars.length === 0) {
    return (
      <div className={styles.netWrap} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className={styles.emptyState}>
          <span style={{ fontSize: 40, opacity: 0.3 }}>🕸</span>
          <p>Sem personagens no Universo</p>
          <small>Adiciona personagens ou importa dos guiões</small>
        </div>
      </div>
    )
  }

  const cn = cardInfo?.node

  return (
    <div ref={containerRef} className={styles.netWrap} style={{ position: 'relative' }}>
      <canvas ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove}
        onMouseUp={onMouseUp} onMouseLeave={onMouseUp} onWheel={onWheel}
      />

      {/* Floating character card */}
      {cn && cardPos && (
        <div className={styles.floatingCard} style={cardPos}>
          <div className={styles.fcBar} style={{ background: cn.col }} />
          <div className={styles.fcContent}>
            <div className={styles.fcHead}>
              <div>
                <div className={styles.fcName} style={{ color: cn.col }}>{cn.name}</div>
                <div className={styles.fcRole}>
                  <span className={styles.fcBadge} style={{ background: hexAlpha(cn.groupCol || cn.col, 0.2), color: cn.groupCol || cn.col }}>{cn.groupName}</span>
                  <span className={styles.fcBadge} style={{ background: hexAlpha(cn.col, 0.15), color: cn.col }}>{cn.arcType}</span>
                </div>
              </div>
              <button className={styles.fcClose} onClick={closeCard}><X size={14} /></button>
            </div>

            {cn.traits?.length > 0 && (
              <div className={styles.fcTraits}>
                {cn.traits.slice(0, 5).map((t, i) => (
                  <span key={i} className={styles.fcTag} style={{ background: hexAlpha(cn.col, 0.12), color: lighten(cn.col, 0.25) }}>{t}</span>
                ))}
              </div>
            )}

            {cn.description && (
              <p className={styles.fcDesc}>{cn.description.length > 140 ? cn.description.slice(0, 140) + '…' : cn.description}</p>
            )}

            {(() => {
              const nodeRels = relations.filter(r => r.from === cn.id || r.to === cn.id).slice(0, 4)
              if (!nodeRels.length) return null
              return (
                <div className={styles.fcRels}>
                  {nodeRels.map((rel, i) => {
                    const otherId = rel.from === cn.id ? rel.to : rel.from
                    const other = chars.find(c => c.id === otherId)
                    const relInfo = REL_MAP[rel.type] || RELATION_TYPES[0]
                    return (
                      <div key={i} className={styles.fcRelRow}>
                        <span className={styles.fcRelDot} style={{ background: relInfo.color }} />
                        <span className={styles.fcRelName}>{other?.name || '?'}</span>
                        <span className={styles.fcRelType} style={{ color: relInfo.color }}>{relInfo.label}</span>
                      </div>
                    )
                  })}
                </div>
              )
            })()}

            <button className={styles.fcMore} onClick={() => { onSelectChar(cn); closeCard() }}>
              Ver ficha completa <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Reset button — prominent, inside the screen */}
      <button className={styles.resetBtn} onClick={recalc} title="Recalcular layout — desfixa todas as bolas">
        <RotateCcw size={16} />
        <span>Recalcular</span>
      </button>

      {/* Layer toggles — always open, 50% transparent */}
      <div className={styles.layerPanel}>
        <div className={styles.layerHeader}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>
          </svg>
          <span>Camadas</span>
        </div>
        <div className={styles.layerList}>
          {[
            { key: 'edges', label: 'Ligações', icon: '─' },
            { key: 'labels', label: 'Labels', icon: 'Aa' },
            { key: 'rings', label: 'Órbitas', icon: '◎' },
            { key: 'ringLabels', label: 'Nomes dos grupos', icon: '▭' },
            { key: 'stars', label: 'Estrelas & Nebulosa', icon: '✦' },
            { key: 'orbits', label: 'Movimento orbital', icon: '↻' },
          ].map(item => (
            <label key={item.key} className={styles.layerItem}>
              <input
                type="checkbox"
                checked={layers[item.key]}
                onChange={() => toggleLayer(item.key)}
              />
              <span className={styles.layerIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className={styles.netLegend}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
          Tipos de ligação
        </div>
        {RELATION_TYPES.map(r => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <svg width={28} height={8}>
              <line x1={0} y1={4} x2={28} y2={4}
                stroke={r.color} strokeWidth={3} strokeOpacity={0.9}
                strokeDasharray={r.dash?.length ? r.dash.join(',') : undefined}
              />
            </svg>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>{r.label}</span>
          </div>
        ))}
      </div>

      {/* Hint */}
      <div style={{
        position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 16px',
        fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 500, pointerEvents: 'none',
      }}>
        {relations.length === 0
          ? 'Sem relações definidas — adiciona relações entre personagens para ver as ligações'
          : 'Clica · arrasta para fixar · scroll = zoom'
        }
      </div>
    </div>
  )
}
