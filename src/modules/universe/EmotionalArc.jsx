// EmotionalArc — liquid wave graph showing emotional tension across episodes
// Dark-theme · animated · episode overlay

import { useEffect, useRef, useCallback } from 'react'
import styles from './Universe.module.css'

// ── Phase → tension mapping ──────────────────────────────────
const PHASE_TENSION = {
  'apresentação': 0.25, 'apresent': 0.25, 'instalação': 0.35, 'instal': 0.35,
  'escalada': 0.55, 'escal': 0.55, 'confronto': 0.70, 'confront': 0.70,
  'ruptura': 0.80, 'ruptur': 0.80, 'crise': 0.90,
  'clímax': 1.0, 'climax': 1.0, 'resolução': 0.35, 'resol': 0.35,
  'epílogo': 0.20, 'epilogo': 0.20,
}

function phaseTension(phase) {
  if (!phase) return 0.5
  const p = phase.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  for (const [key, val] of Object.entries(PHASE_TENSION)) {
    const k = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (p.includes(k)) return val
  }
  return 0.5
}

// ── Color interpolation (blue→purple→red based on tension) ──
function tensionColor(t) {
  const r = Math.round(60 + t * 195)
  const g = Math.round(130 - t * 80)
  const b = Math.round(220 - t * 100)
  return `rgb(${r},${g},${b})`
}

// ══════════════════════════════════════════════════════════════

