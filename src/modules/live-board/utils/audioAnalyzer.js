// audioAnalyzer.js — Análise de áudio para clap detection e cut points
// Suporta WAV/BWF (Broadcast Wave Format) com timecode embebido

/**
 * Analisa um ficheiro de áudio WAV/BWF.
 * Detecta pico de clap (transiente) e calcula cut points.
 *
 * @param {File} audioFile — ficheiro .wav ou .bwf
 * @param {object} options
 * @param {number} options.fps — framerate do vídeo (default 25)
 * @param {number} options.clapOffsetNormal — segundos após clap para planos normais (default 2.0)
 * @param {number} options.clapOffsetInsert — segundos após clap para inserts (default 1.0)
 * @param {number} options.safetyMargin — segundos antes do fim do clip (default 1.0)
 * @returns {Promise<AudioAnalysis>}
 */
export async function analyzeAudio(audioFile, options = {}) {
  const {
    fps = 25,
    clapOffsetNormal = 2.0,
    clapOffsetInsert = 1.0,
    safetyMargin = 1.0,
  } = options

  const arrayBuffer = await audioFile.arrayBuffer()

  // Parse WAV/BWF header
  const header = parseWavHeader(arrayBuffer)

  // Extract BWF timecode if present
  const bwfTC = parseBWFTimecode(arrayBuffer, header.sampleRate, fps)

  // Decode audio for analysis
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  let audioBuffer
  try {
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0))
  } finally {
    audioCtx.close()
  }

  // Get first channel (mono analysis is sufficient for clap detection)
  const channelData = audioBuffer.getChannelData(0)
  const sampleRate = audioBuffer.sampleRate
  const durationSec = audioBuffer.duration

  // Detect clap — find the strongest transient in the first 30 seconds
  // (clap is typically in the first 10-20 seconds of a take)
  const clapResult = detectClap(channelData, sampleRate, Math.min(30, durationSec))

  // Calculate cut points
  const clapTimeSec = clapResult.found ? clapResult.timeSec : null
  const clapFrame = clapTimeSec !== null ? Math.round(clapTimeSec * fps) : null

  const inPointNormal = clapTimeSec !== null ? clapTimeSec + clapOffsetNormal : 0
  const inPointInsert = clapTimeSec !== null ? clapTimeSec + clapOffsetInsert : 0
  const outPoint = Math.max(0, durationSec - safetyMargin)

  return {
    id: `audio_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    filename: audioFile.name,
    sampleRate,
    channels: audioBuffer.numberOfChannels,
    durationSec: Math.round(durationSec * 100) / 100,
    durationDisplay: formatDuration(durationSec),
    timecodeStart: bwfTC.timecodeStr || null,
    timecodeStartFrames: bwfTC.startFrames || 0,
    timecodeStartSec: bwfTC.startSec || 0,

    // BWF metadata (Sound Devices MixPre, Zoom, etc.)
    scene: bwfTC.scene || null,
    take: bwfTC.take || null,
    circled: bwfTC.circled || false,
    originator: bwfTC.originator || null,
    recordDate: bwfTC.date || null,
    recordTime: bwfTC.time || null,
    tracks: bwfTC.tracks || [],

    clap: {
      found: clapResult.found,
      timeSec: clapTimeSec,
      timeDisplay: clapTimeSec !== null ? formatDuration(clapTimeSec) : null,
      frame: clapFrame,
      confidence: clapResult.confidence,
      amplitude: clapResult.amplitude,
    },

    cutPoints: {
      inNormal: Math.round(inPointNormal * 100) / 100,
      inInsert: Math.round(inPointInsert * 100) / 100,
      out: Math.round(outPoint * 100) / 100,
      inNormalFrame: Math.round(inPointNormal * fps),
      inInsertFrame: Math.round(inPointInsert * fps),
      outFrame: Math.round(outPoint * fps),
    },

    // For matching with video clips
    linkedClipIds: [],
  }
}

/**
 * Detecta o pico de clap (slate) no áudio.
 * Procura o transiente mais forte nos primeiros N segundos.
 *
 * Método: sliding window RMS → detecta salto abrupto (ratio > threshold).
 * O clap é um impulso muito curto (< 50ms) com amplitude muito acima do ruído de fundo.
 */
function detectClap(channelData, sampleRate, searchDurationSec) {
  const searchSamples = Math.min(channelData.length, Math.floor(searchDurationSec * sampleRate))

  // Window sizes
  const windowSize = Math.floor(sampleRate * 0.005) // 5ms window
  const bgWindowSize = Math.floor(sampleRate * 0.5)  // 500ms for background level

  // Calculate RMS in small windows
  const numWindows = Math.floor(searchSamples / windowSize)
  const rmsValues = new Float32Array(numWindows)

  for (let i = 0; i < numWindows; i++) {
    const start = i * windowSize
    let sumSq = 0
    for (let j = start; j < start + windowSize && j < searchSamples; j++) {
      sumSq += channelData[j] * channelData[j]
    }
    rmsValues[i] = Math.sqrt(sumSq / windowSize)
  }

  // Find the window with the highest ratio to its local background
  let bestIdx = -1
  let bestRatio = 0
  let bestAmplitude = 0

  const bgWindows = Math.floor(bgWindowSize / windowSize)

  for (let i = bgWindows; i < numWindows - 2; i++) {
    // Background RMS: average of windows before this point (excluding the last 100ms)
    const bgEnd = Math.max(0, i - Math.floor(sampleRate * 0.1 / windowSize))
    const bgStart = Math.max(0, bgEnd - bgWindows)
    let bgSum = 0
    let bgCount = 0
    for (let j = bgStart; j < bgEnd; j++) {
      bgSum += rmsValues[j]
      bgCount++
    }
    const bgRms = bgCount > 0 ? bgSum / bgCount : 0.001

    // Current peak: max of this window and next 2
    const peakRms = Math.max(rmsValues[i], rmsValues[i + 1] || 0, rmsValues[i + 2] || 0)

    const ratio = peakRms / Math.max(bgRms, 0.0001)

    if (ratio > bestRatio && peakRms > 0.05) { // minimum absolute amplitude
      bestRatio = ratio
      bestIdx = i
      bestAmplitude = peakRms
    }
  }

  // Threshold: a clap should be at least 8x louder than background
  const CLAP_THRESHOLD = 8

  if (bestIdx >= 0 && bestRatio >= CLAP_THRESHOLD) {
    const timeSec = (bestIdx * windowSize) / sampleRate

    // Refine: find exact peak sample near this window
    const searchStart = Math.max(0, bestIdx * windowSize - windowSize)
    const searchEnd = Math.min(channelData.length, (bestIdx + 3) * windowSize)
    let maxAbs = 0
    let maxSample = searchStart
    for (let i = searchStart; i < searchEnd; i++) {
      const abs = Math.abs(channelData[i])
      if (abs > maxAbs) {
        maxAbs = abs
        maxSample = i
      }
    }

    const refinedTime = maxSample / sampleRate

    // Confidence based on ratio
    const confidence = Math.min(1, (bestRatio - CLAP_THRESHOLD) / (CLAP_THRESHOLD * 3))

    return {
      found: true,
      timeSec: Math.round(refinedTime * 1000) / 1000,
      confidence: Math.round(confidence * 100) / 100,
      amplitude: Math.round(maxAbs * 1000) / 1000,
      ratio: Math.round(bestRatio * 10) / 10,
    }
  }

  return { found: false, timeSec: null, confidence: 0, amplitude: 0, ratio: 0 }
}

/**
 * Read a 4-char chunk ID from DataView.
 */
function readChunkId(view, offset) {
  return String.fromCharCode(view.getUint8(offset), view.getUint8(offset + 1), view.getUint8(offset + 2), view.getUint8(offset + 3))
}

/**
 * Iterate WAV/BWF chunks. Calls callback(chunkId, chunkStart, chunkSize) for each.
 */
function iterateChunks(arrayBuffer, callback) {
  const view = new DataView(arrayBuffer)
  const len = arrayBuffer.byteLength
  if (len < 12) return
  const riff = readChunkId(view, 0)
  if (riff !== 'RIFF') return

  let offset = 12
  while (offset < len - 8) {
    const chunkId = readChunkId(view, offset)
    const chunkSize = view.getUint32(offset + 4, true)
    callback(chunkId, offset + 8, chunkSize)
    offset += 8 + chunkSize + (chunkSize % 2)
  }
}

/**
 * Parse WAV header — finds fmt chunk regardless of position.
 * BWF files (MixPre, Zoom, etc.) have bext/iXML before fmt.
 */
function parseWavHeader(arrayBuffer) {
  const view = new DataView(arrayBuffer)
  const result = { sampleRate: 48000, channels: 2, bitsPerSample: 24 }

  iterateChunks(arrayBuffer, (id, start, size) => {
    if (id === 'fmt ' && start + 16 <= arrayBuffer.byteLength) {
      result.sampleRate = view.getUint32(start + 4, true)
      result.channels = view.getUint16(start + 2, true)
      result.bitsPerSample = view.getUint16(start + 14, true)
    }
  })

  return result
}

/**
 * Parse BWF metadata from bext chunk.
 * Extracts: timecode, scene, take, circled, originator, date/time, track names.
 */
function parseBWFTimecode(arrayBuffer, sampleRate, fps = 25) {
  const view = new DataView(arrayBuffer)
  const len = arrayBuffer.byteLength
  const result = { startSec: 0, startFrames: 0, timecodeStr: null, scene: null, take: null, circled: false, originator: null, date: null, time: null, tracks: [] }

  iterateChunks(arrayBuffer, (id, start, size) => {
    if (id === 'bext' && start + 346 <= len) {
      // Description (256 bytes) — contains sSCENE, sTAKE, sCIRCLED, sTRK*
      const descBytes = new Uint8Array(arrayBuffer, start, Math.min(256, size))
      const desc = new TextDecoder('ascii').decode(descBytes).replace(/\0+$/, '')

      for (const line of desc.split(/\r?\n/)) {
        if (line.startsWith('sSCENE=')) result.scene = line.slice(7)
        if (line.startsWith('sTAKE=')) result.take = line.slice(6)
        if (line.startsWith('sCIRCLED=TRUE')) result.circled = true
        if (line.startsWith('sTRK')) result.tracks.push(line)
      }

      // Originator (32 bytes at offset 256)
      const origBytes = new Uint8Array(arrayBuffer, start + 256, 32)
      result.originator = new TextDecoder('ascii').decode(origBytes).replace(/\0+$/, '')

      // Date (10 bytes at 320), Time (8 bytes at 330)
      const dateBytes = new Uint8Array(arrayBuffer, start + 320, 10)
      result.date = new TextDecoder('ascii').decode(dateBytes).replace(/\0+$/, '')
      const timeBytes = new Uint8Array(arrayBuffer, start + 330, 8)
      result.time = new TextDecoder('ascii').decode(timeBytes).replace(/\0+$/, '')

      // TimeReference (64-bit LE at offset 338)
      const timeRefLow = view.getUint32(start + 338, true)
      const timeRefHigh = view.getUint32(start + 342, true)
      const timeReference = timeRefHigh * 0x100000000 + timeRefLow

      if (timeReference > 0 && sampleRate > 0) {
        result.startSec = timeReference / sampleRate
        result.startFrames = Math.round(result.startSec * fps)

        const h = Math.floor(result.startSec / 3600)
        const m = Math.floor((result.startSec % 3600) / 60)
        const s = Math.floor(result.startSec % 60)
        const f = Math.round((result.startSec % 1) * fps)
        result.timecodeStr = [h, m, s, f].map(v => String(v).padStart(2, '0')).join(':')
      }
    }
  })

  return result
}

/**
 * Match audio tracks to video clips.
 * 3 estratégias (por ordem de prioridade):
 *   1. Timecode overlap — áudio TC cobre o clip TC
 *   2. Duration match — duração semelhante (±5s) + mesmo dia
 *   3. Chronological order — clips e áudios no mesmo dia, mesmo índice
 *
 * @param {Array} audioTracks — resultado de analyzeAudio()
 * @param {Array} cameras — cameras com clips
 * @param {number} fps
 * @returns {Array} audioTracks com linkedClipIds preenchidos
 */
export function matchAudioToClips(audioTracks, cameras, fps = 25) {
  const results = audioTracks.map(track => ({ ...track, linkedClipIds: [] }))

  // Build flat clip list with estimated TC
  const allClips = []
  for (const cam of cameras) {
    for (const clip of cam.clips) {
      allClips.push({ ...clip, camera: cam.camera })
    }
  }

  for (const track of results) {
    const audioStart = track.timecodeStartSec || 0
    const audioEnd = audioStart + track.durationSec
    const audioDate = track.recordDate || null

    for (const clip of allClips) {
      let matched = false

      // Strategy 1: Timecode overlap (if both have TC)
      if (audioStart > 0 && clip.timecodeStartSec) {
        const clipStart = clip.timecodeStartSec
        const clipEnd = clipStart + clip.durationSec
        // Audio should overlap or contain the video clip
        if (audioStart <= clipEnd + 2 && audioEnd >= clipStart - 2) {
          matched = true
        }
      }

      // Strategy 2: Duration match + same day
      if (!matched && clip.durationSec > 0) {
        const durDiff = Math.abs(clip.durationSec - track.durationSec)
        const sameDay = !audioDate || !clip.createdAt || clip.createdAt === audioDate
        if (durDiff < 5 && sameDay) {
          matched = true
        }
      }

      // Strategy 3: Scene name match (BWF scene vs clip scene assignment)
      // The BWF scene (e.g., "ROAST-C1") won't directly match sceneKeys (e.g., "EP01-SC003")
      // but if clip has been manually linked to a scene, and audio scene matches the
      // clip filename pattern, we can match
      if (!matched && track.scene && clip.filename) {
        // Check if the audio scene appears in the clip filename
        // e.g., audio scene "ROAST-C1" and clip "ROAST-C1-001.WAV"
        if (clip.filename?.toLowerCase().includes(track.scene?.toLowerCase())) {
          matched = true
        }
      }

      if (matched && !track.linkedClipIds.includes(clip.id)) {
        track.linkedClipIds.push(clip.id)
      }
    }
  }

  return results
}

/**
 * Aplica cut points de áudio aos clips de vídeo linkados.
 * Também guarda audioTrackId para sync no export.
 * @param {Array} audioTracks — com clap detection
 * @param {object} clipMeta — current clip metadata
 * @returns {object} updated clipMeta with inPoint/outPoint + audioTrackId
 */
export function applyCutPointsToClips(audioTracks, clipMeta) {
  const updated = { ...clipMeta }

  for (const track of audioTracks) {
    for (const clipId of (track.linkedClipIds || [])) {
      const existing = updated[clipId] || {}
      const patch = {
        ...existing,
        audioTrackId: track.id,
        audioFilename: track.filename,
        audioTimecodeStart: track.timecodeStart,
        audioScene: track.scene,
        audioTake: track.take,
      }

      // Cut points only if clap was found
      if (track.clap?.found) {
        patch.inPoint = track.cutPoints.inNormal
        patch.outPoint = track.cutPoints.out
        patch.inPointInsert = track.cutPoints.inInsert
        patch.clapFrame = track.clap.frame
        patch.clapTimeSec = track.clap.timeSec
      }

      updated[clipId] = patch
    }
  }

  return updated
}

function formatDuration(sec) {
  if (!sec || sec < 0) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  const ms = Math.floor((sec % 1) * 100)
  return `${m}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}`
}
