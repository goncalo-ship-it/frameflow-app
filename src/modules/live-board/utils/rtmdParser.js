// rtmdParser.js — Extrai Real-Time Metadata (RTMD) de ficheiros MP4 Sony XAVC
// Baseado em EBU Tech 3349, SMPTE RDD 18, e xavc_rtmd2srt tag map
// Pure JS — zero dependências, browser-safe

// ── RTMD Tag Map (Sony XAVC) ────────────────────────────────────────
// Cada tag é TLV (Tag 2 bytes, Length 2 bytes, Value N bytes)
const RTMD_TAGS = {
  // Camera unit
  0x8000: { name: 'irisF',           parse: parseUDFloat },       // F-number (iris)
  0x8001: { name: 'focusDistance',    parse: parseFocusDistance },  // mm
  0x8002: { name: 'focusRingPos',    parse: parseUint16 },
  0x8003: { name: 'focalLength',     parse: parseUDFloat },        // mm (actual)
  0x8004: { name: 'focalLength35mm', parse: parseUDFloat },        // mm (35mm equivalent)
  0x8005: { name: 'irisRingPos',     parse: parseUint16 },
  0x8006: { name: 'zoomRingPos',     parse: parseUint16 },
  0x8007: { name: 'ndFilter',        parse: parseByteName },       // ND filter position
  0x8008: { name: 'irisT',           parse: parseUDFloat },        // T-number
  0x800A: { name: 'opticalExtender', parse: parseUDFloat },        // magnification
  0x800B: { name: 'lensSerialNo',    parse: parseUTF8 },

  // Camera control
  0x8100: { name: 'autoExposureMode',parse: parseAutoExposure },
  0x8101: { name: 'autoFocusMode',   parse: parseUTF8 },
  0x8102: { name: 'afSensingArea',   parse: parseAfArea },
  0x8103: { name: 'shutterSpeedAngle',parse: parseUDFloat },       // degrees
  0x8104: { name: 'shutterSpeedTime', parse: parseShutterTime },   // 1/x seconds
  0x8106: { name: 'iso',             parse: parseUint16 },         // ISO (renamed from cameraMasterGainAdjustment)
  0x8107: { name: 'electricalExtender',parse: parseUDFloat },
  0x8109: { name: 'whiteBalance',    parse: parseUint16 },         // Kelvin
  0x810A: { name: 'masterBlackLevel',parse: parseInt16 },
  0x810B: { name: 'masterBlackRed',  parse: parseInt16 },
  0x810C: { name: 'masterBlackBlue', parse: parseInt16 },
  0x810D: { name: 'kneePoint',       parse: parseUDFloat },
  0x810E: { name: 'kneeSlope',       parse: parseUDFloat },
  0x8110: { name: 'luminanceDynRange',parse: parseUint16 },
  0x8112: { name: 'deviceRecordingMode', parse: parseUTF8 },
  0x8114: { name: 'monitoringDescription', parse: parseUTF8 },
  0x8115: { name: 'focusMode',       parse: parseUTF8 },
  0x8118: { name: 'captureGammaEquation', parse: parseGamma },

  // Color science (SMPTE labels)
  0x3210: { name: 'captureFps',      parse: parseRational },
  0x3219: { name: 'colorPrimaries',  parse: parseUL },
  0x321A: { name: 'codingEquations', parse: parseUL },

  // GPS
  0x8500: { name: 'gpsLatRef',       parse: parseChar },           // N or S
  0x8501: { name: 'gpsLat',          parse: parseGPSCoord },
  0x8502: { name: 'gpsLonRef',       parse: parseChar },           // E or W
  0x8503: { name: 'gpsLon',          parse: parseGPSCoord },
  0x8504: { name: 'gpsAltRef',       parse: parseByte },           // 0=above sea, 1=below
  0x8505: { name: 'gpsAlt',          parse: parseUDFloat },        // metres
  0x8506: { name: 'gpsTimeStamp',    parse: parseGPSTime },
  0x8507: { name: 'gpsSatellites',   parse: parseUTF8 },
  0x8508: { name: 'gpsStatus',       parse: parseChar },           // A=active, V=void
  0x850C: { name: 'gpsSpeedRef',     parse: parseChar },           // K=km/h, M=mph, N=knots
  0x850D: { name: 'gpsSpeed',        parse: parseUDFloat },
  0x850E: { name: 'gpsCourseRef',    parse: parseChar },           // T=true, M=magnetic
  0x850F: { name: 'gpsCourse',       parse: parseUDFloat },        // degrees
  0x8510: { name: 'gpsDate',         parse: parseUTF8 },           // DDMMYY
  0x851D: { name: 'gpsMapDatum',     parse: parseUTF8 },           // e.g. WGS-84

  // Sensor data (gyro, accel, stabilisation)
  0xE43B: { name: 'gyroX',           parse: parseFloat32 },
  0xE43C: { name: 'gyroY',           parse: parseFloat32 },
  0xE43D: { name: 'gyroZ',           parse: parseFloat32 },
  0xE43E: { name: 'accelX',          parse: parseFloat32 },
  0xE43F: { name: 'accelY',          parse: parseFloat32 },
  0xE440: { name: 'accelZ',          parse: parseFloat32 },
  0xE441: { name: 'ossX',            parse: parseFloat32 },        // optical stabilisation shift
  0xE442: { name: 'ossY',            parse: parseFloat32 },
}

