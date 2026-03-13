// Seed data — DESDOBRADO (série RTP2, 6×25min)
// Dados de exemplo para demonstração do módulo Universo
// Podem ser apagados/substituídos pelo utilizador

const ts = Date.now()
let _i = 0
const id = (prefix) => `${prefix}-seed-${++_i}`

// ══════════════════════════════════════════════════════════════════
// PERSONAGENS
// ══════════════════════════════════════════════════════════════════

const JOAO_ID     = id('c')
const CAS_ID      = id('c')
const MATI_ID     = id('c')
const JU_ID       = id('c')
const PEQUENO_ID  = id('c')
const LU_ID       = id('c')
const MAE_ID      = id('c')
const ANTONIO_ID  = id('c')
const RUBEN_ID    = id('c')
const JULIO_ID    = id('c')
const FABIO_ID    = id('c')

export const seedChars = [
  {
    id: JOAO_ID, name: 'João', arcType: 'protagonista', group: 'João & Família',
    description: '16 anos. Vive só com a mãe — do pai nunca se fala. Classe média, escola pública. Chegou há pouco tempo a uma escola nova onde ainda está a encontrar o seu lugar. Tem boas notas, actividades, é tímido e reservado. Está a descobrir-se. Um dia os seus aspectos interiores ganham corpo, nome e farda — e o mundo inteiro tem de lidar com eles. João também.',
    age: '16', occupation: 'Estudante',
    voice: {
      when: 'Quando fala directamente — o que sobra depois de todos os filtros. Fala pouco quando os Forasteiros estão activos.',
      what: 'Os momentos em que João fala com a Voz Plena — sem Forasteiros a intermediar — são os mais importantes da série.',
      example: '"Corar por dentro que sobe até dar uma mini cegueira." — EP01_SC027',
    },
    traits: ['16 anos', 'escola nova', 'classe média', 'reservado', 'neurodivergente'],
    roomNotes: 'Ferida estrutural: o pai ausente não é detalhe de backstory. É uma pressão constante que o João sente e não nomeia. Os Forasteiros podem ser parcialmente criados por ela. A série não o precisa de explicar — mas a room precisa de saber a resposta.',
    universeRule: 'Quando está em paz com a Mãe, os Forasteiros silenciam-se. Não é a mãe que os afasta — é o estado interior de João.',
    backstory: 'Do pai nunca se fala, nunca é conversa. A ausência faz pressão activa. Chegou há pouco a uma escola nova.',
    arc: 'Ciclo de luto — não de algo que perdeu, mas de uma versão de si que acreditava ser a única. Da negação à coexistência com consciência.',
    notes: '', x: 0, y: 0, photo: '',
    relations: [
      { targetId: CAS_ID, type: 'família', notes: 'Cas fala o que João pensa sem filtro' },
      { targetId: MATI_ID, type: 'família', notes: 'Mati age onde João hesita' },
      { targetId: JU_ID, type: 'família', notes: 'Ju vê o que João sabe mas não diz' },
      { targetId: PEQUENO_ID, type: 'família', notes: 'João Pequeno reage antes de João pensar' },
      { targetId: LU_ID, type: 'amizade', notes: '"Vai devagar." — única âncora real' },
      { targetId: MAE_ID, type: 'família', notes: 'Paz interior — Forasteiros silenciam-se' },
      { targetId: ANTONIO_ID, type: 'mentor-aprendiz', notes: '⚑ sabe algo — futuro mentor' },
    ],
  },
  {
    id: CAS_ID, name: 'Cas (Casimiro)', arcType: 'aliado', group: 'Forasteiros',
    description: 'Optimista inseguro. Extrovertido, easygoing. Quer agradar e ser prestável. Super curioso. Ótimo coração, bom sentido de humor. Fisicamente desajeitado — ocupa espaço sem perceber. Fala quando não deve. Aprecia as panquecas. Perde objectos constantemente.',
    voice: {
      when: 'João está entusiasmado, curioso, cheio de energia, ou a tentar desesperadamente agradar.',
      what: 'Cas é o João sem armadura — a dizer o que pensa antes de filtrar, a falar por falar, a precisar de ser aceite. As falas de Cas transferidas para o João fazem-no parecer mais leve, mais humano, mais gozão.',
      example: '"João, as tuas panquecas são genuinamente as melhores que eu já comi. Não estou a exagerar. Bem, talvez esteja um bocadinho, mas—"',
    },
    traits: ['farda', 'por corte', 'curiosidade', 'falta de foco', 'fala excessiva', 'perde objectos'],
    roomNotes: 'Escrever Cas: começa a frase a meio, não termina onde devia. Elogia o óbvio. Frases longas. Perde o fio. Repete para confirmar.',
    universeRule: 'Aparece por corte. Farda invariável. Fisicalidade é o humor: desengonçado, entusiasta, ocupa espaço sem perceber.',
    notes: '', x: 0, y: 0, photo: '', age: '', occupation: '',
    backstory: '', arc: '',
    relations: [
      { targetId: JOAO_ID, type: 'família', notes: 'É o João entusiasmado a tentar agradar' },
      { targetId: MATI_ID, type: 'colega', notes: 'Banter constante — efusivo vs directa' },
      { targetId: JU_ID, type: 'colega', notes: 'Ju observa o caos de Cas com cirurgia' },
      { targetId: PEQUENO_ID, type: 'amizade', notes: 'Os dois mais brincalhões' },
    ],
  },
  {
    id: MATI_ID, name: 'Mati', arcType: 'aliado', group: 'Forasteiros',
    description: 'Misto de bully com trabalhadora dedicada. Partes iguais de hilariante e assustadora. Nunca fica insegura. Capaz de levar tudo à frente. Abre a porta que João não conseguia. "Tu és bonita Lu" — a verdade que o João pensa mas não diz.',
    voice: {
      when: 'João tem coragem mas não a usa. Quando precisa de agir e hesita. Quando a verdade precisa de ser dita e ele fica calado.',
      what: 'As falas de Mati transferidas para o João fazem-no parecer mais corajoso, mais directo — quase irreconhecível. Mati diz o que o João precisa de dizer para se libertar.',
      example: '"Tu és bonita Lu." Ponto. Sem mais.',
    },
    traits: ['farda', 'por corte', 'hiperfoco', 'adaptabilidade', 'coragem', 'risco'],
    roomNotes: 'Escrever Mati: remove as desculpas. Remove o "mas". Fica com a frase que sobra. Frases curtas. Sem explicação. Age antes de falar.',
    universeRule: 'Aparece por corte. Farda. Fisicalidade séria onde Cas é cómica. Ocupa espaço com intenção deliberada.',
    notes: '', x: 0, y: 0, photo: '', age: '', occupation: '',
    backstory: '', arc: '',
    relations: [
      { targetId: JOAO_ID, type: 'família', notes: 'É o João corajoso' },
      { targetId: CAS_ID, type: 'colega', notes: 'Cas efusivo vs Mati cirúrgica' },
      { targetId: JU_ID, type: 'colega', notes: 'Ju calibra onde Mati vai longe demais' },
      { targetId: PEQUENO_ID, type: 'colega', notes: 'Os dois mais físgados a agir' },
      { targetId: LU_ID, type: 'colega', notes: '"Tu és bonita Lu"' },
      { targetId: JULIO_ID, type: 'conflito', notes: 'Enfrenta onde João hesita' },
    ],
  },
  {
    id: JU_ID, name: 'Ju (Juliana)', arcType: 'aliado', group: 'Forasteiros',
    description: 'Observadora, segura, calma. A confiante que sabe o que sabe. Humor assente no óbvio — diz o que toda a gente está a pensar mas não formulou. "JÁ CHEGA!" — bolsa sonora rara — silêncio total. É quem menos fala. Quando fala, acerta sempre.',
    voice: {
      when: 'João vê com clareza mas não consegue agir. Quando sabe que algo não está bem antes de o nomear. Quando precisa de fazer silêncio onde há barulho.',
      what: 'Ju é o João a ter razão — e a aguentar ter razão em silêncio. Menos é mais: se uma cena tem três falas de Ju, corta para uma.',
      example: '"Já percebemos. Mas não podemos fazer nada." / "JÁ CHEGA!"',
    },
    traits: ['farda', 'por corte', 'imaginação', 'procrastinação', 'espontaneidade', 'justiça'],
    roomNotes: 'Escrever Ju: menos é mais. Se tem três falas, corta para uma. O silêncio de Ju é uma fala. Poucas falas. Muito pesadas. Humor no óbvio.',
    universeRule: 'Aparece por corte. Farda. É quem menos fala — quando fala, acerta sempre.',
    notes: '', x: 0, y: 0, photo: '', age: '', occupation: '',
    backstory: '', arc: '',
    relations: [
      { targetId: JOAO_ID, type: 'família', notes: 'É o João que vê claro' },
      { targetId: CAS_ID, type: 'colega', notes: 'Observa o caos de Cas com cirurgia' },
      { targetId: MATI_ID, type: 'colega', notes: 'Calibra onde Mati vai longe demais' },
      { targetId: PEQUENO_ID, type: 'colega', notes: 'Ju é o silêncio que JP não consegue' },
      { targetId: JULIO_ID, type: 'conflito', notes: '"JÁ CHEGA!"' },
    ],
  },
  {
    id: PEQUENO_ID, name: 'João Pequeno', arcType: 'aliado', group: 'Forasteiros',
    description: 'Cínico, desconfiado à partida — mas depois de confiar é totalmente leal. Firme, duro, não arreda pé. Alto e forte apesar do nome. "Dorme bem. Queres um beijinho?" — ternura disfarçada de sarcasmo. Faria tudo pelo grupo.',
    voice: {
      when: 'João está rabugento, impaciente, cansado — ou quando alguém que quer proteger está em risco. O impulso antes da razão.',
      what: 'João Pequeno é o João sem a tentação de parecer bem. Mais bruto, mais cínico, mais honesto. O sarcasmo é a ternura invertida.',
      example: '"Dorme bem. Queres um beijinho?" — dito a quem tentou intimidar o João.',
    },
    traits: ['farda', 'por corte', 'energia', 'impulsividade', 'desregulação emocional', 'impaciência'],
    roomNotes: 'Escrever João Pequeno: encontra a ternura. Inverte-a. Esse é o diálogo. Sarcasmo como primeira linguagem. Ternura como segunda, sempre disfarçada.',
    universeRule: 'Aparece por corte. Farda. O mais imprevisível — impulsividade protectora sem aviso.',
    notes: '', x: 0, y: 0, photo: '', age: '', occupation: '',
    backstory: '', arc: '',
    relations: [
      { targetId: JOAO_ID, type: 'família', notes: 'É o João rabugento e impulsivo' },
      { targetId: CAS_ID, type: 'amizade', notes: 'Os dois mais brincalhões' },
      { targetId: MATI_ID, type: 'colega', notes: 'Os dois mais físgados a agir' },
      { targetId: JU_ID, type: 'colega', notes: 'Ju é o silêncio que JP nunca consegue' },
      { targetId: RUBEN_ID, type: 'conflito', notes: 'Protecção impulsiva' },
    ],
  },
  {
    id: LU_ID, name: 'Lu (Ludmila)', arcType: 'aliado', group: 'Mundo Real',
    description: '"Vai devagar." Não é conselho — é presença. A única amiga real. Traz sempre demasiada comida. Lida com os Forasteiros com naturalidade total — não porque entende, mas porque é prática. A relação ainda está a crescer.',
    voice: {
      when: 'Quando o João precisa de âncora. Presença prática, não emocional.',
      what: 'Lu é a prova de que alguém pode aceitar o João sem o compreender totalmente.',
      example: '"Vai devagar."',
    },
    traits: ['prática', 'percebe sem explicar', 'leal', 'traz comida a mais'],
    roomNotes: 'Para a room — Lu tem vida própria: o que é que a Lu quer que não tem nada a ver com o João? O que a assusta? Qual é a coisa que ela não diz ao João? Uma série de 6 eps sustenta uma relação complexa. Pelo menos uma cena por ep que não seja sobre o João. Sem isso a Lu é função, não personagem.',
    universeRule: '',
    notes: '', x: 0, y: 0, photo: '', age: '', occupation: '',
    backstory: '', arc: '',
    relations: [
      { targetId: JOAO_ID, type: 'amizade', notes: '"Vai devagar." — âncora real' },
      { targetId: MATI_ID, type: 'colega', notes: '"Tu és bonita Lu" — constrangimento' },
    ],
  },
  {
    id: MAE_ID, name: 'Mãe', arcType: 'mentor', group: 'João & Família',
    description: 'A mãe do João é o porto seguro — mas não é uma mãe perfeita nem tem de ser. Tira o telefone da mão do João enquanto fala. Arranca um beijo sem parar o que está a fazer. Põe bolonhesa, nunca lasanha. O amor dela é o hábito, não o gesto teatral.',
    voice: {
      when: 'Momentos de paz doméstica. Amor como rotina.',
      what: 'Na presença dela, o ruído interior silencia. Não fala com os Forasteiros directamente.',
      example: 'Bolonhesa, não lasanha. Tira o telefone da mão. Arranca um beijo.',
    },
    traits: ['porto seguro', 'amor hábito', 'silencia Forasteiros', 'pai ausente'],
    roomNotes: 'Para a room — o que ela não consegue dar: a mãe está presente, mas há uma coisa que o João precisa e ela não tem. Pode ser simples: não sabe como falar de emoções directamente. Ou não fala do pai por protecção — e isso cria um silêncio que João sente como falta. Pelo menos uma cena por série que não seja só aconchego.',
    universeRule: 'REGRA ESPECIAL: quando João está em paz com a mãe, os Forasteiros ficam em segundo plano.',
    notes: '', x: 0, y: 0, photo: '', age: '', occupation: '',
    backstory: 'Do pai nunca se fala.', arc: '',
    relations: [
      { targetId: JOAO_ID, type: 'família', notes: 'Paz interior — Forasteiros silenciam-se' },
    ],
  },
  {
    id: ANTONIO_ID, name: 'Sr. António', arcType: 'mentor', group: 'Mundo Real',
    description: 'Porteiro. Deixou os Forasteiros entrar sem cartão. Murmurou "o teste é dele." Câmara fechada na boca. Não dramatizou. O único adulto que reage diferente — não com susto, não com negação. Com reconhecimento.',
    voice: {
      when: 'Momentos raros. Murmura. Câmara fechada na boca.',
      what: 'A anomalia: o único que reage diferente. Reconhecimento, não susto.',
      example: '"O teste é dele."',
    },
    traits: ['já viu tudo', 'anomalia ⚑', 'sabe algo', 'será mentor'],
    roomNotes: 'Para a room — backstory interno: "já viu crianças assim." Porquê? Tem um filho assim? Foi assim? Viu um caso que correu mal? A anomalia só funciona se houver uma lógica humana por baixo. O espectador não precisa de saber — o actor precisa, a room precisa. Não revelar antes do EP05.',
    universeRule: '⚑ ANOMALIA. Câmara fechada na boca quando murmura. Não explicitar antes do EP05.',
    notes: '', x: 0, y: 0, photo: '', age: '', occupation: 'Porteiro',
    backstory: '', arc: 'Crescerá para confidente/mentor. Revelação no EP05.',
    relations: [
      { targetId: JOAO_ID, type: 'mentor-aprendiz', notes: '⚑ anomalia — crescerá para confidente' },
    ],
  },
  {
    id: RUBEN_ID, name: 'Rúben', arcType: 'secundário', group: 'Mundo Real',
    description: 'Par social. Boa intenção. Para ele é uma noite normal. Vê o João de fora para dentro — com boa vontade mas sem compreensão real. Não é mau. É o mundo sem malícia.',
    traits: ['boa intenção', 'não percebe o pânico', 'FIFA'],
    notes: '', x: 0, y: 0, photo: '', age: '', occupation: '',
    voice: { when: '', what: '', example: '' },
    roomNotes: '', universeRule: '', backstory: '', arc: '',
    relations: [
      { targetId: JOAO_ID, type: 'colega', notes: 'Par social — boa vontade sem compreensão' },
      { targetId: PEQUENO_ID, type: 'conflito', notes: 'João Pequeno levantou-se ferozmente' },
    ],
  },
  {
    id: JULIO_ID, name: 'Júlio', arcType: 'antagonista', group: 'Mundo Real',
    description: 'Não é o vilão. É o mundo que não tem paciência para o ritmo do João. A irritação dele é legítima — é isso que o torna difícil. "Fonte infinita de informação inútil."',
    traits: ['provoca', 'não é vilão', 'irritação legítima'],
    notes: '', x: 0, y: 0, photo: '', age: '', occupation: '',
    voice: { when: '', what: '', example: '' },
    roomNotes: '', universeRule: '', backstory: '', arc: '',
    relations: [
      { targetId: JOAO_ID, type: 'conflito', notes: '"Fonte infinita de informação inútil"' },
      { targetId: JU_ID, type: 'conflito', notes: '"JÁ CHEGA!" — o silêncio desequilibrou-o' },
      { targetId: MATI_ID, type: 'conflito', notes: 'Mati enfrenta onde João hesita' },
    ],
  },
  {
    id: FABIO_ID, name: 'Fábio', arcType: 'episódico', group: 'Mundo Real',
    description: '"Não é a primeira vez que fazes isto." Sem magia, só consequências acumuladas. O cansaço tem lógica.',
    traits: ['cansado do padrão', 'consequências'],
    notes: '', x: 0, y: 0, photo: '', age: '', occupation: '',
    voice: { when: '', what: '', example: '' },
    roomNotes: '', universeRule: '', backstory: '', arc: '',
    relations: [
      { targetId: JOAO_ID, type: 'conflito', notes: 'Consequências directas — cansaço acumulado' },
    ],
  },
]

