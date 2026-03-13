// FRAME — Sides Generator
// Gera sides personalizados por tipo (A-F)
// A: Actor+Episódio, B: Actor+Dia, C: Actor Completo,
// D: Realizador, E: Script Supervisor, F: Departamento

/**
 * Gera código de rastreio único por ficheiro
 */
export function gerarCodigoRastreio(destinatarioId, tipo, versao, timestamp = Date.now()) {
  const hash = btoa(`${destinatarioId}-${tipo}-${versao}-${timestamp}`)
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 12)
    .toUpperCase()
  return `FRAME-${hash}`
}

/**
 * Gera link token único
 */
function gerarLinkToken() {
  return `side_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Calcula estado emocional do personagem no início de uma cena
 * baseado no arco narrativo do universo
 */
function calcEstadoEmocional(charName, scene, universe, allScenes) {
  if (!universe?.chars) return null
  const char = universe.chars.find(c => c.name?.toLowerCase() === charName?.toLowerCase())
  if (!char) return null

  // Procura arcos que mencionam o personagem
  const arco = (universe.arcs || []).find(a =>
    a.characterId === char.id || a.character === char.name
  )
  if (!arco?.pontos?.length) {
    // Fallback: tentar inferir do campo arc do personagem
    return char.arc || null
  }

  // Encontrar o ponto do arco mais próximo antes desta cena
  const sceneNum = parseInt(String(scene.sceneNumber || scene.id).replace(/\D/g, '')) || 0
  const ponto = arco.pontos
    .filter(p => !p.episodio_id || p.episodio_id === scene.epId)
    .filter(p => (p.cena_numero || 0) <= sceneNum)
    .sort((a, b) => (b.cena_numero || 0) - (a.cena_numero || 0))
    [0]

  return ponto?.estado_emocional || char.arc || null
}

/**
 * Encontra o actor que interpreta um personagem
 */
function findActorForChar(charName, team, universe) {
  // Procura no casting (team com role de elenco)
  const actor = (team || []).find(m =>
    m.role?.toLowerCase() === charName?.toLowerCase() ||
    m.character?.toLowerCase() === charName?.toLowerCase()
  )
  if (actor) return actor

  // Procura no universo
  const uChar = (universe?.chars || []).find(c => c.name?.toLowerCase() === charName?.toLowerCase())
  if (uChar?.actorName) {
    return (team || []).find(m => m.name === uChar.actorName) || { name: uChar.actorName }
  }
  return null
}

/**
 * Tipo A — Sides por actor por episódio
 * Ordem narrativa, todas as cenas do actor no episódio
 */
export function generateSidesActorEpisodio(actorCharName, episodioId, allScenes, { universe, team, productionScript, costuras }) {
  const scenes = allScenes
    .filter(s => s.epId === episodioId)
    .filter(s => (s.characters || []).some(c => c.toLowerCase() === actorCharName.toLowerCase()))
    .sort((a, b) => {
      const numA = parseInt(String(a.sceneNumber || a.id).replace(/\D/g, '')) || 0
      const numB = parseInt(String(b.sceneNumber || b.id).replace(/\D/g, '')) || 0
      return numA - numB
    })

  return scenes.map(scene => {
    const costura = (costuras || []).find(c =>
      c.cena_antes === scene.sceneKey || c.cena_depois === scene.sceneKey
    )

    return {
      sceneKey: scene.sceneKey,
      cabecalho: `${scene.intExt || 'INT'}. ${(scene.location || '').toUpperCase()} — ${scene.timeOfDay || 'DIA'}`,
      sceneNumber: scene.sceneNumber || scene.id,
      dia_rodagem: scene.dia_rodagem,
      estado: scene.estado,
      acao: (scene.action || []).map(a => typeof a === 'string' ? a : a.text || ''),
      dialogos: (scene.dialogue || []).map(d => ({
        personagem: d.character,
        texto: d.text,
        didascalia: d.parenthetical || null,
        isActor: d.character?.toLowerCase() === actorCharName.toLowerCase(),
      })),
      estadoEmocional: calcEstadoEmocional(actorCharName, scene, universe, allScenes),
      costura: costura ? {
        tipo: costura.cena_depois === scene.sceneKey ? 'depois' : 'antes',
        intervalo_dias: costura.intervalo_dias,
        cena_ligada: costura.cena_depois === scene.sceneKey ? costura.cena_antes : costura.cena_depois,
        checklist: costura.checklist || [],
      } : null,
      synopsis: scene.synopsis || '',
      durationMin: scene.durationMin || scene.duration || 0,
    }
  })
}

/**
 * Tipo B — Sides por actor por dia de rodagem
 * Ordem de rodagem (não narrativa)
 */
export function generateSidesActorDia(actorCharName, dayId, allScenes, { shootingDays, sceneAssignments, universe, team, costuras }) {
  const day = (shootingDays || []).find(d => d.id === dayId)
  if (!day) return { day: null, scenes: [] }

  const scenes = allScenes
    .filter(s => s.dia_rodagem_id === dayId)
    .filter(s => (s.characters || []).some(c => c.toLowerCase() === actorCharName.toLowerCase()))
    .sort((a, b) => {
      // Ordem de rodagem: hora prevista
      if (a.hora_prevista && b.hora_prevista) return a.hora_prevista.localeCompare(b.hora_prevista)
      return 0
    })

  return {
    day: {
      dayNumber: day.dayNumber,
      date: day.date,
      callTime: day.callTime || '08:00',
      location: scenes[0]?.location || '—',
    },
    scenes: scenes.map(scene => {
      const costura = (costuras || []).find(c =>
        c.cena_antes === scene.sceneKey || c.cena_depois === scene.sceneKey
      )

      return {
        sceneKey: scene.sceneKey,
        cabecalho: `${scene.intExt || 'INT'}. ${(scene.location || '').toUpperCase()} — ${scene.timeOfDay || 'DIA'}`,
        sceneNumber: scene.sceneNumber || scene.id,
        hora_prevista: scene.hora_prevista || '—',
        location: scene.location || '',
        estado: scene.estado,
        acao: (scene.action || []).map(a => typeof a === 'string' ? a : a.text || ''),
        dialogos: (scene.dialogue || []).map(d => ({
          personagem: d.character,
          texto: d.text,
          didascalia: d.parenthetical || null,
          isActor: d.character?.toLowerCase() === actorCharName.toLowerCase(),
        })),
        estadoEmocional: calcEstadoEmocional(actorCharName, scene, universe, allScenes),
        costura: costura ? {
          tipo: costura.cena_depois === scene.sceneKey ? 'depois' : 'antes',
          intervalo_dias: costura.intervalo_dias,
          cena_ligada: costura.cena_depois === scene.sceneKey ? costura.cena_antes : costura.cena_depois,
          checklist: costura.checklist || [],
        } : null,
        continuidade: scene.continuidade || null,
        synopsis: scene.synopsis || '',
      }
    }),
  }
}

/**
 * Tipo C — Sides completos do actor (todos os episódios)
 * Ordem narrativa EP01→EP02→...
 */
export function generateSidesActorCompleto(actorCharName, allScenes, ctx) {
  const episodes = [...new Set(allScenes.map(s => s.epId))].sort()

  return episodes.map(epId => ({
    episodio: epId,
    cenas: generateSidesActorEpisodio(actorCharName, epId, allScenes, ctx),
  })).filter(ep => ep.cenas.length > 0)
}

/**
 * Tipo D — Sides do realizador
 * Guião completo com camada de produção
 */
export function generateSidesRealizador(allScenes, { costuras, universe, productionScript }) {
  return allScenes.map(scene => {
    const prodData = productionScript?.cenas?.[scene.sceneKey] || {}
    const costura = (costuras || []).find(c =>
      c.cena_antes === scene.sceneKey || c.cena_depois === scene.sceneKey
    )

    // Intenção da cena do universo (se existir em bible ou writersRoom)
    const intencao = (universe?.writersRoom || []).find(n =>
      n.sceneKey === scene.sceneKey || n.scene === scene.sceneKey
    )?.intent || null

    return {
      sceneKey: scene.sceneKey,
      epId: scene.epId,
      cabecalho: `${scene.intExt || 'INT'}. ${(scene.location || '').toUpperCase()} — ${scene.timeOfDay || 'DIA'}`,
      sceneNumber: scene.sceneNumber || scene.id,
      dia_rodagem: scene.dia_rodagem,
      hora_prevista: scene.hora_prevista,
      estado: scene.estado,
      acao: (scene.action || []).map(a => typeof a === 'string' ? a : a.text || ''),
      dialogos: (scene.dialogue || []).map(d => ({
        personagem: d.character,
        texto: d.text,
        didascalia: d.parenthetical || null,
      })),
      notas_realizador: prodData.notas_realizador || [],
      intencao,
      costura: costura ? {
        tipo: costura.cena_depois === scene.sceneKey ? 'depois' : 'antes',
        intervalo_dias: costura.intervalo_dias,
        checklist: costura.checklist || [],
      } : null,
      synopsis: scene.synopsis || '',
      characters: scene.characters || [],
      location: scene.location || '',
    }
  })
}

/**
 * Tipo E — Sides do Script Supervisor
 * Foco em continuidade
 */
export function generateSidesScriptSupervisor(allScenes, { costuras, continuityData, departmentItems }) {
  return allScenes.map(scene => {
    const contData = continuityData?.[scene.sceneKey] || {}
    const costura = (costuras || []).find(c =>
      c.cena_antes === scene.sceneKey || c.cena_depois === scene.sceneKey
    )

    // Props e guarda-roupa dos departmentItems
    const sceneItems = (departmentItems || []).filter(item =>
      item.sceneKey === scene.sceneKey || item.scenes?.includes(scene.sceneKey)
    )
    const props = sceneItems.filter(i => i.department === 'adereços' || i.department === 'props' || i.category === 'props')
    const wardrobe = sceneItems.filter(i => i.department === 'guarda-roupa' || i.department === 'wardrobe' || i.category === 'wardrobe')

    return {
      sceneKey: scene.sceneKey,
      epId: scene.epId,
      cabecalho: `${scene.intExt || 'INT'}. ${(scene.location || '').toUpperCase()} — ${scene.timeOfDay || 'DIA'}`,
      sceneNumber: scene.sceneNumber || scene.id,
      dia_rodagem: scene.dia_rodagem,
      estado: scene.estado,
      characters: scene.characters || [],
      location: scene.location || '',
      synopsis: scene.synopsis || '',
      // Continuidade
      props: props.map(p => p.name || p.label || p.descricao),
      wardrobe: wardrobe.map(w => ({ character: w.character, descricao: w.name || w.label || w.descricao })),
      continuidade: {
        wardrobe: contData.wardrobe || null,
        props: contData.props || null,
        makeup: contData.makeup || null,
        photos: contData.photos || [],
        notas: contData.notas || [],
      },
      costura: costura ? {
        ...costura,
        tipo: costura.cena_depois === scene.sceneKey ? 'depois' : 'antes',
      } : null,
    }
  })
}

/**
 * Tipo F — Sides por departamento
 * Filtrado para Director de Arte / Som / Guarda-Roupa
 */
export function generateSidesDepartamento(departamento, allScenes, { departmentItems, costuras, universe, locations }) {
  switch (departamento) {
    case 'arte': {
      // Agrupar por local
      const locMap = {}
      allScenes.forEach(scene => {
        const loc = scene.location || 'Desconhecido'
        if (!locMap[loc]) locMap[loc] = { location: loc, scenes: [], items: [] }
        locMap[loc].scenes.push({
          sceneKey: scene.sceneKey,
          epId: scene.epId,
          dia_rodagem: scene.dia_rodagem,
          cabecalho: `${scene.intExt || 'INT'}. ${loc.toUpperCase()} — ${scene.timeOfDay || 'DIA'}`,
        })
      })

      // Adicionar items de departamento
      ;(departmentItems || [])
        .filter(i => i.department === 'arte' || i.department === 'adereços' || i.category === 'props' || i.category === 'set-dressing')
        .forEach(item => {
          const loc = item.location || 'Desconhecido'
          if (locMap[loc]) locMap[loc].items.push(item)
        })

      // Fotos de referência do universo/locations
      Object.values(locMap).forEach(group => {
        const locData = (locations || []).find(l => l.name === group.location)
        group.photos = locData?.photos || []
        group.diasDeUso = [...new Set(group.scenes.map(s => s.dia_rodagem).filter(Boolean))]
      })

      return Object.values(locMap)
    }

    case 'som': {
      return allScenes.map(scene => {
        const items = (departmentItems || []).filter(i =>
          (i.department === 'som' || i.category === 'sound') &&
          (i.sceneKey === scene.sceneKey || i.scenes?.includes(scene.sceneKey))
        )
        return {
          sceneKey: scene.sceneKey,
          epId: scene.epId,
          cabecalho: `${scene.intExt || 'INT'}. ${(scene.location || '').toUpperCase()} — ${scene.timeOfDay || 'DIA'}`,
          dia_rodagem: scene.dia_rodagem,
          location: scene.location || '',
          intExt: scene.intExt,
          characters: scene.characters || [],
          ambienteSonoro: items.find(i => i.type === 'ambiente')?.descricao || (scene.intExt === 'EXT' ? 'Exterior — verificar ruído' : null),
          efeitos: items.filter(i => i.type === 'efeito' || i.type === 'sfx').map(i => i.name || i.descricao),
          alertas: scene.intExt === 'EXT' ? ['Local exterior — avaliar condições acústicas'] : [],
          usaLapela: (scene.characters || []).length <= 3, // sugestão
        }
      })
    }

    case 'guarda-roupa': {
      // Agrupar por personagem
      const charMap = {}
      allScenes.forEach(scene => {
        ;(scene.characters || []).forEach(char => {
          if (!charMap[char]) charMap[char] = { character: char, scenes: [] }
          const costura = (costuras || []).find(c =>
            (c.cena_antes === scene.sceneKey || c.cena_depois === scene.sceneKey) &&
            c.checklist?.some(item => item.categoria === 'guarda-roupa')
          )
          charMap[char].scenes.push({
            sceneKey: scene.sceneKey,
            epId: scene.epId,
            dia_rodagem: scene.dia_rodagem,
            location: scene.location,
            costura: costura ? {
              intervalo_dias: costura.intervalo_dias,
              checklist: costura.checklist.filter(i => i.categoria === 'guarda-roupa'),
            } : null,
          })
        })
      })

      // Adicionar looks do departamento
      ;(departmentItems || [])
        .filter(i => i.department === 'guarda-roupa' || i.category === 'wardrobe')
        .forEach(item => {
          if (item.character && charMap[item.character]) {
            charMap[item.character].look = item.descricao || item.name
          }
        })

      return Object.values(charMap)
    }

    default:
      return []
  }
}

/**
 * Gera um side completo com metadados
 */
export function generateSide({ tipo, destinatarioId, destinatarioNome, episodioId, dayId, departamento, allScenes, ctx }) {
  const versao = ctx.productionScript?.versao_atual || 'v1'
  const codigoRastreio = gerarCodigoRastreio(destinatarioId, tipo, versao)
  const linkToken = gerarLinkToken()

  let content
  let titulo

  switch (tipo) {
    case 'actor-ep':
      content = generateSidesActorEpisodio(destinatarioNome, episodioId, allScenes, ctx)
      titulo = `${destinatarioNome} · ${episodioId} · ${versao}`
      break
    case 'actor-dia':
      content = generateSidesActorDia(destinatarioNome, dayId, allScenes, ctx)
      titulo = `${destinatarioNome} · Dia ${content.day?.dayNumber || '?'} · ${versao}`
      break
    case 'actor-completo':
      content = generateSidesActorCompleto(destinatarioNome, allScenes, ctx)
      titulo = `${destinatarioNome} · Completo · ${versao}`
      break
    case 'realizador':
      content = generateSidesRealizador(allScenes, ctx)
      titulo = `Realizador · ${versao}`
      break
    case 'script-supervisor':
      content = generateSidesScriptSupervisor(allScenes, ctx)
      titulo = `Script Supervisor · ${versao}`
      break
    case 'departamento':
      content = generateSidesDepartamento(departamento, allScenes, ctx)
      titulo = `${departamento.charAt(0).toUpperCase() + departamento.slice(1)} · ${versao}`
      break
    default:
      content = []
      titulo = 'Sides'
  }

  return {
    id: `side_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    tipo,
    destinatario_id: destinatarioId,
    destinatario_nome: destinatarioNome,
    episodio_id: episodioId || null,
    dia: dayId || null,
    departamento: departamento || null,
    versao_guiao: versao,
    gerado_em: Date.now(),
    codigo_rastreio: codigoRastreio,
    link_token: linkToken,
    aberto_em: null,
    num_acessos: 0,
    status: 'activo',
    titulo,
    content,
  }
}