// ── Auto Exposure Mode labels (SMPTE RP222 / EBU 3349) ─────────────
const AE_MODES = {
  0: 'Manual',
  1: 'Full Auto',
  2: 'Gain Priority',
  3: 'Iris Priority',
  4: 'Shutter Priority',
}

// ── Gamma Equations ─────────────────────────────────────────────────
const GAMMA_MAP = {
  'SL3': 'S-Log3',
  'SL2': 'S-Log2',
  'SLOG': 'S-Log',
  'HLG': 'HLG (HDR)',
  'CIN1': 'Cine1',
  'CIN2': 'Cine2',
  'CIN3': 'Cine3',
  'CIN4': 'Cine4',
  'STD': 'Standard',
  'ITU709': 'ITU-R BT.709',
  '709': 'Rec.709',
}

// ── Value Parsers ───────────────────────────────────────────────────

function parseUDFloat(dv, offset, len) {
  // Unsigned double float stored as 16.16 fixed point or IEEE float
  if (len === 4) return dv.getFloat32(offset, false)
  if (len === 2) return dv.getUint16(offset, false) / 100
  if (len === 8) return dv.getFloat64(offset, false)
  return dv.getUint16(offset, false)
}

function parseFocusDistance(dv, offset, len) {
  // Focus distance in mm, stored as uint16 or float
  if (len === 4) {
    const val = dv.getFloat32(offset, false)
    return val > 10000 ? Infinity : Math.round(val) // mm
  }
  if (len === 2) {
    const val = dv.getUint16(offset, false)
    return val === 0xFFFF ? Infinity : val // mm
  }
  return null
}

function parseUint16(dv, offset) {
  return dv.getUint16(offset, false)
}

function parseInt16(dv, offset) {
  return dv.getInt16(offset, false)
}

function parseFloat32(dv, offset) {
  return dv.getFloat32(offset, false)
}

function parseByte(dv, offset) {
  return dv.getUint8(offset)
}

function parseByteName(dv, offset) {
  return `ND${dv.getUint8(offset)}`
}

function parseChar(dv, offset) {
  return String.fromCharCode(dv.getUint8(offset))
}

function parseUTF8(dv, offset, len) {
  const bytes = new Uint8Array(dv.buffer, offset, len)
  // Strip trailing zeros
  let end = len
  while (end > 0 && bytes[end - 1] === 0) end--
  return new TextDecoder().decode(bytes.subarray(0, end))
}

function parseUL(dv, offset, len) {
  // SMPTE Universal Label — 16 bytes, return as hex
  const bytes = new Uint8Array(dv.buffer, offset, Math.min(len, 16))
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('.')
}

function parseAutoExposure(dv, offset) {
  const mode = dv.getUint8(offset)
  return AE_MODES[mode] || `Mode ${mode}`
}

function parseAfArea(dv, offset, len) {
  if (len >= 4) {
    return { x: dv.getUint16(offset, false), y: dv.getUint16(offset + 2, false) }
  }
  return { x: 0, y: 0 }
}

function parseShutterTime(dv, offset, len) {
  // Rational: numerator / denominator
  if (len >= 8) {
    const num = dv.getInt32(offset, false)
    const den = dv.getInt32(offset + 4, false)
    return den !== 0 ? `1/${Math.round(den / num)}` : '?'
  }
  if (len === 4) {
    const val = dv.getUint32(offset, false)
    return `1/${val}`
  }
  return null
}