// ══════════════════════════════════════════════════════════════════
// RELAÇÕES (top-level, para o grafo)
// ══════════════════════════════════════════════════════════════════

export const seedRelations = [
  { from: JOAO_ID, to: CAS_ID, type: 'família', label: 'Cas fala o que João pensa sem filtro' },
  { from: JOAO_ID, to: MATI_ID, type: 'família', label: 'Mati age onde João hesita' },
  { from: JOAO_ID, to: JU_ID, type: 'família', label: 'Ju vê o que João sabe mas não diz' },
  { from: JOAO_ID, to: PEQUENO_ID, type: 'família', label: 'João Pequeno reage antes de João pensar' },
  { from: JOAO_ID, to: LU_ID, type: 'amizade', label: '"Vai devagar." — âncora real' },
  { from: JOAO_ID, to: MAE_ID, type: 'família', label: 'Paz interior — Forasteiros silenciam-se' },
  { from: JOAO_ID, to: ANTONIO_ID, type: 'mentor-aprendiz', label: '⚑ anomalia — futuro mentor' },
  { from: JOAO_ID, to: RUBEN_ID, type: 'colega', label: 'Par social — boa vontade' },
  { from: JOAO_ID, to: JULIO_ID, type: 'conflito', label: '"Fonte infinita de informação inútil"' },
  { from: JOAO_ID, to: FABIO_ID, type: 'conflito', label: 'Consequências acumuladas' },
  { from: CAS_ID, to: MATI_ID, type: 'colega', label: 'Banter constante — efusivo vs directa' },
  { from: CAS_ID, to: JU_ID, type: 'colega', label: 'Ju observa o caos de Cas com cirurgia' },
  { from: CAS_ID, to: PEQUENO_ID, type: 'amizade', label: 'Os dois mais brincalhões' },
  { from: MATI_ID, to: JU_ID, type: 'colega', label: 'Ju calibra onde Mati vai longe demais' },
  { from: MATI_ID, to: PEQUENO_ID, type: 'colega', label: 'Os dois mais físgados a agir' },
  { from: MATI_ID, to: LU_ID, type: 'colega', label: '"Tu és bonita Lu"' },
  { from: MATI_ID, to: JULIO_ID, type: 'conflito', label: 'Enfrenta onde João hesita' },
  { from: JU_ID, to: JULIO_ID, type: 'conflito', label: '"JÁ CHEGA!"' },
  { from: PEQUENO_ID, to: RUBEN_ID, type: 'conflito', label: 'Protecção impulsiva' },
]

