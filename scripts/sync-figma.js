#!/usr/bin/env node
// FrameFlow — Figma Sync
// Converte exports do Figma (API + plugins) em tokens CSS e referências
// Uso: npm run sync:figma [--validate] [--styles-only] [--components-only]
//
// Input:  ARTIFACTS/figma/FF##/ (tokens/, components/, styles/, variables/, css/, api/)
// Output: src/styles/figma-tokens.css, src/styles/figma-components.css

import { existsSync, readFileSync, writeFileSync, readdirSync, mkdirSync } from 'fs'
import { resolve, dirname, extname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const EXPORTS = resolve(ROOT, '../ARTIFACTS/figma')
const STYLES_OUT = resolve(ROOT, 'src/styles')

const args = process.argv.slice(2)
const VALIDATE_ONLY = args.includes('--validate')
const STYLES_ONLY = args.includes('--styles-only')
const COMPONENTS_ONLY = args.includes('--components-only')

// ── Cores ──
const g = s => `\x1b[32m${s}\x1b[0m`
const r = s => `\x1b[31m${s}\x1b[0m`
const y = s => `\x1b[33m${s}\x1b[0m`
const b = s => `\x1b[36m${s}\x1b[0m`
const dim = s => `\x1b[2m${s}\x1b[0m`

console.log('')
console.log(g('  FrameFlow') + ' — Figma Sync' + (VALIDATE_ONLY ? ' (validate)' : ''))
console.log(dim('  ─'.repeat(20)))
console.log('')

// ── 1. Encontrar FF mais recente ──
let ffDir = null
if (existsSync(EXPORTS)) {
  const dirs = readdirSync(EXPORTS, { withFileTypes: true })
    .filter(d => d.isDirectory() && /^FF\d+$/i.test(d.name))
    .map(d => ({ name: d.name, num: parseInt(d.name.replace(/\D/g, '')) }))
    .sort((a, b) => b.num - a.num)
  if (dirs.length) ffDir = resolve(EXPORTS, dirs[0].name)
}

if (!ffDir) {
  console.log(`  ${r('✗')} Nenhuma pasta FF## encontrada em ${EXPORTS}`)
  console.log(`  Corre ${g('npm run figma:setup')} primeiro`)
  process.exit(1)
}

console.log(`  📁 Source: ${b(ffDir)}`)
console.log('')

// ── 2. Inventariar ficheiros ──
function listFiles(dir, ...exts) {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter(f => exts.some(ext => f.endsWith(ext)))
    .map(f => resolve(dir, f))
}

// Extrair blocos ```css ... ``` de ficheiros markdown
function extractCssFromMd(filePath) {
  const content = readFileSync(filePath, 'utf-8')
  const blocks = []
  const regex = /```css\s*\n([\s\S]*?)```/g
  let match
  while ((match = regex.exec(content)) !== null) {
    const css = match[1].trim()
    if (css.length > 10) blocks.push(css)
  }
  return blocks
}

// Extrair texto plain de RTF (básico — remove control words)
function extractTextFromRtf(filePath) {
  const raw = readFileSync(filePath, 'utf-8')
  return raw
    .replace(/\\[a-z]+\d*\s?/g, '')  // remove \keyword
    .replace(/[{}]/g, '')             // remove braces
    .replace(/\\['][0-9a-f]{2}/g, '') // remove hex escapes
    .replace(/\r\n/g, '\n')
    .trim()
}

const sources = {
  tokens: listFiles(resolve(ffDir, 'tokens'), '.json'),
  components: listFiles(resolve(ffDir, 'components'), '.json'),
  styles: listFiles(resolve(ffDir, 'styles'), '.json', '.md', '.rtf', '.css'),
  variables: listFiles(resolve(ffDir, 'variables'), '.json'),
  css: listFiles(resolve(ffDir, 'css'), '.css', '.md'),
  api: listFiles(resolve(ffDir, 'api'), '.json'),
  biblia: listFiles(resolve(ffDir, 'biblia'), '.md'),
}

// ── Count CSS blocks in markdown files ──
let mdCssBlocks = 0
for (const cat of ['styles', 'css', 'biblia']) {
  for (const f of sources[cat]) {
    if (f.endsWith('.md')) mdCssBlocks += extractCssFromMd(f).length
  }
}

// ── 3. Validação ──
let total = 0
for (const [cat, files] of Object.entries(sources)) {
  const extra = cat === 'biblia' ? ` (${mdCssBlocks} blocos CSS)` : ''
  const icon = files.length ? g('✓') : dim('·')
  console.log(`  ${icon} ${cat}: ${files.length} ficheiro(s)${extra}`)
  total += files.length
}
console.log('')

if (total === 0) {
  console.log(`  ${y('!')} Nenhum export encontrado`)
  console.log(`  Exporta do Figma ou corre ${g('npm run figma:api')}`)
  process.exit(0)
}

if (VALIDATE_ONLY) {
  console.log(`  ${g('✓')} Validação completa — ${total} ficheiro(s) encontrado(s)`)
  console.log('')
  process.exit(0)
}

// ── 4. Garantir pasta output ──
mkdirSync(STYLES_OUT, { recursive: true })

// ── 5. Converter Tokens → CSS Variables ──
function convertTokens() {
  const lines = ['/* FrameFlow Figma Tokens — auto-generated */\n:root {']

  for (const file of sources.tokens) {
    const data = JSON.parse(readFileSync(file, 'utf-8'))

    // Tokens Studio format: { colors: {...}, typography: {...}, ... }
    if (data.colors) {
      lines.push('\n  /* Colors */')
      for (const [key, val] of Object.entries(data.colors)) {
        const name = key.replace(/[^a-zA-Z0-9-]/g, '-').replace(/--+/g, '-').toLowerCase()
        const value = typeof val === 'string' ? val : val.value || val
        lines.push(`  --ff-${name}: ${value};`)
      }
    }

    if (data.typography) {
      lines.push('\n  /* Typography */')
      for (const [key, val] of Object.entries(data.typography)) {
        const name = key.replace(/[^a-zA-Z0-9-]/g, '-').replace(/--+/g, '-').toLowerCase()
        if (val.fontFamily) lines.push(`  --ff-font-${name}-family: '${val.fontFamily}';`)
        if (val.fontSize) lines.push(`  --ff-font-${name}-size: ${val.fontSize};`)
        if (val.fontWeight) lines.push(`  --ff-font-${name}-weight: ${convertWeight(val.fontWeight)};`)
        if (val.lineHeight) lines.push(`  --ff-font-${name}-height: ${val.lineHeight};`)
      }
    }

    if (data.spacing) {
      lines.push('\n  /* Spacing */')
      for (const [key, val] of Object.entries(data.spacing)) {
        const name = key.replace(/[^a-zA-Z0-9-]/g, '-').replace(/--+/g, '-').toLowerCase()
        lines.push(`  --ff-space-${name}: ${val};`)
      }
    }

    if (data.effects) {
      lines.push('\n  /* Effects */')
      for (const [key, val] of Object.entries(data.effects)) {
        const name = key.replace(/[^a-zA-Z0-9-]/g, '-').replace(/--+/g, '-').toLowerCase()
        const value = typeof val === 'string' ? val : val.value || val
        lines.push(`  --ff-effect-${name}: ${value};`)
      }
    }

    if (data.radii) {
      lines.push('\n  /* Border Radius */')
      for (const [key, val] of Object.entries(data.radii)) {
        const name = key.replace(/[^a-zA-Z0-9-]/g, '-').replace(/--+/g, '-').toLowerCase()
        lines.push(`  --ff-radius-${name}: ${val};`)
      }
    }
  }

  lines.push('}')
  return lines.join('\n')
}

function convertWeight(w) {
  const map = { 'Thin': 100, 'Extra Light': 200, 'Light': 300, 'Regular': 400, 'Medium': 500, 'Semi Bold': 600, 'Bold': 700, 'Extra Bold': 800, 'Black': 900 }
  return map[w] || parseInt(w) || 400
}

// ── 6. Converter API Styles → CSS Variables ──
function convertApiStyles() {
  const lines = []

  for (const file of sources.api) {
    const data = JSON.parse(readFileSync(file, 'utf-8'))

    // api-styles.json format: { meta: { styles: [...] } }
    if (data.meta?.styles) {
      lines.push('\n  /* API Styles */')
      for (const style of Object.values(data.meta.styles)) {
        const name = (style.name || '').replace(/[^a-zA-Z0-9-]/g, '-').replace(/--+/g, '-').toLowerCase()
        if (name) lines.push(`  /* ${style.style_type}: ${name} — ${style.description || ''} */`)
      }
    }
  }

  return lines.join('\n')
}

// ── 7. Converter Variables → CSS (com modes) ──
function convertVariables() {
  const lines = []

  for (const file of sources.variables) {
    const data = JSON.parse(readFileSync(file, 'utf-8'))

    // Variables Export format: { collections: [{ name, modes, variables }] }
    if (data.collections) {
      for (const col of data.collections) {
        lines.push(`\n  /* Collection: ${col.name} */`)
        for (const v of (col.variables || [])) {
          const name = v.name.replace(/[^a-zA-Z0-9-]/g, '-').replace(/--+/g, '-').toLowerCase()
          if (v.values) {
            // First mode as default
            const firstMode = Object.keys(v.values)[0]
            if (firstMode && v.values[firstMode]) {
              const val = v.values[firstMode]
              if (v.type === 'COLOR') lines.push(`  --ff-var-${name}: ${val};`)
              else lines.push(`  --ff-var-${name}: ${val};`)
            }
          }
        }
      }
    }

    // Figma API format: { variables: {...}, variableCollections: {...} }
    if (data.meta?.variables) {
      lines.push('\n  /* API Variables */')
      for (const v of Object.values(data.meta.variables)) {
        const name = v.name.replace(/[^a-zA-Z0-9-/]/g, '-').replace(/--+/g, '-').replace(/\//g, '-').toLowerCase()
        lines.push(`  /* var: ${name} (${v.resolvedType}) */`)
      }
    }
  }

  return lines.join('\n')
}

// ── 8. Extrair CSS de styles/ (JSON, MD, RTF) ──
function extractStylesCss() {
  const parts = []
  for (const file of sources.styles) {
    const name = file.split('/').pop()
    if (name === 'README.md') continue

    if (file.endsWith('.css')) {
      parts.push(`/* === ${name} === */`)
      parts.push(readFileSync(file, 'utf-8'))
    } else if (file.endsWith('.md')) {
      const blocks = extractCssFromMd(file)
      if (blocks.length) {
        parts.push(`/* === ${name} (${blocks.length} blocos) === */`)
        blocks.forEach((bl, i) => parts.push(`/* block ${i + 1} */\n${bl}`))
      }
    } else if (file.endsWith('.rtf')) {
      const text = extractTextFromRtf(file)
      // Tentar encontrar blocos CSS no texto extraído
      const cssRegex = /([.#:][a-zA-Z][\w-]*\s*\{[^}]+\}|:root\s*\{[\s\S]*?\})/g
      const matches = text.match(cssRegex)
      if (matches?.length) {
        parts.push(`/* === ${name} (RTF, ${matches.length} regras) === */`)
        parts.push(matches.join('\n\n'))
      }
    } else if (file.endsWith('.json')) {
      // JSON styles → já processado pelo convertTokens
    }
  }
  return parts.join('\n\n')
}

// ── 9. Combinar CSS exports (css/ folder + md blocks) ──
function combineCss() {
  const parts = ['/* FrameFlow Figma Components CSS — auto-generated */\n']

  // Ficheiros .css directos
  for (const file of sources.css) {
    const name = file.split('/').pop()
    if (name === 'README.md') continue

    if (file.endsWith('.css')) {
      parts.push(`/* === ${name} === */`)
      parts.push(readFileSync(file, 'utf-8'))
    } else if (file.endsWith('.md')) {
      const blocks = extractCssFromMd(file)
      if (blocks.length) {
        parts.push(`/* === ${name} (${blocks.length} blocos) === */`)
        blocks.forEach((bl, i) => parts.push(`/* block ${i + 1} */\n${bl}`))
      }
    }
    parts.push('')
  }

  // CSS extraído dos .md da biblia
  for (const file of sources.biblia) {
    const name = file.split('/').pop()
    const blocks = extractCssFromMd(file)
    if (blocks.length) {
      parts.push(`/* === biblia/${name} (${blocks.length} blocos) === */`)
      blocks.forEach((bl, i) => parts.push(`/* block ${i + 1} */\n${bl}`))
      parts.push('')
    }
  }

  return parts.join('\n')
}

// ── 9. Executar ──
let generated = 0

if (!COMPONENTS_ONLY) {
  // Gerar figma-tokens.css
  const tokenParts = []

  if (sources.tokens.length) {
    const css = convertTokens()
    tokenParts.push(css)
    console.log(`  ${g('✓')} Tokens convertidos`)
  }

  if (sources.api.length) {
    const apiCss = convertApiStyles()
    if (apiCss.trim()) tokenParts.push(apiCss)

    const varCss = convertVariables()
    if (varCss.trim()) {
      // Append to :root block
      const last = tokenParts[tokenParts.length - 1]
      if (last?.includes(':root {')) {
        tokenParts[tokenParts.length - 1] = last.replace(/\}$/, varCss + '\n}')
      }
    }
    console.log(`  ${g('✓')} API data processado`)
  }

  if (sources.variables.length) {
    const varCss = convertVariables()
    if (varCss.trim()) tokenParts.push(varCss)
    console.log(`  ${g('✓')} Variables convertidas`)
  }

  // Styles extraídos de MD/RTF
  if (sources.styles.length) {
    const stylesCss = extractStylesCss()
    if (stylesCss.trim()) tokenParts.push('\n' + stylesCss)
    const mdCount = sources.styles.filter(f => f.endsWith('.md') && !f.endsWith('README.md')).length
    const rtfCount = sources.styles.filter(f => f.endsWith('.rtf')).length
    if (mdCount) console.log(`  ${g('✓')} ${mdCount} markdown(s) processados (styles/)`)
    if (rtfCount) console.log(`  ${g('✓')} ${rtfCount} RTF(s) processados (styles/)`)
  }

  if (tokenParts.length) {
    const out = resolve(STYLES_OUT, 'figma-tokens.css')
    writeFileSync(out, tokenParts.join('\n\n'))
    console.log(`  ${g('→')} ${b(out)}`)
    generated++
  }
}

if (!STYLES_ONLY) {
  // Gerar figma-components.css (css/ + biblia/ blocos CSS)
  const hasCssSources = sources.css.length || mdCssBlocks > 0
  if (hasCssSources) {
    const css = combineCss()
    const out = resolve(STYLES_OUT, 'figma-components.css')
    writeFileSync(out, css)
    if (mdCssBlocks) console.log(`  ${g('✓')} ${mdCssBlocks} blocos CSS extraídos de markdowns`)
    console.log(`  ${g('✓')} CSS combinado`)
    console.log(`  ${g('→')} ${b(out)}`)
    generated++
  }

  // Listar componentes JSON (referência)
  if (sources.components.length) {
    console.log(`  ${g('✓')} ${sources.components.length} componente(s) JSON disponíveis`)
    for (const f of sources.components) {
      console.log(`    ${dim('·')} ${f.split('/').pop()}`)
    }
  }
}

// ── 10. Resumo ──
console.log('')
console.log(dim('  ─'.repeat(20)))
console.log('')
if (generated > 0) {
  console.log(`  ${g('✓')} Sync completo! ${generated} ficheiro(s) gerado(s)`)
} else {
  console.log(`  ${y('!')} Nenhum ficheiro gerado`)
  console.log(`  Exporta dados do Figma ou corre ${g('npm run figma:api')}`)
}
console.log('')
