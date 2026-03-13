#!/usr/bin/env node
// FrameFlow — Figma API Fetch
// Puxa dados do Figma via REST API e guarda em ARTIFACTS/figma/FF##/api/
// Uso: npm run figma:api

import { existsSync, writeFileSync, readFileSync, readdirSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const EXPORTS = resolve(ROOT, '../ARTIFACTS/figma')

// ── Cores ──
const g = s => `\x1b[32m${s}\x1b[0m`
const r = s => `\x1b[31m${s}\x1b[0m`
const y = s => `\x1b[33m${s}\x1b[0m`
const b = s => `\x1b[36m${s}\x1b[0m`
const dim = s => `\x1b[2m${s}\x1b[0m`

console.log('')
console.log(g('  FrameFlow') + ' — Figma API')
console.log(dim('  ─'.repeat(20)))
console.log('')

// ── 1. Ler token do .env ──
function loadEnv() {
  const envPath = resolve(ROOT, '.env')
  if (!existsSync(envPath)) return {}
  const vars = {}
  readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) vars[m[1].trim()] = m[2].trim()
  })
  return vars
}

const env = loadEnv()
const TOKEN = env.FIGMA_TOKEN || process.env.FIGMA_TOKEN
const FILE_KEY = env.FIGMA_FILE_KEY || process.env.FIGMA_FILE_KEY || 'WrdFyAqikmxBr1MyJk8kVt'

if (!TOKEN || TOKEN === 'figd_teu_token_aqui') {
  console.log(`  ${r('✗')} FIGMA_TOKEN não configurado`)
  console.log(`  Corre ${g('npm run figma:setup')} primeiro`)
  console.log('')
  process.exit(1)
}

console.log(`  ${g('✓')} Token: ${dim(TOKEN.slice(0, 8) + '...' + TOKEN.slice(-4))}`)
console.log(`  ${g('✓')} File Key: ${b(FILE_KEY)}`)
console.log('')

// ── 2. Detectar pasta FF mais recente ──
let ffDir
if (existsSync(EXPORTS)) {
  const dirs = readdirSync(EXPORTS, { withFileTypes: true })
    .filter(d => d.isDirectory() && /^FF\d+$/i.test(d.name))
    .map(d => ({ name: d.name, num: parseInt(d.name.replace(/\D/g, '')) }))
    .sort((a, b) => b.num - a.num)
  if (dirs.length) ffDir = resolve(EXPORTS, dirs[0].name)
}

if (!ffDir) {
  ffDir = resolve(EXPORTS, 'FF01')
  mkdirSync(ffDir, { recursive: true })
}

const apiDir = resolve(ffDir, 'api')
mkdirSync(apiDir, { recursive: true })

console.log(`  📁 Output: ${b(apiDir)}`)
console.log('')

// ── 3. Fetch endpoints ──
const BASE = 'https://api.figma.com/v1'
const headers = { 'X-Figma-Token': TOKEN }

const endpoints = [
  { path: `/files/${FILE_KEY}?depth=1`, file: 'api-file.json', label: 'Ficheiro (depth=1)' },
  { path: `/files/${FILE_KEY}/styles`, file: 'api-styles.json', label: 'Estilos' },
  { path: `/files/${FILE_KEY}/components`, file: 'api-components.json', label: 'Componentes' },
  { path: `/files/${FILE_KEY}/variables/local`, file: 'api-variables.json', label: 'Variables' },
  { path: `/files/${FILE_KEY}?depth=3`, file: 'api-tree.json', label: 'Árvore (depth=3)' },
]

let ok = 0
let fail = 0

for (const ep of endpoints) {
  process.stdout.write(`  ⏳ ${ep.label}...`)
  try {
    const res = await fetch(BASE + ep.path, { headers })
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      if (res.status === 403 && ep.file === 'api-variables.json') {
        console.log(` ${y('⚠ Requer Professional+')}`)
      } else {
        console.log(` ${r('✗')} ${res.status} ${res.statusText}`)
        fail++
      }
      continue
    }
    const data = await res.json()
    const out = resolve(apiDir, ep.file)
    writeFileSync(out, JSON.stringify(data, null, 2))
    const size = (JSON.stringify(data).length / 1024).toFixed(0)
    console.log(` ${g('✓')} ${size}KB`)
    ok++
  } catch (err) {
    console.log(` ${r('✗')} ${err.message}`)
    fail++
  }
}

// ── 4. Resumo ──
console.log('')
console.log(dim('  ─'.repeat(20)))
console.log('')
if (ok > 0) {
  console.log(`  ${g('✓')} ${ok} ficheiro(s) descarregado(s) → ${b(apiDir)}`)
  if (fail) console.log(`  ${y('!')} ${fail} falharam`)
  console.log('')
  console.log(`  Próximo: ${g('npm run sync:figma')}`)
} else {
  console.log(`  ${r('✗')} Nenhum ficheiro descarregado`)
  console.log(`  Verifica o token e tenta novamente`)
}
console.log('')