// ══════════════════════════════════════════════════════════════════
// FORÇAS DO UNIVERSO
// ══════════════════════════════════════════════════════════════════

export const seedForces = [
  { id: id('f'), num: 1, title: 'Os Forasteiros são visíveis para toda a gente', color: '#dc2626',
    text: 'O mundo inteiro os vê e tem de lidar com eles. A professora apresenta-os. A turma ri. O Sr. António fala com eles. Não são alucinações — são uma realidade partilhada que ninguém consegue explicar mas todos aceitam porque não há formulário para outra coisa.',
    reference: '→ GGM: os mortos sentam-se ao jantar e a família passa a bolacha' },
  { id: id('f'), num: 2, title: 'Aparecem por corte — sem aviso, sem efeito', color: '#7c3aed',
    text: 'Plano aberto: não estão. Vemos um detalhe. Abrimos — já lá está um deles a falar. Sem efeito especial. Sem música de aviso. Sem reacção especial dos outros personagens. É o corte que é a magia. A câmara aceita como aceita qualquer coisa normal.',
    reference: '→ Bulgakov: Woland aparece em Moscovo. Ninguém o convidou.' },
  { id: id('f'), num: 3, title: 'Farda — sempre a mesma roupa', color: '#d97706',
    text: 'Os 4 usam sempre o mesmo guarda-roupa. O mundo nota mas não comenta directamente. O estranhamento está na naturalidade com que o mundo aceita. A farda é o marcador visual que distingue Forasteiro de pessoa real sem texto explicativo.',
    reference: '→ O mágico é o que o mundo aceita sem questionar' },
  { id: id('f'), num: 4, title: 'Com a Mãe — silêncio momentâneo', color: '#15803d',
    text: 'Quando João está em paz com a mãe, os Forasteiros ficam em segundo plano — falam baixo, presença atenuada. Não é a mãe que os afasta: é o estado interior do João. A paz interior é a única forma de os regular. Funciona também como bengala dramática: quando os Forasteiros somem de uma cena com a mãe, o espectador sente a diferença.',
    reference: '' },
  { id: id('f'), num: 5, title: 'Sr. António — anomalia protegida', color: '#ea580c',
    text: 'O único adulto que reage diferente — não com susto nem negação, mas com reconhecimento. Câmara muito fechada na boca quando murmura. Não explicitar o que sabe antes do EP05. A anomalia trabalha lentamente ou não trabalha.',
    reference: '→ Deixar trabalhar. Não resolver cedo.' },
  { id: id('f'), num: 6, title: 'Nunca explicados ao espectador', color: '#6366f1',
    text: 'Não há flashback de origem. A série não diz "são a manifestação da PHDA." Isso seria terapia. Isto é ficção. O espectador que conhece PHDA reconhece. O espectador que não conhece vê uma série sobre crescer. Ambos têm razão. A palavra PHDA não aparece no diálogo.',
    reference: '' },
  { id: id('f'), num: 7, title: 'Os Forasteiros são partes do João — não rótulos', color: '#0369a1',
    text: 'Não dizem "sou a tua impulsividade." Têm nome. Têm fome. Têm opiniões sobre a comida da cantina. A decisão que os guiões EP01-02 já tomaram — são partes do João com autonomia, não diagnósticos com pernas — é a decisão certa. Regra de escrita: tira os Forasteiros e dá as falas ao João. Funciona quase sempre? Então as falas são certas.',
    reference: '' },
  { id: id('f'), num: 8, title: 'Mundo digital — os Forasteiros estão no feed', color: '#0891b2',
    text: 'Um adolescente de 16 anos em 2025 vive parte da vida em ecrã. Os Forasteiros não desaparecem quando o João abre o computador. Uma videochamada com um Forasteiro em frame. Uma aula online com os 4 em background. Estes momentos são gratuitos de produção e muito específicos da geração target.',
    reference: '→ Oportunidade por usar. Pelo menos uma cena digital por série.' },
]

