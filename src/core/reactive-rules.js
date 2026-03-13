// ReactiveCore Phase 1 — Regras determinísticas de propagação entre módulos
// Cada regra detecta mudanças no store e propaga via sugestão (medium) ou auto (high)

export const RULES = [
  // ── 1. Equipa → Orçamento (membro adicionado) ──────────────────
  {
    id: 'team-add→budget',
    source: 'team',
    target: 'budget',
    confidence: 'medium',
    description: 'Novo membro na equipa — verificar impacto no orçamento',
    detect: (prev, next) => {
      if (prev.team === next.team) return null
      if (next.team.length <= prev.team.length) return null
      const prevIds = new Set(prev.team.map(m => m.id))
      const added = next.team.filter(m => !prevIds.has(m.id))
      if (added.length === 0) return null
      // Só sugere se há orçamentos
      if (next.budgets.length === 0) return null
      return { members: added }
    },
    execute: () => {}, // medium → não executa, cria sugestão
    buildSuggestion: (payload) => {
      const m = payload.members[0]
      return {
        type: 'team-added',
        source: 'team',
        target: 'budget',
        sourceId: m.id,
        title: `Novo membro: ${m.name}`,
        description: `${m.name} (${m.role || m.group}) adicionado à equipa. Verificar impacto no orçamento.`,
        data: { memberId: m.id, name: m.name, role: m.role, group: m.group, cacheDiario: m.cacheDiario },
      }
    },
  },

  // ── 2. Equipa → Orçamento (membro removido) ────────────────────
  {
    id: 'team-remove→budget',
    source: 'team',
    target: 'budget',
    confidence: 'medium',
    description: 'Membro removido da equipa — ajustar orçamento',
    detect: (prev, next) => {
      if (prev.team === next.team) return null
      if (next.team.length >= prev.team.length) return null
      const nextIds = new Set(next.team.map(m => m.id))
      const removed = prev.team.filter(m => !nextIds.has(m.id))
      if (removed.length === 0) return null
      if (next.budgets.length === 0) return null
      return { members: removed }
    },
    execute: () => {},
    buildSuggestion: (payload) => {
      const m = payload.members[0]
      return {
        type: 'team-removed',
        source: 'team',
        target: 'budget',
        sourceId: m.id,
        title: `Membro removido: ${m.name}`,
        description: `${m.name} removido da equipa. Remover/ajustar linha de orçamento correspondente?`,
        data: { memberId: m.id, name: m.name },
      }
    },
  },

  // ── 3. Equipa → Orçamento (cachê alterado) ─────────────────────
  {
    id: 'team-salary→budget',
    source: 'team',
    target: 'budget',
    confidence: 'medium',
    description: 'Cachê de membro alterado — actualizar orçamento',
    detect: (prev, next) => {
      if (prev.team === next.team) return null
      if (prev.team.length !== next.team.length) return null // handled by add/remove
      if (next.budgets.length === 0) return null
      for (let i = 0; i < next.team.length; i++) {
        const p = prev.team.find(m => m.id === next.team[i].id)
        if (!p) continue
        const n = next.team[i]
        if (p.cacheDiario !== n.cacheDiario || p.cacheTotal !== n.cacheTotal) {
          return { member: n, prevCacheDiario: p.cacheDiario, prevCacheTotal: p.cacheTotal }
        }
      }
      return null
    },
    execute: () => {},
    buildSuggestion: (payload) => {
      const m = payload.member
      return {
        type: 'salary-changed',
        source: 'team',
        target: 'budget',
        sourceId: m.id,
        title: `Cachê alterado: ${m.name}`,
        description: `Cachê de ${m.name} actualizado para €${m.cacheDiario || '?'}/dia. Actualizar linha de orçamento?`,
        data: { memberId: m.id, name: m.name, cacheDiario: m.cacheDiario, cacheTotal: m.cacheTotal },
      }
    },
  },

  // ── 4. Produção → Orçamento (dia de rodagem adicionado) ────────
  {
    id: 'day-add→budget',
    source: 'production',
    target: 'budget',
    confidence: 'medium',
    description: 'Novo dia de rodagem — verificar impacto no orçamento',
    detect: (prev, next) => {
      if (prev.shootingDays === next.shootingDays) return null
      if (next.shootingDays.length <= prev.shootingDays.length) return null
      if (next.budgets.length === 0) return null
      const prevIds = new Set(prev.shootingDays.map(d => d.id))
      const added = next.shootingDays.filter(d => !prevIds.has(d.id))
      if (added.length === 0) return null
      return { days: added, totalDays: next.shootingDays.length }
    },
    execute: () => {},
    buildSuggestion: (payload) => {
      const d = payload.days[0]
      return {
        type: 'day-added',
        source: 'production',
        target: 'budget',
        sourceId: d.id,
        title: 'Novo dia de rodagem',
        description: `Dia ${payload.totalDays} adicionado (${d.date || 'sem data'}). Mais um dia pode impactar custos de equipa, locais e equipamento.`,
        data: { dayId: d.id, totalDays: payload.totalDays },
      }
    },
  },

  // ── 5. Locais → Produção (local recusado) ──────────────────────
  {
    id: 'location-refused→production',
    source: 'locations',
    target: 'production',
    confidence: 'medium',
    description: 'Local recusado — rever cenas atribuídas',
    detect: (prev, next) => {
      if (prev.locations === next.locations) return null
      for (let i = 0; i < next.locations.length; i++) {
        const n = next.locations[i]
        const p = prev.locations.find(l => l.id === n.id)
        if (p && p.status !== 'recusado' && n.status === 'recusado') {
          return { location: n }
        }
      }
      return null
    },
    execute: () => {},
    buildSuggestion: (payload) => {
      const loc = payload.location
      return {
        type: 'location-refused',
        source: 'locations',
        target: 'production',
        sourceId: loc.id,
        title: `Local recusado: ${loc.displayName || loc.name}`,
        description: `O local "${loc.displayName || loc.name}" foi recusado. Cenas atribuídas a este local precisam de alternativa.`,
        data: { locationId: loc.id, locationName: loc.displayName || loc.name },
      }
    },
  },

  // ── 6. Departamentos → Continuidade (item com fotos+cenas) ─────
  {
    id: 'dept-item→continuity',
    source: 'departments',
    target: 'continuity',
    confidence: 'medium',
    description: 'Novo item de departamento com fotos — actualizar continuidade',
    detect: (prev, next) => {
      if (prev.departmentItems === next.departmentItems) return null
      if (next.departmentItems.length <= prev.departmentItems.length) return null
      const prevIds = new Set(prev.departmentItems.map(i => i.id))
      const added = next.departmentItems.filter(i => !prevIds.has(i.id))
      const relevant = added.filter(i => (i.scenes || []).length > 0 && (i.photos || []).length > 0)
      if (relevant.length === 0) return null
      return { items: relevant }
    },
    execute: () => {},
    buildSuggestion: (payload) => {
      const item = payload.items[0]
      return {
        type: 'dept-item-for-continuity',
        source: 'departments',
        target: 'continuity',
        sourceId: item.id,
        title: `Foto de ${item.department}: ${item.name || 'sem nome'}`,
        description: `Nova foto de ${item.department} capturada para cena ${item.scenes[0]}. Adicionar à continuidade?`,
        data: { itemId: item.id, department: item.department, scenes: item.scenes, characterName: item.characterName },
      }
    },
  },

  // ── 7. Produção → Equipa (data de dia alterada) ────────────────
  {
    id: 'schedule-change→team',
    source: 'production',
    target: 'team',
    confidence: 'medium',
    description: 'Data de dia de rodagem alterada — rever dias confirmados da equipa',
    detect: (prev, next) => {
      if (prev.shootingDays === next.shootingDays) return null
      if (prev.shootingDays.length !== next.shootingDays.length) return null // handled by add
      for (let i = 0; i < next.shootingDays.length; i++) {
        const p = prev.shootingDays.find(d => d.id === next.shootingDays[i].id)
        if (!p) continue
        const n = next.shootingDays[i]
        if (p.date !== n.date && p.date && n.date) {
          return { day: n, prevDate: p.date }
        }
      }
      return null
    },
    execute: () => {},
    buildSuggestion: (payload) => ({
      type: 'schedule-date-changed',
      source: 'production',
      target: 'team',
      sourceId: payload.day.id,
      title: `Data de rodagem alterada: ${payload.prevDate} → ${payload.day.date}`,
      description: `O dia "${payload.day.label || payload.day.id}" mudou de ${payload.prevDate} para ${payload.day.date}. Rever dias confirmados da equipa.`,
      data: { dayId: payload.day.id, prevDate: payload.prevDate, newDate: payload.day.date },
    }),
  },

  // ── 8. Capture → Departamento (item de departamento via capture, alta confiança) ──
  {
    id: 'capture→department',
    source: 'capture',
    target: 'departments',
    confidence: 'high',
    description: 'Capture classificado como item de departamento — criado automaticamente',
    detect: (prev, next) => {
      if (prev.captures === next.captures) return null
      if (next.captures.length <= prev.captures.length) return null
      const prevIds = new Set(prev.captures.map(c => c.id))
      const newCaptures = next.captures.filter(c => !prevIds.has(c.id))
      const deptCaptures = newCaptures.filter(c =>
        c.interpretation?.tipo === 'department-item' &&
        (c.interpretation?.confianca || 0) >= 0.8 &&
        c.status === 'done'
      )
      if (deptCaptures.length === 0) return null
      return { captures: deptCaptures }
    },
    execute: (payload, store) => {
      // Item já foi criado pelo router — esta regra serve como audit trail
      // e para garantir que a propagação é registada
    },
  },

  // ── 9. Dept Item Criado → Continuidade (item com cena + foto) ──────
  {
    id: 'dept-item-created→continuity',
    source: 'departments',
    target: 'continuity',
    confidence: 'high',
    description: 'Item de departamento com cena e foto criado via capture — continuidade actualizada',
    detect: (prev, next) => {
      if (prev.departmentItems === next.departmentItems) return null
      if (next.departmentItems.length <= prev.departmentItems.length) return null
      const prevIds = new Set(prev.departmentItems.map(i => i.id))
      const added = next.departmentItems.filter(i => !prevIds.has(i.id))
      const fromCapture = added.filter(i =>
        i.fromCapture &&
        (i.scenes || []).length > 0 &&
        (i.photos || []).length > 0
      )
      if (fromCapture.length === 0) return null
      return { items: fromCapture }
    },
    execute: (payload, store) => {
      // Continuidade já foi criada pelo router se interpretation.continuity === true
      // Esta regra serve como audit trail automático
    },
  },

  // ── 10. Dept Item Criado → Notas de Cena (sugestão) ────────────────
  {
    id: 'dept-item-created→scene-notes',
    source: 'departments',
    target: 'production',
    confidence: 'medium',
    description: 'Novo item de departamento capturado — sugerir adicionar referência nas notas da cena',
    detect: (prev, next) => {
      if (prev.departmentItems === next.departmentItems) return null
      if (next.departmentItems.length <= prev.departmentItems.length) return null
      const prevIds = new Set(prev.departmentItems.map(i => i.id))
      const added = next.departmentItems.filter(i => !prevIds.has(i.id))
      const withScenes = added.filter(i => i.fromCapture && (i.scenes || []).length > 0)
      if (withScenes.length === 0) return null
      return { items: withScenes }
    },
    execute: () => {},
    buildSuggestion: (payload) => {
      const item = payload.items[0]
      const deptLabels = {
        wardrobe: 'Guarda-Roupa', art: 'Arte', props: 'Adereços', makeup: 'Caracterização',
        hair: 'Cabelo', sfx: 'SFX', vehicles: 'Veículos', stunts: 'Stunts',
        camera: 'Câmara', lighting: 'Iluminação', sound: 'Som', vfx: 'VFX',
      }
      return {
        type: 'capture-dept-item',
        source: 'departments',
        target: 'production',
        sourceId: item.id,
        title: `Novo item capturado: ${item.name || 'sem nome'}`,
        description: `Item de ${deptLabels[item.department] || item.department} capturado para cena ${item.scenes[0]}${item.characterName ? ` (${item.characterName})` : ''}. Adicionar referência às notas da cena?`,
        data: { itemId: item.id, department: item.department, scenes: item.scenes, characterName: item.characterName },
      }
    },
  },

  // ── 11. Capture Dept → Notificação HOD (item capturado para departamento) ──
  {
    id: 'capture-dept→notification',
    source: 'departments',
    target: 'notification',
    confidence: 'high',
    description: 'Item de departamento capturado — notificar HOD do departamento',
    detect: (prev, next) => {
      if (prev.departmentItems === next.departmentItems) return null
      if (next.departmentItems.length <= prev.departmentItems.length) return null
      const prevIds = new Set(prev.departmentItems.map(i => i.id))
      const added = next.departmentItems.filter(i => !prevIds.has(i.id))
      const fromCapture = added.filter(i => i.fromCapture)
      if (fromCapture.length === 0) return null
      return { items: fromCapture }
    },
    execute: (payload, store) => {
      // Criar notificação para o HOD do departamento
      const deptLabels = {
        wardrobe: 'Guarda-Roupa', art: 'Arte', props: 'Adereços', makeup: 'Caracterização',
        hair: 'Cabelo', sfx: 'SFX', vehicles: 'Veículos', stunts: 'Stunts',
        camera: 'Câmara', lighting: 'Iluminação', sound: 'Som', vfx: 'VFX',
      }
      const deptColors = {
        wardrobe: '#A02E6F', art: '#2EA080', props: '#BF6A2E', makeup: '#7B4FBF',
        hair: '#5B8DEF', sfx: '#F87171', vehicles: '#6E6E78', stunts: '#E11D48',
        camera: '#2E6FA0', lighting: '#F5A623', sound: '#22C55E', vfx: '#8B5CF6',
      }

      for (const item of payload.items) {
        const dept = item.department || 'props'
        const label = deptLabels[dept] || dept
        const color = deptColors[dept] || '#2E6FA0'

        if (store.addNotification) {
          store.addNotification({
            type: 'capture-dept',
            title: `Novo item capturado → ${label}`,
            message: `${item.capturedBy ? `De: ${typeof item.capturedBy === 'object' ? item.capturedBy.name || 'Equipa' : item.capturedBy}. ` : ''}${item.name || 'Item capturado'}${item.scenes?.length > 0 ? ` (${item.scenes[0]})` : ''}`,
            destination: label,
            color,
            department: dept,
            timestamp: Date.now(),
          })
        }
      }
    },
  },

  // ── 12. Locais → Auto-enrichment (status → confirmado) ─────────
  {
    id: 'location-confirmed→enrich',
    source: 'locations',
    target: 'locations',
    confidence: 'high',
    description: 'Local confirmado — geocoding + POIs automáticos (parking, catering, hospital)',
    detect: (prev, next) => {
      if (prev.locations === next.locations) return null
      for (let i = 0; i < next.locations.length; i++) {
        const n = next.locations[i]
        const p = prev.locations.find(l => l.id === n.id)
        if (p && p.status !== 'confirmado' && n.status === 'confirmado' && !n.enrichment) {
          return { location: n }
        }
      }
      return null
    },
    execute: async (payload, store) => {
      const loc = payload.location
      const updateLoc = store.updateLocation
      if (!updateLoc) return

      let lat = loc.lat
      let lng = loc.lng

      // Step 1: Geocode if needed
      if (!lat && !lng && loc.address) {
        try {
          const ac1 = new AbortController()
          const t1 = setTimeout(() => ac1.abort(), 5000)
          const r = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(loc.address)}&format=json&limit=1`,
            { headers: { 'Accept-Language': 'pt', 'User-Agent': 'FrameFlow-App' }, signal: ac1.signal }
          )
          clearTimeout(t1)
          const d = await r.json()
          if (d[0]) {
            lat = parseFloat(d[0].lat)
            lng = parseFloat(d[0].lon)
            updateLoc(loc.id, { lat, lng })
          }
        } catch { /* silent */ }
      }

      // Step 2: Fetch POIs (parking, restaurants, hospital) within 800m
      if (lat && lng) {
        try {
          const ac2 = new AbortController()
          const t2 = setTimeout(() => ac2.abort(), 6000)
          const q = `[out:json][timeout:12];(node["amenity"~"restaurant|cafe|parking|fuel|hospital"](around:800,${lat},${lng}););out body;`
          const r = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`, { signal: ac2.signal })
          clearTimeout(t2)
          const d = await r.json()
          const pois = (d.elements || []).map(el => ({
            name: el.tags?.name || el.tags?.amenity || 'POI',
            type: el.tags?.amenity || 'unknown',
            lat: el.lat,
            lng: el.lon,
          }))

          // Group by type
          const enrichment = {
            parking: pois.filter(p => p.type === 'parking').slice(0, 3),
            catering: pois.filter(p => ['restaurant', 'cafe'].includes(p.type)).slice(0, 5),
            hospital: pois.filter(p => p.type === 'hospital').slice(0, 1),
            fuel: pois.filter(p => p.type === 'fuel').slice(0, 2),
            enrichedAt: new Date().toISOString(),
          }
          updateLoc(loc.id, { enrichment })
        } catch { /* silent */ }
      }
    },
  },

  // ── 13. Locais → Callsheet (morada confirmada → auto-update) ────
  {
    id: 'location-confirmed→callsheet',
    source: 'locations',
    target: 'callsheet',
    confidence: 'high',
    description: 'Morada de local actualizada — callsheet actualizada automaticamente',
    detect: (prev, next) => {
      if (prev.locations === next.locations) return null
      for (let i = 0; i < next.locations.length; i++) {
        const n = next.locations[i]
        const p = prev.locations.find(l => l.id === n.id)
        if (p && !p.address && n.address) {
          return { location: n }
        }
      }
      return null
    },
    execute: (payload, store) => {
      // Auto-propagação: actualizar shootingDays que referenciam este local
      const { shootingDays, sceneAssignments, parsedScripts } = store
      const locName = payload.location.name || payload.location.displayName

      // Encontrar cenas neste local
      const scenesAtLocation = []
      Object.values(parsedScripts).forEach(ep => {
        ;(ep.scenes || []).forEach(sc => {
          if (sc.location === locName) {
            const key = `${ep.episode}-${sc.sceneNumber || sc.id}`
            scenesAtLocation.push(key)
          }
        })
      })

      // Encontrar dias que têm estas cenas
      const affectedDayIds = new Set()
      scenesAtLocation.forEach(sk => {
        const dayId = sceneAssignments[sk]
        if (dayId) affectedDayIds.add(dayId)
      })

      // Nada a fazer se nenhum dia afectado — mas regra detectou, então log é suficiente
      // A callsheet vai buscar a morada ao locations store directamente,
      // por isso o auto-update é inerente. O log serve como audit trail.
    },
  },
]
