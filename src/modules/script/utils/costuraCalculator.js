// FRAME — Costura Calculator
// Detecta costuras (pontos onde uma sequência é filmada em dias diferentes)
// e gera checklists de continuidade automáticas

/**
 * Detecta costuras numa lista de sequências já definidas
 * @param {Array} sequencias - sequências com cenas[]
 * @param {Object} sceneAssignments - { sceneKey: dayId }
 * @param {Array} shootingDays - dias de rodagem com dayNumber
 * @returns {Array} costuras detectadas
 */
export function detectCosturas(sequencias, sceneAssignments, shootingDays) {
  const costuras = []
  const dayMap = {}
  shootingDays.forEach(d => { dayMap[d.id] = d })

  for (const seq of sequencias) {
    if (!seq.cenas || seq.cenas.length < 2) continue

    // Obter dia de cada cena na sequência (ordem narrativa)
    const cenasComDia = seq.cenas.map(sceneKey => ({
      sceneKey,
      dayId: sceneAssignments[sceneKey] || null,
      dayNumber: sceneAssignments[sceneKey]
        ? (dayMap[sceneAssignments[sceneKey]]?.dayNumber || null)
        : null,
    }))

    // Detectar transições de dia dentro da sequência
    for (let i = 1; i < cenasComDia.length; i++) {
      const prev = cenasComDia[i - 1]
      const curr = cenasComDia[i]

      if (!prev.dayId || !curr.dayId) continue
      if (prev.dayId === curr.dayId) continue

      // Há uma costura — dias diferentes na mesma sequência
      const intervalo = Math.abs((curr.dayNumber || 0) - (prev.dayNumber || 0))

      costuras.push({
        id: `costura_${seq.id}_${prev.sceneKey}_${curr.sceneKey}`,
        sequencia_id: seq.id,
        cena_antes: prev.sceneKey,
        cena_depois: curr.sceneKey,
        dia_antes: prev.dayNumber,
        dia_depois: curr.dayNumber,
        dayId_antes: prev.dayId,
        dayId_depois: curr.dayId,
        intervalo_dias: intervalo,
        checklist: generateChecklist(seq, prev.sceneKey, curr.sceneKey),
        notas: '',
      })
    }
  }

  return costuras
}

/**
 * Gera checklist de continuidade para uma costura
 */
function generateChecklist(sequencia, cenaAntes, cenaDepois) {
  return [
    {
      categoria: 'guarda-roupa',
      descricao: `Verificar guarda-roupa idêntico entre ${cenaAntes} e ${cenaDepois}`,
      foto_referencia: null,
      estado: 'por-verificar',
    },
    {
      categoria: 'maquilhagem',
      descricao: `Maquilhagem e penteado consistentes (${cenaAntes} → ${cenaDepois})`,
      foto_referencia: null,
      estado: 'por-verificar',
    },
    {
      categoria: 'adereços',
      descricao: `Adereços nas mãos/bolsos idênticos`,
      foto_referencia: null,
      estado: 'por-verificar',
    },
    {
      categoria: 'estado-emocional',
      descricao: `Estado emocional no início de ${cenaDepois} = fim de ${cenaAntes}`,
      foto_referencia: null,
      estado: 'por-verificar',
    },
    {
      categoria: 'luz',
      descricao: `Consistência de luz/hora narrativa entre as cenas`,
      foto_referencia: null,
      estado: 'por-verificar',
    },
  ]
}

/**
 * Enriquece sequências com info de dias de rodagem e costuras
 */
export function enrichSequencias(sequencias, sceneAssignments, shootingDays) {
  const dayMap = {}
  shootingDays.forEach(d => { dayMap[d.id] = d })

  const costuras = detectCosturas(sequencias, sceneAssignments, shootingDays)

  return sequencias.map(seq => {
    const dias = new Set()
    seq.cenas.forEach(sk => {
      const dayId = sceneAssignments[sk]
      if (dayId && dayMap[dayId]) {
        dias.add(dayMap[dayId].dayNumber)
      }
    })

    const seqCosturas = costuras.filter(c => c.sequencia_id === seq.id)

    return {
      ...seq,
      dias_de_rodagem: [...dias].sort((a, b) => a - b),
      tem_costura: seqCosturas.length > 0,
      costuras: seqCosturas,
    }
  })
}