// ══════════════════════════════════════════════════════════════════
// ARCOS POR EPISÓDIO
// ══════════════════════════════════════════════════════════════════

export const seedEpisodeArcs = [
  { id: id('ea'), epNum: 1, title: 'João tenta sobreviver ao primeiro dia', phase: 'Apresentação', phaseColor: '#15803d',
    desire: 'João quer → passar despercebido na escola nova',
    description: 'João. O seu mundo. Escola nova. A Lu. Trabalho de grupo que crashou. Sr. António na porta. No final — os 4 estão na sala. "Ai foda-se!" Atira a taça. Corre. Corte seco. Os Forasteiros tornam o despercebido impossível.',
    anchorScene: 'EP01_SC027 — "Corar por dentro que sobe até dar uma mini cegueira."',
    notes: '' },
  { id: id('ea'), epNum: 2, title: 'João tenta ter uma noite normal', phase: 'Choque', phaseColor: '#dc2626',
    desire: 'João quer → uma noite na casa do Rúben sem incidentes',
    description: 'João tenta ignorá-los. Eles não ignoram João. A escola acontece com eles. Eco visual POV tecto. "Cucu!" — aceitação mais relutante da história. João Pequeno levanta-se ferozmente. Os Forasteiros transformam uma noite normal numa noite impossível de esquecer.',
    anchorScene: 'Regra estabelecida: a câmara pode tomar o ponto de vista dos Forasteiros.',
    notes: '' },
  { id: id('ea'), epNum: 3, title: 'João tenta construir sistemas para os controlar', phase: 'Negação + Raiva', phaseColor: '#f97316',
    desire: 'João quer → provar que consegue funcionar sem eles',
    description: 'João cria regras, horários, acordos. Tudo falha de formas específicas e cómicas. O que João constrói diz mais sobre ele do que sobre eles. A raiva é legítima — as consequências acumulam-se. Ju vocaliza a raiva que João não consegue. O episódio mais físico da série. "Porquê a mim?" — a pergunta não tem resposta satisfatória. É essa a resposta.',
    anchorScene: 'Fusão necessária dos arcos Negação + Raiva da estrutura original de 10 eps.',
    notes: '' },
  { id: id('ea'), epNum: 4, title: 'João tenta salvar uma coisa que está a perder', phase: 'Twist', phaseColor: '#7c3aed',
    desire: 'João quer → manter uma relação que os Forasteiros estão a complicar',
    description: 'A aceitação social que João achava que tinha conquistado desmorona. Não por causa dos Forasteiros directamente — por causa do que o João faz (ou não faz) quando eles estão presentes. A Lu tem uma cena que não é sobre o João. Primeira fissura real na armadura. Twist: o problema não são eles. O problema é que o João não sabe quem é sem eles.',
    anchorScene: 'Momento para a Lu ter vida própria — ver questão aberta na room.',
    notes: '' },
  { id: id('ea'), epNum: 5, title: 'João tenta perceber se há saída', phase: 'Depressão + Teste', phaseColor: '#0369a1',
    desire: 'João quer → saber se é possível ser diferente',
    description: 'Sr. António começa a revelar algo. Não explica — muda a pergunta de João. Primeira fissura na resistência. João tenta novas abordagens — não para se livrar dos Forasteiros mas para perceber o que são. O episódio mais quieto. A depressão aqui não é tristeza clínica — é o momento antes de aceitar que não há atalho.',
    anchorScene: '⚑ Sr. António revela. Câmara fechada na boca quando murmura.',
    notes: '' },
  { id: id('ea'), epNum: 6, title: 'João aprende a viver desdobrado', phase: 'Aceitação — não cura', phaseColor: '#15803d',
    desire: 'João quer → saber quem é, com eles',
    description: 'Os Forasteiros não desaparecem. João não fica curado. Coexistência com consciência. Não é resolução feliz — é resolução honesta. No final ainda chove. Mas João leva guarda-chuva. A cena final é João e os 4, em silêncio ou em conversa, e pela primeira vez não é uma crise. É uma segunda-feira.',
    anchorScene: 'GGM: "ainda chove. Mas João leva guarda-chuva."',
    notes: '' },
]