function parseRational(dv, offset, len) {
  if (len >= 8) {
    const num = dv.getInt32(offset, false)
    const den = dv.getInt32(offset + 4, false)
    return den !== 0 ? num / den : 0
  }
  return null
}

function parseGamma(dv, offset, len) {
  const raw = parseUTF8(dv, offset, len).trim()
  return GAMMA_MAP[raw] || raw
}

function parseGPSCoord(dv, offset, len) {
  // GPS coordinates as 3 rationals (degrees, minutes, seconds)
  if (len >= 24) {
    const degD = dv.getInt32(offset + 4, false)
    const minD = dv.getInt32(offset + 12, false)
    const secD = dv.getInt32(offset + 20, false)
    const deg = degD !== 0 ? dv.getInt32(offset, false) / degD : 0
    const min = minD !== 0 ? dv.getInt32(offset + 8, false) / minD : 0
    const sec = secD !== 0 ? dv.getInt32(offset + 16, false) / secD : 0
    return deg + min / 60 + sec / 3600
  }
  if (len >= 4) return dv.getFloat32(offset, false)
  return 0
}

function parseGPSTime(dv, offset, len) {
  if (len >= 24) {
    const h = Math.floor(dv.getInt32(offset, false) / Math.max(1, dv.getInt32(offset + 4, false)))
    const m = Math.floor(dv.getInt32(offset + 8, false) / Math.max(1, dv.getInt32(offset + 12, false)))
    const s = Math.floor(dv.getInt32(offset + 16, false) / Math.max(1, dv.getInt32(offset + 20, false)))
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return null
}


// ── MP4 Box Parser ──────────────────────────────────────────────────
// Minimal ISO-BMFF parser — only reads moov/trak/mdia/minf/stbl boxes
// to locate the RTMD metadata track

/**
 * Encontra o offset e tamanho de cada box num ArrayBuffer.
 * @param {ArrayBuffer} buffer
 * @param {number} start
 * @param {number} end
 * @returns {Array<{ type: string, offset: number, size: number, dataOffset: number }>}
 */
function findBoxes(buffer, start, end) {
  const dv = new DataView(buffer)
  const boxes = []
  let pos = start

  while (pos < end - 8) {
    let size = dv.getUint32(pos, false)
    const type = String.fromCharCode(
      dv.getUint8(pos + 4), dv.getUint8(pos + 5),
      dv.getUint8(pos + 6), dv.getUint8(pos + 7)
    )

    let headerSize = 8
    if (size === 1 && pos + 16 <= end) {
      // 64-bit extended size
      const hi = dv.getUint32(pos + 8, false)
      const lo = dv.getUint32(pos + 12, false)
      size = hi * 0x100000000 + lo
      headerSize = 16
    }

    if (size < 8 || pos + size > end + 1) break

    boxes.push({ type, offset: pos, size, dataOffset: pos + headerSize })
    pos += size
  }

  return boxes
}

/**
 * Encontra um box por tipo dentro de um parent.
 */
function findBox(buffer, type, start, end) {
  return findBoxes(buffer, start, end).find(b => b.type === type)
}

/**
 * Encontra todos os boxes de um tipo.
 */
function findAllBoxes(buffer, type, start, end) {
  return findBoxes(buffer, start, end).filter(b => b.type === type)
}

// Container boxes que contêm sub-boxes
const CONTAINER_TYPES = new Set(['moov', 'trak', 'mdia', 'minf', 'stbl', 'udta', 'edts'])

/**
 * Encontra o track handler type (hdlr box → handler type string).
 * RTMD tracks use 'meta' or 'tmcd' handler, but Sony uses 'rtmd' or 'meta'.
 */
function getTrackHandlerType(buffer, trakStart, trakEnd) {
  const mdia = findBox(buffer, 'mdia', trakStart, trakEnd)
  if (!mdia) return null
  const hdlr = findBox(buffer, 'hdlr', mdia.dataOffset, mdia.offset + mdia.size)
  if (!hdlr) return null

  const dv = new DataView(buffer)
  // hdlr box: version(4) + pre_defined(4) + handler_type(4)
  const handlerOffset = hdlr.dataOffset + 8
  if (handlerOffset + 4 > buffer.byteLength) return null

  return String.fromCharCode(
    dv.getUint8(handlerOffset), dv.getUint8(handlerOffset + 1),
    dv.getUint8(handlerOffset + 2), dv.getUint8(handlerOffset + 3)
  )
}

/**
 * Lê sample table (stbl) para obter offsets e tamanhos de cada sample.
 * Necessário para localizar os blocos RTMD no ficheiro.
 */
function readSampleTable(buffer, stblStart, stblEnd) {
  const dv = new DataView(buffer)

  // stco/co64 — sample chunk offsets
  const stco = findBox(buffer, 'stco', stblStart, stblEnd)
  const co64 = findBox(buffer, 'co64', stblStart, stblEnd)
  const chunkOffsets = []

  const bufLen = buffer.byteLength

  if (co64) {
    const count = dv.getUint32(co64.dataOffset + 4, false)
    for (let i = 0; i < count; i++) {
      const readEnd = co64.dataOffset + 12 + i * 8 + 4
      if (readEnd > bufLen) break
      const hi = dv.getUint32(co64.dataOffset + 8 + i * 8, false)
      const lo = dv.getUint32(co64.dataOffset + 12 + i * 8, false)
      chunkOffsets.push(hi * 0x100000000 + lo)
    }
  } else if (stco) {
    const count = dv.getUint32(stco.dataOffset + 4, false)
    for (let i = 0; i < count; i++) {
      const readEnd = stco.dataOffset + 8 + i * 4 + 4
      if (readEnd > bufLen) break
      chunkOffsets.push(dv.getUint32(stco.dataOffset + 8 + i * 4, false))
    }
  }

  // stsz — sample sizes
  const stsz = findBox(buffer, 'stsz', stblStart, stblEnd)
  const sampleSizes = []
  if (stsz) {
    const defaultSize = dv.getUint32(stsz.dataOffset + 4, false)
    const count = dv.getUint32(stsz.dataOffset + 8, false)
    for (let i = 0; i < count; i++) {
      if (!defaultSize) {
        const readEnd = stsz.dataOffset + 12 + i * 4 + 4
        if (readEnd > bufLen) break
      }
      sampleSizes.push(defaultSize || dv.getUint32(stsz.dataOffset + 12 + i * 4, false))
    }
  }

  // stsc — sample-to-chunk mapping
  const stsc = findBox(buffer, 'stsc', stblStart, stblEnd)
  const stscEntries = []
  if (stsc) {
    const count = dv.getUint32(stsc.dataOffset + 4, false)
    for (let i = 0; i < count; i++) {
      const base = stsc.dataOffset + 8 + i * 12
      if (base + 12 > bufLen) break
      stscEntries.push({
        firstChunk: dv.getUint32(base, false),
        samplesPerChunk: dv.getUint32(base + 4, false),
        descIndex: dv.getUint32(base + 8, false),
      })
    }
  }

  // Build sample → offset mapping
  const samples = []
  let sampleIdx = 0

  for (let chunkIdx = 0; chunkIdx < chunkOffsets.length && sampleIdx < sampleSizes.length; chunkIdx++) {
    // Find how many samples in this chunk
    let samplesInChunk = 1
    for (let e = stscEntries.length - 1; e >= 0; e--) {
      if (chunkIdx + 1 >= stscEntries[e].firstChunk) {
        samplesInChunk = stscEntries[e].samplesPerChunk
        break
      }
    }

    let offsetInChunk = 0
    for (let s = 0; s < samplesInChunk && sampleIdx < sampleSizes.length; s++) {
      samples.push({
        offset: chunkOffsets[chunkIdx] + offsetInChunk,
        size: sampleSizes[sampleIdx],
      })
      offsetInChunk += sampleSizes[sampleIdx]
      sampleIdx++
    }
  }

  return samples
}

/**
 * Parseia um bloco RTMD (um sample) e devolve metadata estruturado.
 * Formato TLV: Tag(2) + Length(2) + Value(N)
 */
function parseRTMDSample(buffer, offset, size) {
  const dv = new DataView(buffer)
  const result = {}
  let pos = offset
  const end = offset + size

  while (pos + 4 <= end) {
    const tag = dv.getUint16(pos, false)
    const len = dv.getUint16(pos + 2, false)
    pos += 4

    if (pos + len > end) break

    const def = RTMD_TAGS[tag]
    if (def) {
      try {
        result[def.name] = def.parse(dv, pos, len)
      } catch {
        // Skip malformed tag
      }
    }

    pos += len
  }

  return result
}


// ── PUBLIC API ──────────────────────────────────────────────────────

/**
 * Extrai metadata RTMD de um ficheiro MP4 Sony XAVC.
 * @param {File|ArrayBuffer} input — ficheiro MP4 ou ArrayBuffer
 * @returns {Promise<RTMDResult>}
 *
 * RTMDResult: {
 *   found: boolean,
 *   frameCount: number,
 *   fps: number,
 *   frames: RTMDFrame[],     // metadata per frame (pode ser grande!)
 *   summary: RTMDSummary,    // resumo agregado (mais útil para UI)
 * }
 *
 * RTMDSummary: {
 *   irisF: { min, max, mode },
 *   irisT: { min, max, mode },
 *   iso: { min, max, mode },
 *   focalLength: { min, max, mode },
 *   focalLength35mm: { min, max, mode },
 *   shutterSpeedAngle: number,
 *   shutterSpeedTime: string,
 *   whiteBalance: number,
 *   autoExposureMode: string,
 *   captureGammaEquation: string,
 *   focusDistance: { min, max },
 *   gps: { lat, lon, alt } | null,
 *   ndFilter: string,
 *   lensSerialNo: string,
 * }
 */
export async function extractRTMD(input) {
  let buffer
  if (input instanceof ArrayBuffer) {
    buffer = input
  } else if (input instanceof File || input instanceof Blob) {
    buffer = await input.arrayBuffer()
  } else {
    throw new Error('extractRTMD: input deve ser File, Blob ou ArrayBuffer')
  }

  const result = { found: false, frameCount: 0, fps: 0, frames: [], summary: null }

  // Find moov box
  const topBoxes = findBoxes(buffer, 0, buffer.byteLength)
  const moov = topBoxes.find(b => b.type === 'moov')
  if (!moov) return result

  // Find all tracks
  const traks = findAllBoxes(buffer, 'trak', moov.dataOffset, moov.offset + moov.size)

  // Find the RTMD track (handler type 'meta' or contains rtmd-style samples)
  let rtmdTrack = null
  for (const trak of traks) {
    const handler = getTrackHandlerType(buffer, trak.dataOffset, trak.offset + trak.size)
    if (handler === 'meta' || handler === 'rtmd') {
      rtmdTrack = trak
      break
    }
  }

  if (!rtmdTrack) {
    // Fallback: try to find a track with small samples that parse as RTMD
    for (const trak of traks) {
      const handler = getTrackHandlerType(buffer, trak.dataOffset, trak.offset + trak.size)
      if (handler === 'vide' || handler === 'soun') continue // skip video/audio
      // Try this track
      rtmdTrack = trak
      break
    }
  }

  if (!rtmdTrack) return result

  // Get sample table
  const mdia = findBox(buffer, 'mdia', rtmdTrack.dataOffset, rtmdTrack.offset + rtmdTrack.size)
  if (!mdia) return result

  // Get timescale from mdhd
  const mdhd = findBox(buffer, 'mdhd', mdia.dataOffset, mdia.offset + mdia.size)
  let timescale = 25
  if (mdhd) {
    const dv = new DataView(buffer)
    const version = dv.getUint8(mdhd.dataOffset)
    if (version === 0) {
      timescale = dv.getUint32(mdhd.dataOffset + 12, false)
    } else {
      timescale = dv.getUint32(mdhd.dataOffset + 20, false)
    }
  }

  const minf = findBox(buffer, 'minf', mdia.dataOffset, mdia.offset + mdia.size)
  if (!minf) return result

  const stbl = findBox(buffer, 'stbl', minf.dataOffset, minf.offset + minf.size)
  if (!stbl) return result

  // Get stts for frame duration → fps
  const stts = findBox(buffer, 'stts', stbl.dataOffset, stbl.offset + stbl.size)
  let frameDuration = 1
  if (stts) {
    const dv = new DataView(buffer)
    const entryCount = dv.getUint32(stts.dataOffset + 4, false)
    if (entryCount > 0) {
      frameDuration = dv.getUint32(stts.dataOffset + 12, false)
    }
  }
  const fps = timescale / frameDuration

  const samples = readSampleTable(buffer, stbl.dataOffset, stbl.offset + stbl.size)

  if (samples.length === 0) return result

  // Parse each RTMD sample
  const frames = []
  for (const sample of samples) {
    if (sample.offset + sample.size > buffer.byteLength) continue
    const frame = parseRTMDSample(buffer, sample.offset, sample.size)
    if (Object.keys(frame).length > 0) {
      frames.push(frame)
    }
  }

  if (frames.length === 0) return result

  // Build summary
  result.found = true
  result.frameCount = frames.length
  result.fps = Math.round(fps * 100) / 100
  result.frames = frames
  result.summary = buildSummary(frames)

  return result
}

/**
 * Versão leve: só extrai o primeiro sample RTMD (para thumbnail preview).
 */
export async function extractRTMDPreview(input) {
  const full = await extractRTMD(input)
  if (!full.found) return full
  // Return only summary + first frame, discard per-frame data
  return {
    found: true,
    frameCount: full.frameCount,
    fps: full.fps,
    frames: full.frames.length > 0 ? [full.frames[0]] : [],
    summary: full.summary,
  }
}


// ── Summary Builder ─────────────────────────────────────────────────

function buildSummary(frames) {
  const summary = {}

  // Numeric fields: compute min/max/mode
  for (const field of ['irisF', 'irisT', 'iso', 'focalLength', 'focalLength35mm']) {
    const vals = frames.map(f => f[field]).filter(v => v != null && isFinite(v))
    if (vals.length > 0) {
      summary[field] = {
        min: Math.min(...vals),
        max: Math.max(...vals),
        mode: mode(vals),
      }
    }
  }

  // Focus distance
  const focusVals = frames.map(f => f.focusDistance).filter(v => v != null && isFinite(v))
  if (focusVals.length > 0) {
    summary.focusDistance = {
      min: Math.min(...focusVals),
      max: Math.max(...focusVals),
    }
  }

  // String fields: take most common
  for (const field of ['autoExposureMode', 'captureGammaEquation', 'shutterSpeedTime', 'ndFilter', 'lensSerialNo', 'focusMode']) {
    const vals = frames.map(f => f[field]).filter(Boolean)
    if (vals.length > 0) summary[field] = mode(vals)
  }

  // Single-value numeric fields
  for (const field of ['shutterSpeedAngle', 'whiteBalance']) {
    const vals = frames.map(f => f[field]).filter(v => v != null)
    if (vals.length > 0) summary[field] = mode(vals)
  }

  // GPS: take first valid reading
  const gpsFrame = frames.find(f => f.gpsLat != null && f.gpsLon != null)
  if (gpsFrame) {
    let lat = gpsFrame.gpsLat
    let lon = gpsFrame.gpsLon
    if (gpsFrame.gpsLatRef === 'S') lat = -lat
    if (gpsFrame.gpsLonRef === 'W') lon = -lon
    summary.gps = {
      lat: Math.round(lat * 1000000) / 1000000,
      lon: Math.round(lon * 1000000) / 1000000,
      alt: gpsFrame.gpsAlt,
      speed: gpsFrame.gpsSpeed,
    }
  }

  return summary
}

function mode(arr) {
  const counts = {}
  let maxCount = 0
  let result = arr[0]
  for (const v of arr) {
    const key = typeof v === 'number' ? Math.round(v * 100) / 100 : v
    counts[key] = (counts[key] || 0) + 1
    if (counts[key] > maxCount) {
      maxCount = counts[key]
      result = v
    }
  }
  return result
}


// ── Format Helpers (for UI display) ─────────────────────────────────

/**
 * Formata um resumo RTMD para display human-readable.
 * @param {RTMDSummary} s
 * @returns {Array<{ label: string, value: string, icon: string }>}
 */
export function formatRTMDSummary(s) {
  if (!s || typeof s !== 'object') return []
  const items = []

  const fmtRange = (obj, prefix, suffix = '') => {
    if (!obj || obj.min == null) return null
    const { min, max, mode: m } = obj
    const v = m ?? min
    return min === max ? `${prefix}${v.toFixed(1)}${suffix}` : `${prefix}${min.toFixed(1)}–${max.toFixed(1)}${suffix}`
  }

  if (s.irisT) {
    const val = fmtRange(s.irisT, 'T')
    if (val) items.push({ label: 'T-Stop', value: val, icon: 'aperture' })
  } else if (s.irisF) {
    const val = fmtRange(s.irisF, 'f/')
    if (val) items.push({ label: 'Iris', value: val, icon: 'aperture' })
  }

  if (s.focalLength && s.focalLength.min != null) {
    const { min, max, mode: m } = s.focalLength
    const v = m ?? min
    const val = min === max ? `${Math.round(v)}mm` : `${Math.round(min)}–${Math.round(max)}mm`
    const eq35 = s.focalLength35mm?.mode != null ? ` (${Math.round(s.focalLength35mm.mode)}mm eq)` : ''
    items.push({ label: 'Focal', value: val + eq35, icon: 'zoom' })
  }

  if (s.iso && s.iso.min != null) {
    const { min, max, mode: m } = s.iso
    const v = m ?? min
    items.push({
      label: 'ISO',
      value: min === max ? `${v}` : `${min}–${max}`,
      icon: 'iso',
    })
  }

  if (s.shutterSpeedAngle) {
    items.push({ label: 'Shutter', value: `${s.shutterSpeedAngle}°`, icon: 'shutter' })
  } else if (s.shutterSpeedTime) {
    items.push({ label: 'Shutter', value: s.shutterSpeedTime, icon: 'shutter' })
  }

  if (s.whiteBalance) {
    items.push({ label: 'WB', value: `${s.whiteBalance}K`, icon: 'wb' })
  }

  if (s.autoExposureMode) {
    items.push({ label: 'Exposure', value: s.autoExposureMode, icon: 'ae' })
  }

  if (s.captureGammaEquation) {
    items.push({ label: 'Gamma', value: s.captureGammaEquation, icon: 'gamma' })
  }

  if (s.focusDistance && s.focusDistance.min != null) {
    const { min, max } = s.focusDistance
    const fmt = (v) => v > 5000 ? '∞' : v >= 1000 ? `${(v / 1000).toFixed(1)}m` : `${Math.round(v)}mm`
    items.push({
      label: 'Focus',
      value: min === max ? fmt(min) : `${fmt(min)}–${fmt(max)}`,
      icon: 'focus',
    })
  }

  if (s.ndFilter && s.ndFilter !== 'ND0') {
    items.push({ label: 'ND', value: s.ndFilter, icon: 'nd' })
  }

  if (s.gps && s.gps.lat != null && s.gps.lon != null) {
    items.push({
      label: 'GPS',
      value: `${s.gps.lat.toFixed(4)}, ${s.gps.lon.toFixed(4)}${s.gps.alt ? ` · ${Math.round(s.gps.alt)}m` : ''}`,
      icon: 'gps',
    })
  }

  if (s.lensSerialNo) {
    items.push({ label: 'Lens S/N', value: s.lensSerialNo, icon: 'lens' })
  }

  return items
}

/**
 * Gera um SRT subtitle track a partir de frames RTMD.
 * Útil para overlay em NLEs ou previews.
 * @param {RTMDFrame[]} frames
 * @param {number} fps
 * @returns {string} SRT content
 */
export function rtmdToSRT(frames, fps) {
  if (!frames || frames.length === 0) return ''
  if (!fps || fps <= 0) fps = 25 // safe fallback

  return frames.map((frame, i) => {
    const startSec = i / fps
    const endSec = (i + 1) / fps
    const start = formatSRTTime(startSec)
    const end = formatSRTTime(endSec)

    const parts = []
    if (frame.irisT) parts.push(`T${frame.irisT.toFixed(1)}`)
    else if (frame.irisF) parts.push(`f/${frame.irisF.toFixed(1)}`)
    if (frame.focalLength) parts.push(`${Math.round(frame.focalLength)}mm`)
    if (frame.iso) parts.push(`ISO${frame.iso}`)
    if (frame.shutterSpeedAngle) parts.push(`${frame.shutterSpeedAngle}°`)
    else if (frame.shutterSpeedTime) parts.push(frame.shutterSpeedTime)
    if (frame.whiteBalance) parts.push(`${frame.whiteBalance}K`)
    if (frame.focusDistance != null && isFinite(frame.focusDistance)) {
      parts.push(`Focus:${frame.focusDistance >= 1000 ? (frame.focusDistance / 1000).toFixed(1) + 'm' : frame.focusDistance + 'mm'}`)
    }

    return `${i + 1}\n${start} --> ${end}\n${parts.join(' | ')}\n`
  }).join('\n')
}

function formatSRTTime(sec) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  const ms = Math.round((sec % 1) * 1000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`
}
