// Parser de Folha de Serviço Excel → team[], locations[], catering, call times
// Lê callsheets tradicionais (ex: Folha Servico_SKIP_v4.xlsx)

import { getXLSX } from '../core/xlsx-loader.js'
import { nanoid } from '../modules/budget/utils/moneyUtils.js'

/**
 * Parsa um ArrayBuffer de Folha de Serviço Excel
 * Devolve: { crew[], locations[], schedule, catering, date, campaign }
 */
export async function parseCallsheetExcel(arrayBuffer, filename = '') {
  const XLSX = await getXLSX()
  const wb = XLSX.read(arrayBuffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

  const result = {
    crew: [],
    locations: [],
    schedule: [],
    catering: null,
    callTimes: {},
    date: null,
    campaign: '',
  }

  let section = 'header' // header | crew | calltimes | schedule | locations

  // Known role patterns (col B = role, col D = name)
  const ROLE_PATTERNS = [
    'PRODUÇÃO EXECUTIVA', 'REALIZADOR', 'DIRECTOR', 'CHEFE', 'ASS.',
    'ELECTRICISTA', 'SOM', 'GUARDA ROUPA', 'MAKEUP', 'FOTÓGRAFO',
    'PRODUTOR', 'CAMERAMAN', 'DIT', 'ANOTADOR', 'FIGURANT',
    'MAQUINISTA', 'GRIP', 'GAFFER', 'STEADICAM', 'DRONE',
  ]

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const cells = row.map(c => String(c).trim())
    const joined = cells.join(' ').toUpperCase()

    // ── Campaign name ──
    if (/CAMPANHA/i.test(joined) && !result.campaign) {
      const campCell = cells.find(c => c && !/CAMPANHA/i.test(c))
      if (campCell) result.campaign = campCell.trim()
    }

    // ── Date ──
    if (!result.date) {
      // Look for date patterns: DD.MM.YYYY, DD/MM/YYYY, or day-of-week + date
      for (const cell of cells) {
        const dateMatch = cell.match(/(\d{1,2})[./](\d{1,2})[./](\d{4})/)
        if (dateMatch) {
          result.date = `${dateMatch[3]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[1].padStart(2, '0')}`
          break
        }
      }
    }

    // ── Crew section (role + name pairs) ──
    if (cells[1] && ROLE_PATTERNS.some(p => cells[1].toUpperCase().includes(p))) {
      const role = cells[1]
      const name = cells[3] || ''
      if (name && name.length > 2 && !/^[\d.]+$/.test(name)) {
        result.crew.push({
          id: nanoid(),
          name: name,
          role: role,
          group: guessGroup(role),
          phone: '',
          email: '',
        })
      }
    }

    // ── Catering ──
    if (/CATERING|ALMO[CÇ]O/i.test(joined)) {
      // Look for time in surrounding rows
      let time = ''
      let location = ''
      for (let j = Math.max(0, i - 1); j <= Math.min(rows.length - 1, i + 2); j++) {
        const nearby = rows[j].map(c => String(c).trim())
        for (const cell of nearby) {
          const timeMatch = cell.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/)
          if (timeMatch && !time) time = `${timeMatch[1]} - ${timeMatch[2]}`
          // Excel time serial (0.5 = 12:00)
          const serial = parseFloat(cell)
          if (!isNaN(serial) && serial > 0.3 && serial < 0.9 && !time) {
            const h = Math.floor(serial * 24)
            const m = Math.round((serial * 24 - h) * 60)
            time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
          }
          // Location for catering
          if (/maps\.app\.goo\.gl|Cafetaria|Restaurante|Cantina/i.test(cell) && !location) {
            location = cell
          }
        }
      }
      if (!result.catering) {
        result.catering = { time, location, provider: '' }
      }
    }

    // ── Call times (department → time) ──
    if (/NO\s+LOCAL\s+PRONTO/i.test(joined) || /PRONTO.*TRAB/i.test(joined)) {
      // Next row has department headers, row after has times
      if (i + 2 < rows.length) {
        const deptRow = rows[i + 1].map(c => String(c).trim())
        const timeRow = rows[i + 2].map(c => String(c).trim())
        for (let j = 0; j < deptRow.length; j++) {
          const dept = deptRow[j]
          if (!dept) continue
          const timeVal = timeRow[j]
          if (!timeVal) continue
          const serial = parseFloat(timeVal)
          if (!isNaN(serial) && serial > 0.2 && serial < 0.9) {
            const h = Math.floor(serial * 24)
            const m = Math.round((serial * 24 - h) * 60)
            result.callTimes[dept.toUpperCase()] = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
          } else if (/\d{1,2}:\d{2}/.test(timeVal)) {
            result.callTimes[dept.toUpperCase()] = timeVal.match(/(\d{1,2}:\d{2})/)[1]
          }
        }
      }
    }

    // ── Locations (LOCAL + DÉCOR + MORADA pattern) ──
    if (/^LOCAL$/i.test(cells[0]?.trim()) && /D[EÉ]COR/i.test(cells[1]?.trim())) {
      // Rows after this are location entries
      for (let j = i + 1; j < rows.length; j++) {
        const locRow = rows[j].map(c => String(c).trim())
        if (/^WRAP$/i.test(locRow[0]) || locRow.every(c => !c)) break
        if (/ALMO[CÇ]O/i.test(locRow[1])) continue

        const locName = locRow[0]
        const decor = locRow[1]
        const address = locRow[3] || ''
        const mapsLink = (j + 1 < rows.length)
          ? rows[j + 1].map(c => String(c).trim()).find(c => /maps\.app\.goo\.gl|google\.com\/maps/i.test(c)) || ''
          : ''
        const description = locRow[7] || '' // DESCRIÇÃO DOS PLANOS column

        if (locName && locName.length > 2) {
          // Check if this location already exists
          const existing = result.locations.find(l => l.name === locName)
          if (!existing) {
            result.locations.push({
              id: nanoid(),
              name: locName,
              address: address.replace(/\n/g, ', '),
              mapsLink,
              decors: [decor].filter(Boolean),
              notes: description,
            })
          } else if (decor && !existing.decors.includes(decor)) {
            existing.decors.push(decor)
            if (description && !existing.notes.includes(description)) {
              existing.notes += (existing.notes ? '; ' : '') + description
            }
          }
          // Skip the maps link row
          if (mapsLink) j++
        }
      }
      break // locations are usually the last section
    }
  }

  return result
}

function guessGroup(role) {
  const r = (role || '').toUpperCase()
  if (/PRODU[CÇ][AÃ]O|CHEFE.*PRODU/i.test(r)) return 'Produção'
  if (/REALIZA[DÇ]|1.*ASS.*REALIZA/i.test(r)) return 'Realização'
  if (/FOT|IMAGEM|CÂMARA|CAMERA|DIT|STEADICAM/i.test(r)) return 'Câmara'
  if (/ELECTRI|GAFFER|GRIP|MAQUINISTA|LUZ/i.test(r)) return 'Luz'
  if (/SOM|[AÁ]UDIO/i.test(r)) return 'Som'
  if (/GUARDA.*ROUPA|FIGUR|WARDRO/i.test(r)) return 'Guarda-Roupa'
  if (/MAKEUP|MAQUIL|CABELO|HAIR/i.test(r)) return 'Maquilhagem'
  if (/ARTE|CEN[OÓ]GRAF|ADEREÇO|PROP/i.test(r)) return 'Arte'
  if (/PLATEAU|ASS.*PLAT/i.test(r)) return 'Produção'
  return 'Equipa'
}