// ══════════════════════════════════════════════════════════════════
// DECISÕES (WRITERS' ROOM)
// ══════════════════════════════════════════════════════════════════

export const seedDecisions = [
  {
    id: id('d'), title: 'O momento exacto do aparecimento', urgency: 'alta', status: 'open', chosenOption: null,
    createdAt: ts,
    description: 'A sinopse diz "um dia acorda e tem 4 pessoas à sua espera." Mas no EP01 a Ju já está sentada atrás do João na sala antes de qualquer "evento." Esta inconsistência vai aparecer logo que alguém leia os dois documentos juntos. Tem de ser resolvida no guião, não no documento de apresentação.',
    options: [
      { id: id('o'), label: 'Opção A', text: 'Sempre estiveram lá — o João é que começou a percebê-los. Gradual, invisível ao espectador. Mais perturbador.' },
      { id: id('o'), label: 'Opção B', text: 'Um evento específico no EP01 activa o aparecimento de todos ao mesmo tempo. Mais limpo dramaticamente.' },
      { id: id('o'), label: 'Opção C', text: 'Aparecem um a um ao longo dos EP01-02, cada um activado por um estado emocional diferente. Mais complexo, mais recompensador.' },
    ],
  },
  {
    id: id('d'), title: 'O pai — posição interna', urgency: 'alta', status: 'open', chosenOption: null,
    createdAt: ts,
    description: 'O documento diz "não se sabe do pai e não é conversa nunca." Mas isso é uma ferida. Se nunca vai ser conversa, porquê mencioná-lo? A room precisa de decidir: a ausência do pai contribuiu para o aparecimento dos Forasteiros? É a fissura por onde o João "vaza"?',
    options: [
      { id: id('o'), label: 'A ausência importa', text: 'Há pelo menos uma cena em que João menciona o pai sem o nomear. Os Forasteiros reagem de forma diferente. O Sr. António pode saber algo. Pode ser o arco da 2ª temporada.' },
      { id: id('o'), label: 'A ausência é textura', text: 'Não há cenas sobre o pai. A frase "não é conversa" é suficiente. Liberta espaço para outros arcos. Mas tem de ser uma decisão deliberada, não um esquecimento.' },
    ],
  },
  {
    id: id('d'), title: 'EP06 final: integração ou autonomia?', urgency: 'alta', status: 'open', chosenOption: null,
    createdAt: ts,
    description: 'No final da série, o João está mais perto dos Forasteiros ou mais longe? Esta não é uma questão de tom — é uma questão de premissa. Define o que é que a série está a dizer sobre neurodivergência, sobre crescer, sobre identidade.',
    options: [
      { id: id('o'), label: 'Integração', text: 'João aprende a trabalhar com eles. Os Forasteiros são parte de quem ele é — não inimigos, não fardos. A série diz: "és mais do que pensavas." Mais esperançoso. Mais próximo de Inside Out.' },
      { id: id('o'), label: 'Autonomia', text: 'João consegue funcionar apesar deles — não com eles. A série diz: "és capaz de escolher." Mais ambíguo. Deixa espaço para a 2ª temporada. Mais próximo de Bulgakov.' },
    ],
  },
  {
    id: id('d'), title: 'A Mãe — o que ela não consegue dar', urgency: 'média', status: 'open', chosenOption: null,
    createdAt: ts,
    description: 'A mãe é porto seguro — mas o porto seguro perfeito não é personagem, é cenário. Qual é a coisa que ela não consegue dar ao João que ele precisa? Pelo menos uma cena por série onde a mãe falha — não cruelmente, mas humanamente.',
    options: [
      { id: id('o'), label: 'Hipótese', text: 'A mãe não fala do pai por protecção — e o João sente esse silêncio como mentira, não como amor. Não precisa de resolver em 6 eps. Só precisa de existir numa cena.' },
    ],
  },
  {
    id: id('d'), title: 'O Sr. António — o que é que ele sabe?', urgency: 'média', status: 'open', chosenOption: null,
    createdAt: ts,
    description: '"Já viu crianças assim." Porquê? Esta pergunta não precisa de resposta pública — mas o actor precisa de a saber para jogar a cena. A room precisa para saber o que deixar em aberto.',
    options: [
      { id: id('o'), label: 'Hipótese A', text: 'Tem um filho assim. Cresceu. Correu bem ou mal — mas sabe o que é estar do lado de fora a olhar.' },
      { id: id('o'), label: 'Hipótese B', text: 'Foi assim. Os seus Forasteiros já desapareceram — ou aprendeu a conviver. É a prova viva de que é possível.' },
      { id: id('o'), label: 'Hipótese C', text: 'Viu um caso que correu mal. A urgência dele vem do medo, não da sabedoria. Mais perturbador.' },
    ],
  },
  {
    id: id('d'), title: 'A Lu — o que é que ela quer?', urgency: 'média', status: 'open', chosenOption: null,
    createdAt: ts,
    description: 'Nos EP01-02 a Lu existe para ajudar o João. É funcional mas não é personagem com desejo próprio. Qual é a coisa que a Lu quer que não tem nada a ver com o João? O que a assusta?',
    options: [
      { id: id('o'), label: 'Sugestão mínima', text: 'Uma cena por episódio onde a Lu está num momento que não é sobre o João. Pode ser 30 segundos. Estabelece que ela existe fora da relação. Muda tudo.' },
    ],
  },
]

