// Mapa de tensão dramática — D3
// Intensidade cena a cena: 0–100

import { useEffect, useRef, useState } from 'react'
import { select } from 'd3-selection'
import { scaleLinear } from 'd3-scale'
import { line, area, curveCatmullRom } from 'd3-shape'
import { axisLeft } from 'd3-axis'
import { buildTensionMap } from '../../utils/script-parser.js'
import styles from './TensionMap.module.css'

const SCENE_TYPE_COLORS = {
  âncora:   '#A02E6F',
  grupo:    '#2E6FA0',
  diálogo:  '#2EA080',
  solo:     '#7B4FBF',
  transição:'#6E6E78',
  gag:      '#BF6A2E',
}

export function TensionMap({ script }) {
  const svgRef  = useRef(null)
  const [hovered, setHovered] = useState(null)

  const tensionData = script?.scenes ? buildTensionMap(script.scenes) : []

  useEffect(() => {
    if (!tensionData.length || !svgRef.current) return

    const container = svgRef.current.parentElement
    const W = container.clientWidth || 800
    const H = 220
    const margin = { top: 20, right: 20, bottom: 40, left: 45 }
    const innerW = W - margin.left - margin.right
    const innerH = H - margin.top - margin.bottom

    // Limpar
    select(svgRef.current).selectAll('*').remove()

    const svg = select(svgRef.current)
      .attr('width', W)
      .attr('height', H)

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Escalas
    const x = scaleLinear()
      .domain([0, tensionData.length - 1])
      .range([0, innerW])

    const y = scaleLinear()
      .domain([0, 100])
      .range([innerH, 0])

    // Gradiente de área
    const defs = svg.append('defs')
    const gradient = defs.append('linearGradient')
      .attr('id', 'tension-gradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0).attr('y1', 0)
      .attr('x2', 0).attr('y2', innerH)

    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#A02E6F').attr('stop-opacity', 0.4)
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#A02E6F').attr('stop-opacity', 0.02)

    // Linha de tensão suavizada
    const tensionLine = line()
      .x((d, i) => x(i))
      .y(d => y(d.score))
      .curve(curveCatmullRom.alpha(0.5))

    const tensionArea = area()
      .x((d, i) => x(i))
      .y0(innerH)
      .y1(d => y(d.score))
      .curve(curveCatmullRom.alpha(0.5))

    // Área preenchida
    g.append('path')
      .datum(tensionData)
      .attr('fill', 'url(#tension-gradient)')
      .attr('d', tensionArea)

    // Linha
    g.append('path')
      .datum(tensionData)
      .attr('fill', 'none')
      .attr('stroke', '#A02E6F')
      .attr('stroke-width', 2.5)
      .attr('d', tensionLine)

    // Linha de referência 50%
    g.append('line')
      .attr('x1', 0).attr('y1', y(50))
      .attr('x2', innerW).attr('y2', y(50))
      .attr('stroke', 'var(--border-subtle)')
      .attr('stroke-dasharray', '4,4')

    // Pontos interactivos
    g.selectAll('.dot')
      .data(tensionData)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', (d, i) => x(i))
      .attr('cy', d => y(d.score))
      .attr('r', 5)
      .attr('fill', d => SCENE_TYPE_COLORS[d.type] || '#6E6E78')
      .attr('stroke', 'var(--bg-base)')
      .attr('stroke-width', 1.5)
      .style('cursor', 'pointer')
      .on('mouseenter', (event, d) => setHovered(d))
      .on('mouseleave', () => setHovered(null))

    // Eixo Y
    g.append('g')
      .call(axisLeft(y).ticks(4).tickFormat(d => `${d}%`))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('text').style('fill', 'var(--text-muted)').style('font-size', '11px'))
      .call(g => g.selectAll('line').style('stroke', 'var(--border-subtle)'))

    // Labels do eixo X (cenas âncora)
    const anchors = tensionData.filter(d => d.type === 'âncora')
    g.selectAll('.anchor-label')
      .data(anchors)
      .enter()
      .append('text')
      .attr('x', d => x(tensionData.indexOf(d)))
      .attr('y', innerH + 24)
      .attr('text-anchor', 'middle')
      .style('fill', '#A02E6F')
      .style('font-size', '10px')
      .style('font-weight', '700')
      .text(d => d.sceneId)

  }, [tensionData])

  if (!script?.scenes?.length) {
    return (
      <div className={styles.empty}>
        <p>Carrega um guião para ver o mapa de tensão</p>
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h3 className={styles.title}>Mapa de Tensão Dramática</h3>
        <p className={styles.subtitle}>{tensionData.length} cenas · intensidade 0–100</p>
      </div>

      {/* Tooltip */}
      {hovered && (
        <div className={styles.tooltip}>
          <span className={styles.tooltipScene}>{hovered.sceneId}</span>
          <span className={styles.tooltipScore}>{hovered.score}%</span>
          <span className={styles.tooltipType}>{hovered.type}</span>
        </div>
      )}

      {/* D3 chart */}
      <div className={styles.chartWrapper}>
        <svg ref={svgRef} style={{ width: '100%' }} />
      </div>

      {/* Legenda */}
      <div className={styles.legend}>
        {Object.entries(SCENE_TYPE_COLORS).map(([type, color]) => (
          <div key={type} className={styles.legendItem}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
            <span>{type}</span>
          </div>
        ))}
      </div>

      {/* Alertas automáticos */}
      <div className={styles.alerts}>
        {detectTensionIssues(tensionData).map((issue, i) => (
          <div key={i} className={styles.alert}>
            <span>{issue.icon}</span>
            <span>{issue.message}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Detectar problemas de ritmo
function detectTensionIssues(data) {
  const issues = []
  if (!data.length) return issues

  // Sufocamento: 3+ cenas acima de 80
  let highStreak = 0
  data.forEach((d, i) => {
    if (d.score >= 80) highStreak++
    else highStreak = 0
    if (highStreak === 3) {
      issues.push({ icon: '⚠️', message: `Sufocamento detectado: ${3} cenas de alta tensão consecutivas a partir de ${data[i-2]?.sceneId}` })
      highStreak = 0
    }
  })

  // Vazio: 3+ cenas abaixo de 30
  let lowStreak = 0
  data.forEach((d, i) => {
    if (d.score <= 30) lowStreak++
    else lowStreak = 0
    if (lowStreak === 3) {
      issues.push({ icon: '💤', message: `Vazio dramático: ${3} cenas de baixa tensão consecutivas a partir de ${data[i-2]?.sceneId}` })
      lowStreak = 0
    }
  })

  // Início e fim
  const avg = data.reduce((s, d) => s + d.score, 0) / data.length
  if (data[data.length - 1]?.score < 60) {
    issues.push({ icon: '📉', message: 'Final com tensão baixa — considera reforçar a cena de fecho' })
  }

  return issues
}