export function EmotionalArc({ episodeArcs = [], episodeFilter, onSelectEpisode }) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const rafRef = useRef(null)
  const tickRef = useRef(0)
  const sizeRef = useRef({ W: 0, H: 0 })

  // ── Derive data points ─────────────────────────────────────
  const points = episodeArcs
    .slice()
    .sort((a, b) => (a.epNum || 0) - (b.epNum || 0))
    .map(arc => ({
      epNum: arc.epNum,
      title: arc.title || '',
      phase: arc.phase || '',
      tension: phaseTension(arc.phase),
      id: arc.id,
    }))

  // ── Draw ───────────────────────────────────────────────────
  const draw = useCallback(() => {
    const cv = canvasRef.current
    if (!cv || points.length === 0) return
    const cx = cv.getContext('2d')
    const { W, H } = sizeRef.current
    const tick = tickRef.current

    const pad = { l: 50, r: 30, t: 30, b: 40 }
    const gW = W - pad.l - pad.r
    const gH = H - pad.t - pad.b

    cx.clearRect(0, 0, W, H)

    // ── Grid lines (subtle)
    cx.save()
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + gH * (1 - i / 4)
      cx.beginPath(); cx.moveTo(pad.l, y); cx.lineTo(pad.l + gW, y)
      cx.strokeStyle = 'rgba(255,255,255,0.04)'; cx.lineWidth = 1; cx.stroke()
    }

    // Y axis labels
    cx.font = '500 9px "DM Sans", sans-serif'
    cx.fillStyle = 'rgba(255,255,255,0.2)'; cx.textAlign = 'right'; cx.textBaseline = 'middle'
    cx.fillText('Alta', pad.l - 10, pad.t + 4)
    cx.fillText('Baixa', pad.l - 10, pad.t + gH - 4)
    cx.restore()

    // ── Build curve points
    const pts = points.map((p, i) => {
      const x = pad.l + (points.length === 1 ? gW / 2 : (gW * i) / (points.length - 1))
      const wave = Math.sin(tick * 0.025 + i * 1.2) * 3 + Math.sin(tick * 0.015 + i * 0.8) * 2
      const y = pad.t + gH * (1 - p.tension) + wave
      return { x, y, ...p }
    })

    // ── BASE curve (always drawn, dimmed if filter active)
    const baseAlpha = episodeFilter ? 0.2 : 1.0

    // Gradient fill under curve
    cx.save()
    cx.globalAlpha = baseAlpha * 0.6
    cx.beginPath()
    cx.moveTo(pts[0].x, pad.t + gH)

    // Smooth curve through points
    for (let i = 0; i < pts.length; i++) {
      if (i === 0) { cx.lineTo(pts[0].x, pts[0].y); continue }
      const prev = pts[i - 1], curr = pts[i]
      const cpx = (prev.x + curr.x) / 2
      cx.bezierCurveTo(cpx, prev.y, cpx, curr.y, curr.x, curr.y)
    }
    cx.lineTo(pts[pts.length - 1].x, pad.t + gH)
    cx.closePath()

    const fillGrad = cx.createLinearGradient(0, pad.t, 0, pad.t + gH)
    fillGrad.addColorStop(0, 'rgba(139,92,246,0.25)')
    fillGrad.addColorStop(0.5, 'rgba(99,102,241,0.10)')
    fillGrad.addColorStop(1, 'rgba(59,130,246,0.02)')
    cx.fillStyle = fillGrad; cx.fill()
    cx.restore()

    // Line
    cx.save()
    cx.globalAlpha = baseAlpha
    cx.beginPath()
    for (let i = 0; i < pts.length; i++) {
      if (i === 0) { cx.moveTo(pts[0].x, pts[0].y); continue }
      const prev = pts[i - 1], curr = pts[i]
      const cpx = (prev.x + curr.x) / 2
      cx.bezierCurveTo(cpx, prev.y, cpx, curr.y, curr.x, curr.y)
    }
    cx.strokeStyle = 'rgba(167,139,250,0.7)'; cx.lineWidth = 2.5
    cx.shadowColor = '#a78bfa'; cx.shadowBlur = 10
    cx.stroke()
    cx.restore()

    // ── SELECTED EPISODE highlight ───────────────────────────
    const selIdx = episodeFilter ? pts.findIndex(p => `EP${String(p.epNum).padStart(2, '0')}` === episodeFilter || String(p.epNum) === episodeFilter) : -1

    if (selIdx >= 0) {
      const sp = pts[selIdx]

      // Vertical highlight line
      cx.beginPath(); cx.moveTo(sp.x, pad.t); cx.lineTo(sp.x, pad.t + gH)
      cx.strokeStyle = 'rgba(167,139,250,0.15)'; cx.lineWidth = 1; cx.setLineDash([3, 5]); cx.stroke(); cx.setLineDash([])

      // Highlight fill from previous to next point
      const from = selIdx > 0 ? pts[selIdx - 1] : sp
      const to = selIdx < pts.length - 1 ? pts[selIdx + 1] : sp
      cx.save()
      cx.globalAlpha = 0.5
      cx.beginPath()
      cx.moveTo(from.x, pad.t + gH)
      cx.lineTo(from.x, from.y)
      const cpx1 = (from.x + sp.x) / 2
      cx.bezierCurveTo(cpx1, from.y, cpx1, sp.y, sp.x, sp.y)
      const cpx2 = (sp.x + to.x) / 2
      cx.bezierCurveTo(cpx2, sp.y, cpx2, to.y, to.x, to.y)
      cx.lineTo(to.x, pad.t + gH)
      cx.closePath()
      const hGrad = cx.createLinearGradient(0, pad.t, 0, pad.t + gH)
      hGrad.addColorStop(0, tensionColor(sp.tension) + '40')
      hGrad.addColorStop(1, 'transparent')
      cx.fillStyle = hGrad; cx.fill()
      cx.restore()

      // Highlight line segment
      cx.save()
      cx.beginPath()
      cx.moveTo(from.x, from.y)
      cx.bezierCurveTo(cpx1, from.y, cpx1, sp.y, sp.x, sp.y)
      cx.bezierCurveTo(cpx2, sp.y, cpx2, to.y, to.x, to.y)
      cx.strokeStyle = tensionColor(sp.tension); cx.lineWidth = 3.5
      cx.shadowColor = tensionColor(sp.tension); cx.shadowBlur = 16
      cx.stroke()
      cx.restore()
    }

    // ── Dots & labels ────────────────────────────────────────
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i]
      const isSel = i === selIdx
      const dotR = isSel ? 8 : 5
      const col = tensionColor(p.tension)

      // Dot
      cx.save()
      if (isSel) { cx.shadowColor = col; cx.shadowBlur = 20 }
      cx.beginPath(); cx.arc(p.x, p.y, dotR, 0, Math.PI * 2)
      cx.fillStyle = isSel ? col : 'rgba(167,139,250,0.8)'; cx.fill()
      cx.strokeStyle = isSel ? '#fff' : 'rgba(255,255,255,0.3)'; cx.lineWidth = isSel ? 2 : 1; cx.stroke()
      cx.restore()

      // Episode label
      cx.save()
      cx.font = isSel ? '700 11px "DM Sans", sans-serif' : '500 10px "DM Sans", sans-serif'
      cx.fillStyle = isSel ? '#fff' : 'rgba(255,255,255,0.4)'
      cx.textAlign = 'center'; cx.textBaseline = 'top'
      cx.fillText(`EP${String(p.epNum).padStart(2, '0')}`, p.x, pad.t + gH + 8)
      cx.restore()

      // Phase label above dot (when selected or always if few points)
      if (isSel || points.length <= 8) {
        cx.save()
        cx.font = '600 9px "DM Sans", sans-serif'
        cx.fillStyle = isSel ? col : 'rgba(255,255,255,0.25)'
        cx.textAlign = 'center'; cx.textBaseline = 'bottom'
        cx.fillText(p.phase || '', p.x, p.y - dotR - 6)
        cx.restore()
      }
    }

    tickRef.current++
  }, [points, episodeFilter])

  // ── Animation loop ─────────────────────────────────────────
  const loop = useCallback(() => {
    draw()
    rafRef.current = requestAnimationFrame(loop)
  }, [draw])

  // ── Resize ─────────────────────────────────────────────────
  const resize = useCallback(() => {
    const c = containerRef.current, cv = canvasRef.current
    if (!c || !cv) return
    const rect = c.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    cv.width = rect.width * dpr; cv.height = rect.height * dpr
    cv.style.width = rect.width + 'px'; cv.style.height = rect.height + 'px'
    cv.getContext('2d').scale(dpr, dpr)
    sizeRef.current = { W: rect.width, H: rect.height }
  }, [])

  useEffect(() => {
    resize(); rafRef.current = requestAnimationFrame(loop)
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener('resize', resize) }
  }, [resize, loop])

  // ── Click detection for selecting episode ──────────────────
  const onClick = useCallback((e) => {
    if (!onSelectEpisode || points.length === 0) return
    const rect = canvasRef.current.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const { W } = sizeRef.current
    const pad = { l: 50, r: 30 }
    const gW = W - pad.l - pad.r

    // Find closest episode point
    let closest = null, minDist = Infinity
    for (let i = 0; i < points.length; i++) {
      const px = pad.l + (points.length === 1 ? gW / 2 : (gW * i) / (points.length - 1))
      const dist = Math.abs(mx - px)
      if (dist < minDist) { minDist = dist; closest = points[i] }
    }
    if (closest && minDist < 40) {
      const epId = `EP${String(closest.epNum).padStart(2, '0')}`
      onSelectEpisode(episodeFilter === epId ? null : epId)
    }
  }, [points, episodeFilter, onSelectEpisode])

  if (points.length === 0) {
    return (
      <div ref={containerRef} className={styles.emotionalArcWrap}>
        <div className={styles.emptyState} style={{ padding: '20px 0' }}>
          <p style={{ fontSize: 13 }}>Arco emocional</p>
          <small>Adiciona arcos de episódio para ver o gráfico</small>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={styles.emotionalArcWrap}>
      <div className={styles.arcLabel}>Arco Emocional</div>
      <canvas ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer' }}
        onClick={onClick}
      />
    </div>
  )
}