// ══════════════════════════════════════════════════════════════════
// GLOSSÁRIO
// ══════════════════════════════════════════════════════════════════

export const seedGlossary = [
  { id: id('g'), term: 'Forasteiros', definition: 'As 4 figuras com farda, visíveis para toda a gente. São o João — os seus aspectos interiores com corpo, nome e farda.', category: 'Conceito' },
  { id: id('g'), term: 'Teoria do Diálogo', definition: 'Cada Forasteiro fala quando João está num estado emocional específico. Retira os Forasteiros e dá as falas ao João — funciona quase sempre.', category: 'Escrita' },
  { id: id('g'), term: 'A Farda', definition: 'Os 4 usam sempre a mesma roupa. O mundo nota mas não comenta. Um dos sinais de que são "diferentes" sem precisar de explicação verbal.', category: 'Visual' },
  { id: id('g'), term: 'Aparece por Corte', definition: 'Plano aberto — não estão. Detalhe. Abrimos — já falam. A magia está no corte, não num efeito especial. A regra de realização mais importante da série.', category: 'Realização' },
  { id: id('g'), term: 'Regra da Mãe', definition: 'Quando João está em paz com a Mãe, os Forasteiros ficam em segundo plano. Não é ela que os afasta — é o estado interior do João.', category: 'Conceito' },
  { id: id('g'), term: 'Anomalia', definition: 'Um momento onde o mundo reage diferente ao esperado. Sr. António é a anomalia mais consistente da série.', category: 'Conceito' },
  { id: id('g'), term: 'Corar por dentro', definition: '"Corar por dentro que sobe até dar uma mini cegueira." A frase mais importante da série. João a encontrar palavras para o que não tem palavras. EP01_SC027.', category: 'Diálogo' },
  { id: id('g'), term: 'Desdobrado', definition: 'Não está partido. Está desdobrado — em várias camadas visíveis ao mesmo tempo que o mundo vê mas não consegue dobrar de volta.', category: 'Conceito' },
  { id: id('g'), term: 'Porto Seguro', definition: 'A Mãe. Os momentos onde os Forasteiros se silenciam. Amor doméstico como linguagem — bolonhesa, não lasanha. Do pai nunca se fala.', category: 'Conceito' },
  { id: id('g'), term: 'Escola Nova', definition: 'João começou numa escola nova há pouco tempo. É tímido e reservado — poucos amigos conhecem a sua história. É aí que a série o encontra.', category: 'Contexto' },
  { id: id('g'), term: 'Integração', definition: 'Não é cura. É aprender a viver desdobrado com menos guerra e mais consciência. GGM: ainda chove. Mas João leva guarda-chuva.', category: 'Conceito' },
  { id: id('g'), term: 'Sr. António Sabe', definition: 'A frase mais importante que disse ficou murmurada. Câmara fechada na boca. Não explicitar antes do EP05.', category: 'Narrativa' },
]

