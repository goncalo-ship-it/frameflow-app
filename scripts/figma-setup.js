#!/usr/bin/env node
// FrameFlow — Figma Setup
// Cria estrutura de pastas para exports e verifica .env
// Uso: npm run figma:setup

import { mkdirSync, existsSync, readFileSync, appendFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const EXPORTS = resolve(ROOT, '../ARTIFACTS/figma')

const FILE_KEY = 'WrdFyAqikmxBr1MyJk8kVt'

// ── Cores para terminal ──
const g = s => `\x1b[32m${s}\x1b[0m`
const y = s => `\x1b[33m${s}\x1b[0m`
const b = s => `\x1b[36m${s}\x1b[0m`
const dim = s => `\x1b[2m${s}\x1b[0m`

console.log('')
console.log(g('  FrameFlow') + ' — Figma Setup')
console.log(dim('  ─'.repeat(20)))
console.log('')

// ── 1. Detectar pasta FF mais recente ──
let latestFF = null
if (existsSync(EXPORTS)) {
  const { readdirSync } = await import('fs')
  const dirs = readdirSync(EXPORTS, { withFileTypes: true })
    .filter(d => d.isDirectory() && /^FF\d+$/i.test(d.name))
    .map(d => ({ name: d.name, num: parseInt(d.name.replace(/\D/g, '')) }))
    .sort((a, b) => b.num - a.num)
  if (dirs.length) latestFF = dirs[0].name
}

const FF_DIR = latestFF
  ? resolve(EXPORTS, latestFF)
  : resolve(EXPORTS, 'FF01')

console.log(`  📁 Pasta: ${b(FF_DIR)}`)
if (latestFF) console.log(`  ${g('✓')} Detectado: ${g(latestFF)}`)
console.log('')

// ── 2. Criar pastas ──
const folders = [
  'tokens',
  'components',
  'styles',
  'variables',
  'css',
  'api',
  'biblia',
]

let created = 0
for (const f of folders) {
  const p = resolve(FF_DIR, f)
  if (!existsSync(p)) {
    mkdirSync(p, { recursive: true })
    console.log(`  ${g('+')} ${f}/`)
    created++
  } else {
    console.log(`  ${dim('·')} ${f}/ ${dim('(existe)')}`)
  }
}
console.log('')
if (created) console.log(`  ${g('✓')} ${created} pasta(s) criada(s)`)
else console.log(`  ${dim('  Todas as pastas já existem')}`)

// ── 3. Verificar .env ──
console.log('')
const envPath = resolve(ROOT, '.env')
const envExamplePath = resolve(ROOT, '.env.example')
let hasToken = false

if (existsSync(envPath)) {
  const env = readFileSync(envPath, 'utf-8')
  hasToken = env.includes('FIGMA_TOKEN=') && !env.includes('FIGMA_TOKEN=figd_teu_token_aqui')

  if (!env.includes('FIGMA_TOKEN')) {
    appendFileSync(envPath, '\n# Figma API\nFIGMA_TOKEN=figd_teu_token_aqui\nFIGMA_FILE_KEY=' + FILE_KEY + '\n')
    console.log(`  ${g('+')} FIGMA_TOKEN adicionado ao .env`)
  } else if (hasToken) {
    console.log(`  ${g('✓')} FIGMA_TOKEN configurado`)
  } else {
    console.log(`  ${y('!')} FIGMA_TOKEN existe mas precisa do valor real`)
  }
} else {
  writeFileSync(envPath, [
    '# Firebase',
    'VITE_FIREBASE_API_KEY=',
    'VITE_FIREBASE_AUTH_DOMAIN=',
    'VITE_FIREBASE_PROJECT_ID=',
    'VITE_FIREBASE_STORAGE_BUCKET=',
    'VITE_FIREBASE_MESSAGING_SENDER_ID=',
    'VITE_FIREBASE_APP_ID=',
    '',
    '# Figma API',
    'FIGMA_TOKEN=figd_teu_token_aqui',
    'FIGMA_FILE_KEY=' + FILE_KEY,
    ''
  ].join('\n'))
  console.log(`  ${g('+')} .env criado`)
}

// ── 4. Criar .env.example ──
if (!existsSync(envExamplePath)) {
  writeFileSync(envExamplePath, [
    '# Firebase',
    'VITE_FIREBASE_API_KEY=',
    'VITE_FIREBASE_AUTH_DOMAIN=',
    'VITE_FIREBASE_PROJECT_ID=',
    'VITE_FIREBASE_STORAGE_BUCKET=',
    'VITE_FIREBASE_MESSAGING_SENDER_ID=',
    'VITE_FIREBASE_APP_ID=',
    '',
    '# Figma API (https://www.figma.com/developers/api)',
    'FIGMA_TOKEN=figd_teu_token_aqui',
    'FIGMA_FILE_KEY=' + FILE_KEY,
    ''
  ].join('\n'))
  console.log(`  ${g('+')} .env.example criado`)
}

// ── 5. Resumo ──
console.log('')
console.log(dim('  ─'.repeat(20)))
console.log('')
console.log(`  ${g('File Key')}: ${b(FILE_KEY)}`)
console.log(`  ${g('URL')}: https://www.figma.com/file/${FILE_KEY}/FrameFlow`)
console.log('')

if (!hasToken) {
  console.log(`  ${y('Próximo passo:')}`)
  console.log(`  1. Vai a ${b('Figma → Settings → Personal Access Tokens')}`)
  console.log(`  2. Gera um novo token`)
  console.log(`  3. Edita ${b('.env')} e cola o token em FIGMA_TOKEN=`)
  console.log(`  4. Corre ${g('npm run figma:api')}`)
} else {
  console.log(`  ${g('Tudo pronto!')} Corre ${g('npm run figma:api')} para buscar dados.`)
}
console.log('')
