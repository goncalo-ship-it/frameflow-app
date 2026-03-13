// Smart Populate — AI analisa linhas de orçamento e povoa Equipa, Locais, Departamentos
import { fetchAPI } from '../../../core/api.js'

export async function smartPopulate({ lines, apiKey, team, locations, addMember, addLocation, addDepartmentItem, budgetLines, updateLine }) {
  if (!apiKey || !lines?.length) return null

  const existingTeam = team.map(m => m.name).join(', ')
  const existingLocs = locations.map(l => l.name).join(', ')

  const linesText = lines.map(l => {
    const val = l.valorUnitario != null
      ? `${(l.valorUnitario / 100).toFixed(0)}€ ×${l.quantidade || 1} ×${l.dias || 1}d`
      : `${l.estimado || 0}€`
    return `[cat${l.categoria}] ${l.descricao} — ${val}`
  }).join('\n')

  const prompt = `Analisa estas linhas de orçamento audiovisual e extrai entidades para povoar automaticamente os módulos da aplicação.

CATEGORIAS NO ORÇAMENTO:
- cat1=Pré-Produção, cat2=Elenco, cat3=Equipa Técnica (PESSOAS)
- cat4=Equipamento Técnico (NÃO são pessoas), cat5=Arte, cat6=Estúdios/Locais
- cat7=Transportes/Refeições, cat8=Offline, cat9=Som (pós), cat10=Pós-Produção Vídeo
- cat11=Pós-Produção Foto, cat12=Diversos

LINHAS DE ORÇAMENTO:
${linesText}

EQUIPA JÁ EXISTENTE: ${existingTeam || 'nenhuma'}
LOCAIS JÁ EXISTENTES: ${existingLocs || 'nenhum'}

Extrai e responde APENAS com JSON:
{
  "team": [
    {"name": "Nome Completo ou Função", "role": "função em PT", "group": "Elenco|Realização|Produção|Imagem|Electricidade|Som|Arte|Pós-Produção|Logística", "cacheDiario": número_euros_por_dia, "descricao": "descrição exacta da linha de orçamento original"}
  ],
  "locations": [
    {"name": "Nome do local", "type": "INT|EXT|INT/EXT", "notes": "notas relevantes"}
  ],
  "departments": [
    {"department": "wardrobe|art|props|makeup|hair|sfx|vehicles|stunts|camera|lighting|sound|vfx", "notes": "descrição do item/necessidade"}
  ]
}

REGRAS:
- Em "team": inclui APENAS linhas que sejam claramente pessoas/funções (realizador, produtor, actor, técnico de som, director de fotografia, etc.)
- NÃO incluas equipamento, materiais, serviços ou consumíveis na equipa
- Em "locations": inclui APENAS se houver referência explícita a locais (estúdio, décors, locações)
- Em "departments": inclui items/necessidades de departamento (equipamento câmara, material de arte, roupa, etc.)
- NÃO dupliques pessoas/locais que já existem
- "group" deve ser exactamente um dos valores listados:
  Produção (produtor, director produção, assistente produção, secretária)
  Realização (realizador, 1ºAD, 2ºAD, anotadora, script)
  Imagem (director fotografia, operador câmara, foquista, assistente câmara, DIT, steadicam)
  Electricidade (chefe electricista, electricista, maquinista, grip, gaffer, gerador)
  Som (técnico som, perchista, boom operator)
  Arte (director arte, cenógrafo, aderecista, guarda-roupa, figurinista, caracterização, cabelo, maquilhagem)
  Elenco (actores, figurantes, extras)
  Pós-Produção (montador, editor, colorista, VFX, sound design, mistura)
  Logística (motorista, catering, segurança, limpeza)
- "descricao" deve ser a descrição EXACTA (tal como aparece) da linha de orçamento que deu origem a este membro
- "department" deve ser exactamente um dos IDs listados
- Se não há dados para uma categoria, devolve array vazio []`

  try {
    const response = await fetchAPI({
      apiKey,
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 2000,
      cache: true,
    })
    const match = response.match(/\{[\s\S]*\}/)
    if (!match) return null
    const data = JSON.parse(match[0])
    const result = { team: 0, locations: 0, departments: 0, linkedMembers: [] }

    // Criar membros de equipa
    for (const m of (data.team || [])) {
      if (!m.name) continue
      const exists = team.some(t => t.name?.toLowerCase() === m.name?.toLowerCase())
      if (exists) continue
      const memberId = `member_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      addMember({
        id: memberId,
        name: m.name,
        role: m.role || '',
        group: m.group || 'Produção',
        cacheDiario: m.cacheDiario ? m.cacheDiario * 100 : 0,
        origem: 'budget-import',
      })
      result.team++

      // Link back to budget line
      if (budgetLines && updateLine && m.descricao) {
        const matchedLine = budgetLines.find(l =>
          l.descricao && !l.teamMemberId &&
          l.descricao?.toLowerCase() === m.descricao?.toLowerCase()
        )
        if (matchedLine) {
          updateLine(matchedLine.id, { teamMemberId: memberId })
          result.linkedMembers.push({ memberId, lineId: matchedLine.id, descricao: matchedLine.descricao })
        }
      }
    }

    // Criar locais
    for (const loc of (data.locations || [])) {
      if (!loc.name) continue
      const exists = locations.some(l => l.name?.toLowerCase() === loc.name?.toLowerCase())
      if (exists) continue
      addLocation({
        id: `loc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: loc.name,
        displayName: loc.name,
        type: loc.type || 'INT',
        status: 'pendente',
        notes: loc.notes || '',
        fromScript: false,
      })
      result.locations++
    }

    // Criar items de departamento
    for (const d of (data.departments || [])) {
      if (!d.department || !d.notes) continue
      addDepartmentItem({
        department: d.department,
        notes: d.notes,
        scenes: [],
        photos: [],
        approved: false,
      })
      result.departments++
    }

    return result
  } catch (err) {
    console.warn('Smart populate failed:', err)
    return null
  }
}