// ══════════════════════════════════════════════════════════════════
// BIBLE (com secções)
// ══════════════════════════════════════════════════════════════════

export const seedBible = {
  logline: 'Um rapaz de 16 anos com PHDA viu as suas características interiores ganhar corpo, nome e farda — e o mundo inteiro tem de lidar com elas. João também.',
  genre: 'Série juvenil · realismo mágico',
  tone: 'Hiper-realista, estapafúrdio, com bleep cómico',
  themes: 'Identidade, neurodivergência, crescer, aceitação, família',
  text: `DESDOBRADO — 6 episódios × 25 min — RTP2 — Oeiras, escola pública, presente — Público: 13–19 anos

O QUE É ÚNICO:
Realismo mágico português. Não é uma série sobre PHDA — é uma série sobre crescer, desdobrada. A PHDA é a premissa mágica, não o diagnóstico.
Os Forasteiros são visíveis para todos. Não há twist. Não há "só João os vê". O mundo real aceita-os como aceita qualquer coisa estranha que não tem formulário de resposta.
A magia está no corte. Sem VFX. Aparecem por montagem. A televisão portuguesa não fez isto antes desta forma.

ESTRUTURA NARRATIVA:
Arco da série: ciclo de luto — João não está a fazer luto de algo que perdeu. Está a fazer luto de uma versão de si que acreditava ser a única.
Estrutura de episódio: cada episódio tem um gatilho externo (escola, casa, amigos) que activa um estado emocional. Esse estado determina quais Forasteiros dominam e como.
Resolução: não é cura. É coexistência com consciência. No final da série ainda chove. Mas João leva guarda-chuva.

PHDA COMO PREMISSA:
A série não diz "João tem PHDA". A palavra não aparece no diálogo. Os Forasteiros nunca se apresentam como "sou a tua impulsividade". São pessoas. Têm nome. Têm farda.
O espectador que conhece PHDA reconhece. O espectador que não conhece vê uma série sobre crescer. Ambos têm razão.`,
  sections: [
    {
      id: id('bs'), title: 'Tom & Voz — Regras de Escrita', order: 0,
      text: `1. Nunca nomear a PHDA — a palavra não aparece no diálogo.
2. Os Forasteiros não falam sobre si mesmos — não dizem "sou a tua impulsividade". Têm nome. Têm fome. Têm preferências.
3. A magia está no corte, nunca na câmara — plano aberto: não estão. Corte. Já estão. Sem efeito sonoro.
4. O que João não consegue dizer, um Forasteiro diz — se João conseguiria dizer directamente, dá a fala ao João.
5. Não resolver cedo — Sr. António não explica o que sabe antes do EP05. A integração é lenta.

TOM DA SÉRIE:
- Hiper-realista: situações reais ampliadas até ao absurdo reconhecível.
- Estapafúrdio: o inesperado que é inevitável em retrospectiva.
- O Bleep: os palavrões são bloqueados com bleep audível — propositado e claramente cómico.`,
    },
    {
      id: id('bs'), title: 'Influências — Bulgakov · García Márquez', order: 1,
      text: `BULGAKOV (O Mestre e Margarida):
O sobrenatural como dado banal. Woland aparece em Moscovo e ninguém o pode expulsar porque o sistema burocrático não tem formulário para isso. O que usamos: os Forasteiros não são explicados. Sr. António é o personagem mais bulgakoviano da série.

GARCÍA MÁRQUEZ (Cem Anos de Solidão):
O mágico como emoção tornada visível. Os mortos sentam-se à mesa. Não é fantasia — é o interior humano externalizado. O que usamos: os Forasteiros comem à mesa. Não é horror — é hábito.

A SÍNTESE — DESDOBRADO:
Bulgakov deu a regra: o sobrenatural não explica e não pede desculpa. GGM deu a temperatura: o mágico é afecto, não terror. O que NÃO usamos: nunca o modo "será que é real?". É real. A magia está no corte, nunca em VFX.`,
    },
    {
      id: id('bs'), title: 'Cenas de Referência — EP01-02', order: 2,
      text: `EP01_SC001 — João entra na escola nova. Reservado, com história que poucos conhecem.
EP01_SC027 — "Corar por dentro que sobe até dar uma mini cegueira." A frase mais importante da série.
EP01_FINAL — "Ai foda-se". João vê os 4 na sala. Atira a taça. A reacção é física antes de ser verbal.
EP01 — Sr. António — "O teste é dele." Câmara fechada na boca.
EP02 — POV tecto — "Cucu!" Eco visual. A câmara pode tomar o ponto de vista dos Forasteiros.
EP02 — Ruína do Rúben — João Pequeno levanta-se ferozmente. Protecção impulsiva sem aviso.`,
    },
    {
      id: id('bs'), title: 'Referências Visuais', order: 3,
      text: `- Atypical — Neurodivergência sem condescendência
- Euphoria — Tom estético audacioso para jovens
- Inside Out — Emoções com corpo — mas live action
- Being John Malkovich — O interior como espaço físico real`,
    },
  ],
}

// ══════════════════════════════════════════════════════════════════
// FUNÇÃO DE SEED — aplica tudo de uma vez
// ══════════════════════════════════════════════════════════════════

export function applySeed(store) {
  const {
    setUniverseChars,
    setUniverseRelations,
    setUniverseForces,
    setUniverseGlossary,
    setUniverseBible,
    setBibleSections,
    setUniverseEpisodeArcs,
    setUniverseDecisions,
  } = store

  setUniverseChars(seedChars)
  setUniverseRelations(seedRelations)
  setUniverseForces(seedForces)
  setUniverseGlossary(seedGlossary)
  setUniverseBible({
    logline: seedBible.logline,
    genre: seedBible.genre,
    tone: seedBible.tone,
    themes: seedBible.themes,
    text: seedBible.text,
  })
  setBibleSections(seedBible.sections)
  setUniverseEpisodeArcs(seedEpisodeArcs)
  setUniverseDecisions(seedDecisions)
}
