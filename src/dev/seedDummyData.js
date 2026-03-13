// ── Seed de Dados Dummy — dados realistas de produção audiovisual PT ──
// Uso: import { seedDummyData, resetProjectData } from './seedDummyData.js'
//       seedDummyData(useStore)  — popula tudo de uma vez via setState
//       resetProjectData(useStore) — limpa dados de projecto, mantém auth

const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

// ═══════════════════════════════════════════════════════════════════════
// EQUIPA (18 membros — crew + elenco, nomes portugueses)
// ═══════════════════════════════════════════════════════════════════════
const TEAM = [
  // ── Produção ──
  { id: `tm_${uid()}`, name: 'Mariana Lopes Cardoso', role: 'director_producao', group: 'Produção', phone: '+351 912 345 001', email: 'mariana.cardoso@frameflow.pt', photo: null, notes: 'Produtora com 15 anos de experiência em séries RTP e SIC', availability: 'available', cacheDiario: 35000, cacheTotal: 0, nif: '234567890', iban: 'PT50 0035 0345 0000 1234 5670 1', confirmedDays: [], agent: '', driveLinks: [] },
  { id: `tm_${uid()}`, name: 'Rui Mendes Ferreira', role: 'chefe_producao', group: 'Produção', phone: '+351 912 345 002', email: 'rui.ferreira@frameflow.pt', photo: null, notes: 'Ex-chefe de produção na SP Televisão', availability: 'available', cacheDiario: 25000, cacheTotal: 0, nif: '234567891', iban: 'PT50 0035 0345 0000 1234 5670 2', confirmedDays: [], agent: '', driveLinks: [] },
  { id: `tm_${uid()}`, name: 'Catarina Duarte', role: 'assistente_producao', group: 'Produção', phone: '+351 912 345 003', email: 'catarina.duarte@frameflow.pt', photo: null, notes: '', availability: 'available', cacheDiario: 12000, cacheTotal: 0, confirmedDays: [], driveLinks: [] },

  // ── Realização ──
  { id: `tm_${uid()}`, name: 'Gonçalo Vieira Branco', role: 'realizador', group: 'Realização', phone: '+351 912 345 004', email: 'goncalo.branco@frameflow.pt', photo: null, notes: 'Realizador premiado — Caminhos do Cinema Português 2024', availability: 'available', cacheDiario: 30000, cacheTotal: 0, nif: '234567893', iban: 'PT50 0035 0345 0000 1234 5670 4', confirmedDays: [], agent: '', driveLinks: [] },
  { id: `tm_${uid()}`, name: 'Sofia Martins Rocha', role: 'primeiro_ad', group: 'Realização', phone: '+351 912 345 005', email: 'sofia.rocha@frameflow.pt', photo: null, notes: '1ª AD veterana, trabalhou em 3 longas e 5 séries', availability: 'available', cacheDiario: 22000, cacheTotal: 0, confirmedDays: [], driveLinks: [] },
  { id: `tm_${uid()}`, name: 'Beatriz Nunes', role: 'anotadora', group: 'Realização', phone: '+351 912 345 006', email: 'beatriz.nunes@frameflow.pt', photo: null, notes: '', availability: 'available', cacheDiario: 15000, cacheTotal: 0, confirmedDays: [], driveLinks: [] },

  // ── Imagem ──
  { id: `tm_${uid()}`, name: 'Tiago Almeida Santos', role: 'dir_fotografia', group: 'Imagem', phone: '+351 912 345 007', email: 'tiago.santos@frameflow.pt', photo: null, notes: 'DP com experiência em Alexa Mini e RED V-Raptor. Estilo naturalista.', availability: 'available', cacheDiario: 28000, cacheTotal: 0, nif: '234567896', iban: 'PT50 0035 0345 0000 1234 5670 7', confirmedDays: [], agent: '', driveLinks: [] },
  { id: `tm_${uid()}`, name: 'André Costa Lima', role: 'operador_camara', group: 'Imagem', phone: '+351 912 345 008', email: 'andre.lima@frameflow.pt', photo: null, notes: 'Operador steadicam certificado', availability: 'available', cacheDiario: 18000, cacheTotal: 0, confirmedDays: [], driveLinks: [] },
  { id: `tm_${uid()}`, name: 'Francisca Ribeiro', role: 'primeiro_ac', group: 'Imagem', phone: '+351 912 345 009', email: 'francisca.ribeiro@frameflow.pt', photo: null, notes: '', availability: 'available', cacheDiario: 14000, cacheTotal: 0, confirmedDays: [], driveLinks: [] },

  // ── Som ──
  { id: `tm_${uid()}`, name: 'Miguel Soares Pinto', role: 'operador_som', group: 'Som', phone: '+351 912 345 010', email: 'miguel.pinto@frameflow.pt', photo: null, notes: 'Sound Devices 888 + Sennheiser MKH 50. Premiado melhor som no Curtas de Vila do Conde.', availability: 'available', cacheDiario: 20000, cacheTotal: 0, nif: '234567899', confirmedDays: [], driveLinks: [] },
  { id: `tm_${uid()}`, name: 'Inês Figueiredo', role: 'boom_operator', group: 'Som', phone: '+351 912 345 011', email: 'ines.figueiredo@frameflow.pt', photo: null, notes: '', availability: 'available', cacheDiario: 11000, cacheTotal: 0, confirmedDays: [], driveLinks: [] },

  // ── Arte ──
  { id: `tm_${uid()}`, name: 'Helena Tavares Monteiro', role: 'director_arte', group: 'Arte', phone: '+351 912 345 012', email: 'helena.monteiro@frameflow.pt', photo: null, notes: 'Directora de arte com background em arquitectura. Especialista em décors de época.', availability: 'available', cacheDiario: 22000, cacheTotal: 0, nif: '234567901', confirmedDays: [], driveLinks: [] },
  { id: `tm_${uid()}`, name: 'Luís Guerreiro', role: 'figurinista', group: 'Arte', phone: '+351 912 345 013', email: 'luis.guerreiro@frameflow.pt', photo: null, notes: 'Figurinista de "A Herança" (RTP) e "Sinais" (SIC)', availability: 'available', cacheDiario: 18000, cacheTotal: 0, confirmedDays: [], driveLinks: [] },

  // ── Elenco ──
  { id: `tm_${uid()}`, name: 'Diogo Vasconcelos', role: 'elenco_principal', group: 'Elenco', phone: '+351 912 345 014', email: 'diogo.vasconcelos@agent.pt', photo: null, notes: 'Protagonista — MIGUEL. Agente: Paula Reis (Creative Artists PT)', availability: 'available', characterName: 'MIGUEL', cacheDiario: 80000, cacheTotal: 0, nif: '234567903', iban: 'PT50 0035 0345 0000 1234 5671 4', confirmedDays: [], agent: 'Paula Reis — +351 916 000 001', driveLinks: [] },
  { id: `tm_${uid()}`, name: 'Carolina Ferraz Leitão', role: 'elenco_principal', group: 'Elenco', phone: '+351 912 345 015', email: 'carolina.leitao@agent.pt', photo: null, notes: 'CLARA — co-protagonista. Ex-Teatro Nacional D. Maria II.', availability: 'available', characterName: 'CLARA', cacheDiario: 70000, cacheTotal: 0, nif: '234567904', confirmedDays: [], agent: 'João Braga — +351 916 000 002', driveLinks: [] },
  { id: `tm_${uid()}`, name: 'Ricardo Magalhães', role: 'elenco_principal', group: 'Elenco', phone: '+351 912 345 016', email: 'ricardo.magalhaes@agent.pt', photo: null, notes: 'TOMÁS — antagonista. Conhecido de "Água de Mar" (TVI).', availability: 'available', characterName: 'TOMÁS', cacheDiario: 60000, cacheTotal: 0, confirmedDays: [], agent: 'Ana Matos — +351 916 000 003', driveLinks: [] },
  { id: `tm_${uid()}`, name: 'Marta Oliveira Cruz', role: 'elenco_sec_adulto', group: 'Elenco', phone: '+351 912 345 017', email: 'marta.cruz@email.pt', photo: null, notes: 'ROSA — mãe do Miguel. Actriz de teatro com 30 anos de carreira.', availability: 'available', characterName: 'ROSA', cacheDiario: 40000, cacheTotal: 0, confirmedDays: [], driveLinks: [] },
  { id: `tm_${uid()}`, name: 'João Pedro Esteves', role: 'elenco_sec_adulto', group: 'Elenco', phone: '+351 912 345 018', email: 'joao.esteves@email.pt', photo: null, notes: 'PADRE SILVA — secundário recorrente.', availability: 'available', characterName: 'PADRE SILVA', cacheDiario: 30000, cacheTotal: 0, confirmedDays: [], driveLinks: [] },
]

// ═══════════════════════════════════════════════════════════════════════
// LOCAIS (9 locais — Lisboa, Sintra, Cascais, Setúbal)
// ═══════════════════════════════════════════════════════════════════════
const LOCATIONS = [
  { id: `loc_${uid()}`, name: 'Apartamento Miguel', displayName: 'Apartamento Miguel — Graça', type: 'INT', status: 'confirmado', address: 'Rua da Graça 47, 3ºDto, 1170-165 Lisboa', lat: 38.7167, lng: -9.1310, contact: 'Sr. Armando Brites — +351 913 200 001', accessNotes: 'Estacionamento na Rua da Voz do Operário. Elevador avariado — 3º andar a pé.', notes: 'T2 com vista sobre Lisboa. Janelas grandes, boa luz natural da manhã. Pé direito alto.', photos: { before: [], scene: [], after: [] }, driveLinks: [], fromScript: true },
  { id: `loc_${uid()}`, name: 'Escritório Advocacia', displayName: 'Escritório Advocacia — Avenidas Novas', type: 'INT', status: 'confirmado', address: 'Av. da República 25, 5º, 1050-185 Lisboa', lat: 38.7372, lng: -9.1465, contact: 'Dra. Leonor Fonseca — +351 913 200 002', accessNotes: 'Portaria das 7h-22h. Senha de acesso: 4521#. Carga/descarga pela cave -2.', notes: 'Open space moderno com vidro. Necessário cobrir logos da empresa real.', photos: { before: [], scene: [], after: [] }, driveLinks: [], fromScript: true },
  { id: `loc_${uid()}`, name: 'Café Tertúlia', displayName: 'Café Tertúlia — Príncipe Real', type: 'INT/EXT', status: 'confirmado', address: 'Praça do Príncipe Real 18, 1250-184 Lisboa', lat: 38.7165, lng: -9.1505, contact: 'Gerente: Carlos Mendes — +351 913 200 003', accessNotes: 'Fecha terça-feira. Disponível para rodagem dom/seg 6h-14h. Esplanada incluída.', notes: 'Café com azulejos tradicionais, bancada em mármore. Cenário perfeito para cenas de diálogo.', photos: { before: [], scene: [], after: [] }, driveLinks: [], fromScript: true },
  { id: `loc_${uid()}`, name: 'Palácio Sintra', displayName: 'Palácio Abandonado — Serra de Sintra', type: 'INT/EXT', status: 'recce feito', address: 'Estrada da Pena, 2710-609 Sintra', lat: 38.7876, lng: -9.3906, contact: 'Câmara Municipal de Sintra — +351 219 238 500', accessNotes: 'Acesso por estrada de terra batida (500m). Sem electricidade — gerador necessário. Hospital mais próximo: 15min.', notes: 'Palacete do séc. XIX em ruínas. Vegetação selvagem no jardim. Atmosfera gótica ideal para cenas de mistério.', photos: { before: [], scene: [], after: [] }, driveLinks: [], fromScript: true },
  { id: `loc_${uid()}`, name: 'Praia do Guincho', displayName: 'Praia do Guincho — Cascais', type: 'EXT', status: 'autorização pendente', address: 'Praia do Guincho, 2750-642 Cascais', lat: 38.7305, lng: -9.4737, contact: 'Capitania de Cascais — +351 214 823 300', accessNotes: 'Autorização APA necessária com 30 dias. Vento forte frequente — protecção para câmara.', notes: 'Praia ampla com dunas e Serra ao fundo. Golden hour fantástica. Cenas MIGUEL/CLARA flashback.', photos: { before: [], scene: [], after: [] }, driveLinks: [], fromScript: true },
  { id: `loc_${uid()}`, name: 'Igreja São Roque', displayName: 'Igreja São Roque — Bairro Alto', type: 'INT', status: 'confirmado', address: 'Largo Trindade Coelho, 1200-470 Lisboa', lat: 38.7142, lng: -9.1448, contact: 'Padre António — +351 913 200 006', accessNotes: 'Rodagem permitida 2ª a 5ª, 9h-17h. Sem fumo artificial. Iluminação existente pode ser complementada.', notes: 'Interior barroco deslumbrante. Cenas do PADRE SILVA e funeral.', photos: { before: [], scene: [], after: [] }, driveLinks: [], fromScript: true },
  { id: `loc_${uid()}`, name: 'Armazém Alcântara', displayName: 'Armazém — Doca de Alcântara', type: 'INT', status: 'confirmado', address: 'Rua da Junqueira 11, Armazém 3, 1300-307 Lisboa', lat: 38.7030, lng: -9.1780, contact: 'Porto de Lisboa — +351 913 200 007', accessNotes: 'Acesso 24h com chave. Carga pesada pela porta lateral. Tecto 8m — rigs possíveis.', notes: 'Armazém industrial vazio, 400m². Ideal para cenas de confronto e sequências nocturnas. Bom para controlo de luz.', photos: { before: [], scene: [], after: [] }, driveLinks: [], fromScript: true },
  { id: `loc_${uid()}`, name: 'Miradouro Graça', displayName: 'Miradouro da Graça', type: 'EXT', status: 'recce feito', address: 'Largo da Graça, 1170-165 Lisboa', lat: 38.7190, lng: -9.1300, contact: 'CML Espaços Verdes — +351 913 200 008', accessNotes: 'Público — necessário vedação para rodagem. Melhor horário: 6h-8h (sem turistas). Noite possível com autorização PSP.', notes: 'Vista panorâmica sobre o Tejo e Castelo. Plano de abertura e cenas românticas.', photos: { before: [], scene: [], after: [] }, driveLinks: [], fromScript: true },
  { id: `loc_${uid()}`, name: 'Casa Avó Rosa', displayName: 'Casa da Avó — Setúbal', type: 'INT/EXT', status: 'autorização pendente', address: 'Travessa do Outeiro 8, 2900-312 Setúbal', lat: 38.5244, lng: -8.8882, contact: 'D. Fernanda Gomes — +351 913 200 009', accessNotes: 'Casa privada, proprietária vive no piso de baixo. Acesso pelo quintal para equipamento. Estacionamento na rua.', notes: 'Casa alentejana típica com quintal murado. Cozinha rústica autêntica. Cenas ROSA/MIGUEL infância.', photos: { before: [], scene: [], after: [] }, driveLinks: [], fromScript: true },
]

// ═══════════════════════════════════════════════════════════════════════
// DIAS DE RODAGEM (8 dias — hoje 13/03/2026 + a partir de 20/03/2026)
// ═══════════════════════════════════════════════════════════════════════
const SHOOTING_DAYS = [
  { id: `day_${uid()}`, date: '2026-03-13', label: 'D1', dayNumber: 1, episodeNumber: 1, dayInEpisode: 1, callTime: '07:30', status: 'filming', notes: 'EP01 — Exteriores escola + rua. Call time 7:30. Base camp Largo da Escola. Equipa completa.', catering: { time: '13:00', location: 'Base camp — Largo da Escola', menu: ['Sopa do dia', 'Frango grelhado c/ arroz', 'Salada mista', 'Fruta da época'], provider: 'Catering Lisboa Lda.' } },
  { id: `day_${uid()}`, date: '2026-03-20', label: 'D2', dayNumber: 2, episodeNumber: 1, dayInEpisode: 2, callTime: '07:00', status: 'planned', notes: 'Interiores — Cozinha + Mercearia + Casa Rúben. Equipa completa.', catering: { time: '12:30', location: 'Base camp — Largo da Graça', menu: ['Sopa de legumes', 'Bacalhau à Brás', 'Frango grelhado c/ arroz', 'Salada mista', 'Fruta da época'], provider: 'Catering Lisboa Lda.' } },
  { id: `day_${uid()}`, date: '2026-03-23', label: 'D3', dayNumber: 3, episodeNumber: 1, dayInEpisode: 3, callTime: '07:30', status: 'planned', notes: 'INT Escola + Biblioteca + Pátio tarde. Cenas EP01 SC008-SC016.', catering: { time: '13:00', location: 'Base camp — Escola', menu: ['Caldo verde', 'Arroz de pato', 'Bife grelhado', 'Legumes salteados'], provider: 'Catering Lisboa Lda.' } },
  { id: `day_${uid()}`, date: '2026-03-24', label: 'D4', dayNumber: 4, episodeNumber: 1, dayInEpisode: 4, callTime: '06:30', status: 'planned', notes: 'EXT Rua tarde + Porta Prédio + Jardim. EP01 SC013-SC022. Backup interior se chuva.', catering: { time: '12:00', location: 'Base camp — Rua', menu: ['Sanduíches variadas', 'Sopa quente', 'Fruta', 'Café e chá'], provider: 'Catering Lisboa Lda.' } },
  { id: `day_${uid()}`, date: '2026-03-25', label: 'D5', dayNumber: 5, episodeNumber: 2, dayInEpisode: 1, callTime: '08:00', status: 'planned', notes: 'EP02 — INT Escola (Sala Aula, Corredor, WC, Balneário, Ginásio). SC009-SC014.', catering: { time: '13:00', location: 'Base camp — Escola EP02', menu: ['Sopa', 'Arroz de frango', 'Salada Caesar', 'Sobremesa do dia'], provider: 'Sabores da Serra' } },
  { id: `day_${uid()}`, date: '2026-03-26', label: 'D6', dayNumber: 6, episodeNumber: 2, dayInEpisode: 2, callTime: '09:00', status: 'planned', notes: 'EP02 — EXT Rua + Esquina Pôr do Sol + INT Cozinha João. SC015-SC021.', catering: { time: '13:30', location: 'Base camp — Praça', menu: ['Sopa de grão', 'Polvo à lagareiro', 'Arroz de tomate', 'Salada'], provider: 'Catering Lisboa Lda.' } },
  { id: `day_${uid()}`, date: '2026-03-27', label: 'D7', dayNumber: 7, episodeNumber: 2, dayInEpisode: 3, callTime: '14:00', status: 'planned', notes: 'NOITE — EP02 INT Quarto João + Sala de Estar. SC022-SC024 + pickup madrugadas.', catering: { time: '19:00', location: 'Base camp — zona craft', menu: ['Jantar completo — ementa TBD'], provider: 'Catering Lisboa Lda.' } },
  { id: `day_${uid()}`, date: '2026-03-30', label: 'D8', dayNumber: 8, episodeNumber: 1, dayInEpisode: 5, callTime: '07:00', status: 'planned', notes: 'Pickup day — cenas em falta EP01 + EP02. Interiores cozinha + sala manhã + SC023-SC024 EP01.' },
]

// ═══════════════════════════════════════════════════════════════════════
// GUIÕES PARSED — real FDX data (EP01 — 24 cenas, EP02 — 24 cenas)
// Source: DESDOBRADO_EP_01.fdx + DESDOBRADO_EP_02.fdx
// ═══════════════════════════════════════════════════════════════════════
const PARSED_SCRIPTS = {
  EP01: {
    episode: 'EP01',
    title: 'O João',
    metadata: {
      characters: [
        { name: 'JOÃO', scenes: [1,2,3,4,5,6,7,8,9,10,11,12,14,15,16,17,18,19,20,21,22,24], lineCount: 176 },
        { name: 'LU', scenes: [3,4,5,6,7,8,10,11,14,15,16,20,21,22], lineCount: 112 },
        { name: 'MÃE', scenes: [1,2,18], lineCount: 24 },
        { name: 'RUBEN', scenes: [17,19,20], lineCount: 24 },
        { name: 'JÚLIO', scenes: [5,10], lineCount: 16 },
        { name: 'PROF', scenes: [6,9], lineCount: 16 },
        { name: 'SR ANTÓNIO', scenes: [4], lineCount: 8 },
        { name: 'FÁBIO', scenes: [7], lineCount: 8 },
        { name: 'ALUNO', scenes: [10], lineCount: 8 },
      ],
    },
    scenes: [
      { id: 'SC001', sceneNumber: 'SC001', heading: 'INT. COZINHA JOÃO. MANHÃ', intExt: 'INT', location: 'Cozinha João', timeOfDay: 'Manhã', summary: 'Vemos o João a servir leite numa taça de cereais, a comer a ver algo no telefone em cima da bancada. Vemos a mãe a passar e a tirar-lhe o telefone.', pageLength: 1.0, characters: ['JOÃO', 'MÃE'], cast: ['JOÃO', 'MÃE'], type: 'dialogue' },
      { id: 'SC002', sceneNumber: 'SC002', heading: 'INT. HALL PRÉDIO. DIA', intExt: 'INT', location: 'Hall Prédio', timeOfDay: 'Manhã', summary: 'Vemos o João a sair pela porta de casa e automaticamente a voltar para trás. Vemos o João a calçar-se e a sair enquanto a mãe grita lá uns degraus abaixo.', pageLength: 0.38, characters: ['MÃE', 'JOÃO'], cast: ['MÃE', 'JOÃO'], type: 'dialogue' },
      { id: 'SC003', sceneNumber: 'SC003', heading: 'EXT. RUA. MANHÃ', intExt: 'EXT', location: 'Rua', timeOfDay: 'Manhã', summary: 'O João sai de um carro e fica à espera. Está distraído com o telefone. Passados uns segundos vemos uma rapariga que se aproxima. Enquanto andam pela rua.', pageLength: 1.12, characters: ['JOÃO', 'LU'], cast: ['JOÃO', 'LU'], type: 'dialogue' },
      { id: 'SC004', sceneNumber: 'SC004', heading: 'EXT. PORTÃO ESCOLA. MANHÃ', intExt: 'EXT', location: 'Portão Escola', timeOfDay: 'Manhã', summary: 'Portão com guarita e regulamento afixado. Vemos vários alunos a entrar enquanto falam. Sr. António na guarita.', pageLength: 0.62, characters: ['LU', 'JOÃO', 'SR ANTÓNIO'], cast: ['LU', 'JOÃO', 'SR ANTÓNIO'], type: 'dialogue' },
      { id: 'SC005', sceneNumber: 'SC005', heading: 'EXT. PÁTIO DA ESCOLA. DIA', intExt: 'EXT', location: 'Pátio Da Escola', timeOfDay: 'Dia', summary: 'Recreio animado. Júlio aborda João e Lu com a sua energia habitual. Interacções de grupo.', pageLength: 1.0, characters: ['JÚLIO', 'JOÃO', 'LU'], cast: ['JÚLIO', 'JOÃO', 'LU'], type: 'dialogue' },
      { id: 'SC006', sceneNumber: 'SC006', heading: 'INT. SALA DE AULA. DIA', intExt: 'INT', location: 'Sala Aula', timeOfDay: 'Dia', summary: 'Aula com o Prof. Lu e João sentados próximos. Dinâmica de sala de aula, momentos de cumplicidade entre os dois.', pageLength: 1.12, characters: ['LU', 'JOÃO', 'PROF'], cast: ['LU', 'JOÃO', 'PROF'], type: 'dialogue' },
      { id: 'SC007', sceneNumber: 'SC007', heading: 'EXT. ESCOLA. DIA', intExt: 'EXT', location: 'Escola', timeOfDay: 'Dia', summary: 'Exterior escola, pausa entre aulas. João encontra Fábio e Lu. Tensão subtil.', pageLength: 0.62, characters: ['JOÃO', 'FÁBIO', 'LU'], cast: ['JOÃO', 'FÁBIO', 'LU'], type: 'dialogue' },
      { id: 'SC008', sceneNumber: 'SC008', heading: 'INT. BIBLIOTECA ESCOLA. DIA', intExt: 'INT', location: 'Biblioteca Escola', timeOfDay: 'Dia', summary: 'Lu e João na biblioteca. Momento mais íntimo — conversa mais honesta. Algo muda entre eles.', pageLength: 1.25, characters: ['LU', 'JOÃO'], cast: ['LU', 'JOÃO'], type: 'dialogue' },
      { id: 'SC009', sceneNumber: 'SC009', heading: 'INT. SALA DE AULA. DIA', intExt: 'INT', location: 'Sala De Aula', timeOfDay: 'Dia', summary: 'Professor chama João para falar. Conversa a sós — implicações para o percurso do João.', pageLength: 1.0, characters: ['PROF', 'JOÃO'], cast: ['PROF', 'JOÃO'], type: 'dialogue' },
      { id: 'SC010', sceneNumber: 'SC010', heading: 'EXT. PÁTIO ESCOLA. DIA', intExt: 'EXT', location: 'Pátio Escola', timeOfDay: 'Dia', summary: 'Cena de grupo alargado — Aluno, João, Júlio, Lu. Conflito ou jogo. Dinâmicas sociais da turma.', pageLength: 1.38, characters: ['ALUNO', 'JOÃO', 'JÚLIO', 'LU'], cast: ['ALUNO', 'JOÃO', 'JÚLIO', 'LU'], type: 'dialogue' },
      { id: 'SC011', sceneNumber: 'SC011', heading: 'EXT. PÁTIO ESCOLA. DIA', intExt: 'EXT', location: 'Pátio Escola', timeOfDay: 'Dia', summary: 'Lu e João a sós no pátio. Continuação da conversa anterior — mais privado.', pageLength: 1.0, characters: ['LU', 'JOÃO'], cast: ['LU', 'JOÃO'], type: 'dialogue' },
      { id: 'SC012', sceneNumber: 'SC012', heading: 'INT. MERCEARIA. TARDE', intExt: 'INT', location: 'Mercearia', timeOfDay: 'Tarde', summary: 'João na mercearia do bairro. Cena de personagem — observamos os seus hábitos.', pageLength: 0.5, characters: ['JOÃO'], cast: ['JOÃO'], type: 'action' },
      { id: 'SC013', sceneNumber: 'SC013', heading: 'EXT. RUA. TARDE', intExt: 'EXT', location: 'Rua', timeOfDay: 'Tarde', summary: 'João sozinho na rua. Transição — plano de personagem em movimento.', pageLength: 0.25, characters: [], cast: [], type: 'action' },
      { id: 'SC014', sceneNumber: 'SC014', heading: 'EXT. PORTA PRÉDIO. DIA', intExt: 'EXT', location: 'Porta Prédio', timeOfDay: 'Dia', summary: 'João e Lu à porta do prédio. Cena longa e importante — algo é revelado ou decidido.', pageLength: 1.62, characters: ['JOÃO', 'LU'], cast: ['JOÃO', 'LU'], type: 'dialogue' },
      { id: 'SC015', sceneNumber: 'SC015', heading: 'EXT. RUA. DIA', intExt: 'EXT', location: 'Rua', timeOfDay: 'Dia', summary: 'Lu e João a caminhar. Conversa breve — pós-revelação da cena anterior.', pageLength: 0.38, characters: ['LU', 'JOÃO'], cast: ['LU', 'JOÃO'], type: 'dialogue' },
      { id: 'SC016', sceneNumber: 'SC016', heading: 'EXT. RUA. TARDE', intExt: 'EXT', location: 'Rua', timeOfDay: 'Tarde', summary: 'João e Lu na rua ao fim da tarde. Cena central emocional — a mais longa do episódio (2p).', pageLength: 2.12, characters: ['JOÃO', 'LU'], cast: ['JOÃO', 'LU'], type: 'dialogue' },
      { id: 'SC017', sceneNumber: 'SC017', heading: 'INT. FIM DE DIA. DIA', intExt: 'INT', location: 'Fim De Dia', timeOfDay: 'Dia', summary: 'João e Ruben. Encontro de amigos — contexto do mundo do João fora da escola.', pageLength: 0.75, characters: ['JOÃO', 'RUBEN'], cast: ['JOÃO', 'RUBEN'], type: 'dialogue' },
      { id: 'SC018', sceneNumber: 'SC018', heading: 'INT. NOITE. DIA', intExt: 'INT', location: 'Noite', timeOfDay: 'Noite', summary: 'Mãe e João em casa à noite. Cena familiar — tensão ou ternura. Contexto doméstico.', pageLength: 0.75, characters: ['MÃE', 'JOÃO'], cast: ['MÃE', 'JOÃO'], type: 'dialogue' },
      { id: 'SC019', sceneNumber: 'SC019', heading: 'INT. CASA DO RÚBEN — PORTA. DIA', intExt: 'INT', location: 'Casa Do Rúben Porta', timeOfDay: 'Noite', summary: 'João chega a casa do Rúben. Cena curta de entrada.', pageLength: 0.38, characters: ['RUBEN', 'JOÃO'], cast: ['RUBEN', 'JOÃO'], type: 'dialogue' },
      { id: 'SC020', sceneNumber: 'SC020', heading: 'INT. CASA DO RÚBEN — SALA. DIA', intExt: 'INT', location: 'Casa Do Rúben Sala', timeOfDay: 'Noite', summary: 'João, Ruben e Lu na sala do Rúben. Grupo de amigos — dinâmica diferente do contexto escolar.', pageLength: 0.88, characters: ['RUBEN', 'JOÃO', 'LU'], cast: ['RUBEN', 'JOÃO', 'LU'], type: 'dialogue' },
      { id: 'SC021', sceneNumber: 'SC021', heading: 'EXT. RUA NOITE. DIA', intExt: 'EXT', location: 'Rua', timeOfDay: 'Noite', summary: 'João e Lu na rua à noite. Cena pequena mas significativa — pós-saída da casa do Rúben.', pageLength: 0.5, characters: ['JOÃO', 'LU'], cast: ['JOÃO', 'LU'], type: 'dialogue' },
      { id: 'SC022', sceneNumber: 'SC022', heading: 'EXT. JARDIM — BANCO DE JARDIM. DIA', intExt: 'EXT', location: 'Jardim Banco De Jardim', timeOfDay: 'Noite', summary: 'João e Lu num banco de jardim. Cena longa e emotiva — o momento de maior proximidade do episódio.', pageLength: 1.5, characters: ['JOÃO', 'LU'], cast: ['JOÃO', 'LU'], type: 'dialogue' },
      { id: 'SC023', sceneNumber: 'SC023', heading: 'INT. COZINHA. MANHÃ', intExt: 'INT', location: 'Cozinha', timeOfDay: 'Manhã', summary: 'Cena de manhã seguinte — atmosfera diferente. Transição visual para novo estado emocional.', pageLength: 0.25, characters: [], cast: [], type: 'action' },
      { id: 'SC024', sceneNumber: 'SC024', heading: 'INT. SALA. MANHÃ', intExt: 'INT', location: 'Sala', timeOfDay: 'Manhã', summary: 'João na sala de manhã. Cena final do episódio — setup do que vem a seguir.', pageLength: 0.38, characters: ['JOÃO'], cast: ['JOÃO'], type: 'action' },
    ],
  },
  EP02: {
    episode: 'EP02',
    title: 'A Lu',
    metadata: {
      characters: [
        { name: 'JOÃO', scenes: [4,5,6,7,8,9,10,11,12,13,14,15,16,18,19,20,21,23,24], lineCount: 152 },
        { name: 'CAS', scenes: [6,7,10,11,12,13,14,15,16,20,21,23,24], lineCount: 104 },
        { name: 'MATI', scenes: [5,6,10,11,12,14,15,16,19,20,21,23], lineCount: 96 },
        { name: 'PEQUENO', scenes: [11,12,14,15,18,20,21,23,24], lineCount: 72 },
        { name: 'JU', scenes: [6,11,12,15,21,23,24], lineCount: 56 },
        { name: 'LU', scenes: [12,16], lineCount: 16 },
        { name: 'MÃE', scenes: [18,20,21], lineCount: 24 },
        { name: 'SR. ANTÓNIO', scenes: [8], lineCount: 8 },
        { name: 'PROF', scenes: [10], lineCount: 8 },
        { name: 'JÚLIO', scenes: [11], lineCount: 8 },
        { name: 'PROF GINÁSTICA', scenes: [14], lineCount: 8 },
        { name: 'MAE LU', scenes: [16], lineCount: 8 },
        { name: 'JOÃO PEQUENO', scenes: [6,9,12], lineCount: 24 },
      ],
    },
    scenes: [
      { id: 'SC001', sceneNumber: 'SC001', heading: 'INT. MADRUGADA. DIA', intExt: 'INT', location: 'Madrugada', timeOfDay: 'Madrugada', summary: 'Cena de madrugada — atmosfera silenciosa. Estabelece o tom do episódio centrado na Lu.', pageLength: 0.25, characters: [], cast: [], type: 'action' },
      { id: 'SC002', sceneNumber: 'SC002', heading: 'INT. MADRUGADA. DIA', intExt: 'INT', location: 'Madrugada', timeOfDay: 'Madrugada', summary: 'Segunda cena de madrugada — continuação da atmosfera de véspera.', pageLength: 0.25, characters: [], cast: [], type: 'action' },
      { id: 'SC003', sceneNumber: 'SC003', heading: 'INT. COZINHA. MANHÃ', intExt: 'INT', location: 'Cozinha', timeOfDay: 'Manhã', summary: 'Cena de manhã silenciosa — rotina doméstica que revela estado emocional.', pageLength: 0.25, characters: [], cast: [], type: 'action' },
      { id: 'SC004', sceneNumber: 'SC004', heading: 'INT. SALA. MANHÃ', intExt: 'INT', location: 'Sala', timeOfDay: 'Manhã', summary: 'João na sala de manhã — ponto de partida do episódio antes de sair.', pageLength: 0.38, characters: ['JOÃO'], cast: ['JOÃO'], type: 'action' },
      { id: 'SC005', sceneNumber: 'SC005', heading: 'INT. PORTA DA RUA. MANHÃ', intExt: 'INT', location: 'Porta Da Rua', timeOfDay: 'Manhã', summary: 'Mati e João à porta da rua. Combinações para o dia — energia de amizade masculina.', pageLength: 0.88, characters: ['MATI', 'JOÃO'], cast: ['MATI', 'JOÃO'], type: 'dialogue' },
      { id: 'SC006', sceneNumber: 'SC006', heading: 'EXT. PRÉDIO. MANHÃ', intExt: 'EXT', location: 'Prédio', timeOfDay: 'Manhã', summary: 'Grupo à frente do prédio — João Pequeno, Ju, Cas, João e Mati. Energia de bando, preparação para a escola.', pageLength: 0.88, characters: ['JOÃO PEQUENO', 'JU', 'CAS', 'JOÃO', 'MATI'], cast: ['JOÃO PEQUENO', 'JU', 'CAS', 'JOÃO', 'MATI'], type: 'dialogue' },
      { id: 'SC007', sceneNumber: 'SC007', heading: 'EXT. JARDIM. MANHÃ', intExt: 'EXT', location: 'Jardim', timeOfDay: 'Manhã', summary: 'João e Cas no jardim — conversa a dois antes das aulas. Relação de amizade próxima.', pageLength: 1.0, characters: ['JOÃO', 'CAS'], cast: ['JOÃO', 'CAS'], type: 'dialogue' },
      { id: 'SC008', sceneNumber: 'SC008', heading: 'EXT. PORTÃO ESCOLA. MANHÃ', intExt: 'EXT', location: 'Portão Escola', timeOfDay: 'Manhã', summary: 'Sr. António e João no portão. Encontro recorrente — desta vez com dinâmica diferente.', pageLength: 0.88, characters: ['SR. ANTÓNIO', 'JOÃO'], cast: ['SR. ANTÓNIO', 'JOÃO'], type: 'dialogue' },
      { id: 'SC009', sceneNumber: 'SC009', heading: 'INT. CORREDOR ESCOLA. DIA', intExt: 'INT', location: 'Corredor Escola', timeOfDay: 'Dia', summary: 'João e João Pequeno no corredor. Interacção entre os dois — João mais novo observa o mais velho.', pageLength: 0.5, characters: ['JOÃO', 'JOÃO PEQUENO'], cast: ['JOÃO', 'JOÃO PEQUENO'], type: 'dialogue' },
      { id: 'SC010', sceneNumber: 'SC010', heading: 'INT. SALA AULA. DIA', intExt: 'INT', location: 'Sala Aula', timeOfDay: 'Dia', summary: 'Cena de sala de aula alargada — João, Prof, Mati, Cas, Ruben. Cena mais longa (2p), conflito ou acontecimento importante.', pageLength: 2.0, characters: ['JOÃO', 'PROF', 'MATI', 'CAS', 'RUBEN'], cast: ['JOÃO', 'PROF', 'MATI', 'CAS', 'RUBEN'], type: 'dialogue' },
      { id: 'SC011', sceneNumber: 'SC011', heading: 'INT. CORREDOR ESCOLA. DIA', intExt: 'INT', location: 'Corredor Escola', timeOfDay: 'Dia', summary: 'Corredor lotado — João, Cas, Júlio, Random, Pequeno, Mati, Ju. Pós-aula, tensão ou agitação.', pageLength: 1.12, characters: ['JOÃO', 'CAS', 'JÚLIO', 'PEQUENO', 'MATI', 'JU'], cast: ['JOÃO', 'CAS', 'JÚLIO', 'PEQUENO', 'MATI', 'JU'], type: 'dialogue' },
      { id: 'SC012', sceneNumber: 'SC012', heading: 'INT. WC ESCOLA. DIA', intExt: 'INT', location: 'Wc Escola', timeOfDay: 'Dia', summary: 'Cena importante no WC da escola — João, Lu, Ju, Cas, João Pequeno, Mati, Pequeno. Grande grupo, cena de 2.25p — conflito central do episódio.', pageLength: 2.25, characters: ['JOÃO', 'LU', 'JU', 'CAS', 'JOÃO PEQUENO', 'MATI', 'PEQUENO'], cast: ['JOÃO', 'LU', 'JU', 'CAS', 'JOÃO PEQUENO', 'MATI', 'PEQUENO'], type: 'dialogue' },
      { id: 'SC013', sceneNumber: 'SC013', heading: 'INT. BALNEÁRIO. DIA', intExt: 'INT', location: 'Balneário', timeOfDay: 'Dia', summary: 'João e Cas no balneário. Conversa pós-conflito — mais íntima, a dois.', pageLength: 0.38, characters: ['JOÃO', 'CAS'], cast: ['JOÃO', 'CAS'], type: 'dialogue' },
      { id: 'SC014', sceneNumber: 'SC014', heading: 'INT. GINÁSIO. DIA', intExt: 'INT', location: 'Ginásio', timeOfDay: 'Dia', summary: 'Aula de ginástica — Prof Ginástica, João, Pequeno, Cas, Mati. Acção física, dinâmicas de grupo no desporto.', pageLength: 1.38, characters: ['PROF GINÁSTICA', 'JOÃO', 'PEQUENO', 'CAS', 'MATI'], cast: ['PROF GINÁSTICA', 'JOÃO', 'PEQUENO', 'CAS', 'MATI'], type: 'action' },
      { id: 'SC015', sceneNumber: 'SC015', heading: 'EXT. RUA. DIA', intExt: 'EXT', location: 'Rua', timeOfDay: 'Dia', summary: 'Grupo alargado na rua pós-escola — João, Cas, Pequeno, Mati, Ju. Energia de fim de dia escolar.', pageLength: 1.38, characters: ['JOÃO', 'CAS', 'PEQUENO', 'MATI', 'JU'], cast: ['JOÃO', 'CAS', 'PEQUENO', 'MATI', 'JU'], type: 'dialogue' },
      { id: 'SC016', sceneNumber: 'SC016', heading: 'EXT. ESQUINA PÔR DO SOL. DIA', intExt: 'EXT', location: 'Esquina Por Do Sol', timeOfDay: 'Pôr do Sol', summary: 'Lu, João, Mãe da Lu, Cas, Mati ao pôr do sol numa esquina. Encontro de mundos — família e amigos. Cena emotiva de 1.25p.', pageLength: 1.25, characters: ['LU', 'JOÃO', 'MAE LU', 'CAS', 'MATI'], cast: ['LU', 'JOÃO', 'MAE LU', 'CAS', 'MATI'], type: 'dialogue' },
      { id: 'SC017', sceneNumber: 'SC017', heading: 'INT. PORTA DE CASA JOÃO. DIA', intExt: 'INT', location: 'Porta De Casa João', timeOfDay: 'Noite', summary: 'João à porta de casa — regresso. Cena flash de transição.', pageLength: 0.12, characters: [], cast: [], type: 'action' },
      { id: 'SC018', sceneNumber: 'SC018', heading: 'INT. COZINHA JOÃO. DIA', intExt: 'INT', location: 'Cozinha João', timeOfDay: 'Noite', summary: 'Mãe, João e Pequeno na cozinha de noite. Atmosfera familiar, o Pequeno presente muda a dinâmica.', pageLength: 0.75, characters: ['MÃE', 'JOÃO', 'PEQUENO'], cast: ['MÃE', 'JOÃO', 'PEQUENO'], type: 'dialogue' },
      { id: 'SC019', sceneNumber: 'SC019', heading: 'INT. COZINHA. DIA', intExt: 'INT', location: 'Cozinha', timeOfDay: 'Noite', summary: 'João e Mati na cozinha — conversa a dois, tom de intimidade.', pageLength: 0.25, characters: ['JOÃO', 'MATI'], cast: ['JOÃO', 'MATI'], type: 'dialogue' },
      { id: 'SC020', sceneNumber: 'SC020', heading: 'INT. COZINHA. DIA', intExt: 'INT', location: 'Cozinha', timeOfDay: 'Noite', summary: 'João, Mãe, Cas e Mati na cozinha. Cena de grupo doméstico — dinâmica da "família alargada" do João.', pageLength: 1.0, characters: ['JOÃO', 'MÃE', 'CAS', 'MATI'], cast: ['JOÃO', 'MÃE', 'CAS', 'MATI'], type: 'dialogue' },
      { id: 'SC021', sceneNumber: 'SC021', heading: 'INT. COZINHA. DIA', intExt: 'INT', location: 'Cozinha', timeOfDay: 'Noite', summary: 'Cena de grupo completo na cozinha — João, Mãe, Cas, Pequeno, Mati, Ju. A maior cena doméstica do episódio (1.75p).', pageLength: 1.75, characters: ['JOÃO', 'MÃE', 'CAS', 'PEQUENO', 'MATI', 'JU'], cast: ['JOÃO', 'MÃE', 'CAS', 'PEQUENO', 'MATI', 'JU'], type: 'dialogue' },
      { id: 'SC022', sceneNumber: 'SC022', heading: 'INT. SALA DE ESTAR. DIA', intExt: 'INT', location: 'Sala De Estar', timeOfDay: 'Noite', summary: 'Sala de estar — transição silenciosa. Momento de pausa antes da cena final.', pageLength: 0.12, characters: [], cast: [], type: 'action' },
      { id: 'SC023', sceneNumber: 'SC023', heading: 'INT. QUARTO JOÃO. DIA', intExt: 'INT', location: 'Quarto João', timeOfDay: 'Noite', summary: 'Cas, Pequeno, Mati, João e Ju no quarto do João — grupo de amigos íntimos, noite de convívio.', pageLength: 1.0, characters: ['CAS', 'PEQUENO', 'MATI', 'JOÃO', 'JU'], cast: ['CAS', 'PEQUENO', 'MATI', 'JOÃO', 'JU'], type: 'dialogue' },
      { id: 'SC024', sceneNumber: 'SC024', heading: 'INT. QUARTO JOÃO. AMANHECER', intExt: 'INT', location: 'Quarto João', timeOfDay: 'Amanhecer', summary: 'Cas, João, Pequeno e Ju ao amanhecer. Cena final do episódio — noite virou dia, algo mudou.', pageLength: 0.25, characters: ['CAS', 'JOÃO', 'PEQUENO', 'JU'], cast: ['CAS', 'JOÃO', 'PEQUENO', 'JU'], type: 'action' },
    ],
  },
}

// ═══════════════════════════════════════════════════════════════════════
// ATRIBUIÇÕES DE CENAS → DIAS
// ═══════════════════════════════════════════════════════════════════════
function buildSceneAssignments(days) {
  // days[0]=D1 Hoje 13/03, days[1]=D2 20/03, days[2]=D3 23/03, days[3]=D4 24/03,
  // days[4]=D5 25/03, days[5]=D6 26/03, days[6]=D7 27/03, days[7]=D8 30/03
  const d = days.map(d => d.id)
  return {
    // EP01 — D1 Hoje: Exteriores escola + rua manhã
    'EP01-SC001': d[0],  // D1 Hoje — Cozinha João (INT manhã)
    'EP01-SC002': d[0],  // D1 Hoje — Hall Prédio (INT)
    'EP01-SC003': d[0],  // D1 Hoje — Rua (EXT manhã)
    'EP01-SC004': d[0],  // D1 Hoje — Portão Escola (EXT)
    'EP01-SC005': d[0],  // D1 Hoje — Pátio Escola (EXT)
    'EP01-SC006': d[0],  // D1 Hoje — Sala Aula (INT)
    // EP01 — D2: Interior escola continuação
    'EP01-SC007': d[1],  // D2 — Exterior Escola
    'EP01-SC008': d[1],  // D2 — Biblioteca Escola
    'EP01-SC009': d[1],  // D2 — Sala de Aula (prof/joão)
    'EP01-SC010': d[1],  // D2 — Pátio Escola grupo
    'EP01-SC011': d[1],  // D2 — Pátio a dois
    // EP01 — D3: Exteriores bairro + noite
    'EP01-SC012': d[2],  // D3 — Mercearia
    'EP01-SC013': d[2],  // D3 — Rua tarde
    'EP01-SC014': d[2],  // D3 — Porta Prédio
    'EP01-SC015': d[2],  // D3 — Rua dia
    'EP01-SC016': d[2],  // D3 — Rua tarde (cena central)
    'EP01-SC017': d[2],  // D3 — Fim de dia
    'EP01-SC018': d[2],  // D3 — Noite casa
    'EP01-SC019': d[2],  // D3 — Casa Rúben porta
    'EP01-SC020': d[2],  // D3 — Casa Rúben sala
    'EP01-SC021': d[2],  // D3 — Rua noite
    'EP01-SC022': d[2],  // D3 — Jardim banco
    // EP01 — D8 Pickup: Cenas manhã restantes
    'EP01-SC023': d[7],  // D8 — Cozinha manhã
    'EP01-SC024': d[7],  // D8 — Sala manhã
    // EP02 — D4: Exteriores manhã + portão
    'EP02-SC001': d[7],  // D8 — Madrugada (pickup)
    'EP02-SC002': d[7],  // D8 — Madrugada (pickup)
    'EP02-SC003': d[7],  // D8 — Cozinha manhã
    'EP02-SC004': d[3],  // D4 — Sala manhã
    'EP02-SC005': d[3],  // D4 — Porta da Rua
    'EP02-SC006': d[3],  // D4 — Prédio exterior
    'EP02-SC007': d[3],  // D4 — Jardim manhã
    'EP02-SC008': d[3],  // D4 — Portão Escola
    // EP02 — D5: Interior escola
    'EP02-SC009': d[4],  // D5 — Corredor Escola
    'EP02-SC010': d[4],  // D5 — Sala Aula
    'EP02-SC011': d[4],  // D5 — Corredor grupo
    'EP02-SC012': d[4],  // D5 — WC Escola (cena central)
    'EP02-SC013': d[4],  // D5 — Balneário
    'EP02-SC014': d[4],  // D5 — Ginásio
    // EP02 — D6: Exteriores tarde + noite
    'EP02-SC015': d[5],  // D6 — Rua dia grupo
    'EP02-SC016': d[5],  // D6 — Esquina pôr do sol
    'EP02-SC017': d[5],  // D6 — Porta de casa
    'EP02-SC018': d[5],  // D6 — Cozinha João noite
    'EP02-SC019': d[5],  // D6 — Cozinha (João/Mati)
    'EP02-SC020': d[5],  // D6 — Cozinha grupo
    'EP02-SC021': d[5],  // D6 — Cozinha completo
    // EP02 — D7: Noite/amanhecer quarto
    'EP02-SC022': d[6],  // D7 — Sala de estar
    'EP02-SC023': d[6],  // D7 — Quarto João
    'EP02-SC024': d[6],  // D7 — Quarto amanhecer (final ep02)
  }
}

// ═══════════════════════════════════════════════════════════════════════
// ORÇAMENTO (1 orçamento profissional com linhas reais)
// ═══════════════════════════════════════════════════════════════════════
function buildBudget() {
  const budgetId = `bud_${uid()}`
  return {
    id: budgetId,
    header: {
      campanha: 'DESDOBRADO — Série Original (6 Episódios)',
      descricao: 'Série de ficção para plataforma de streaming, 6 episódios × 50 min. Produção de autor com elenco de primeiro plano.',
      local: 'Lisboa / Sintra / Cascais / Setúbal',
      diasRodagem: 18,
      agencia: '',
      cliente: 'StreamPT',
      realizador: 'Gonçalo Vieira Branco',
      produtora: 'FrameFlow Productions',
    },
    mode: 'fiction',
    status: 'approved',
    lines: [
      // Cat 1 — Acima da Linha (Direitos, Guião)
      { id: `bl_${uid()}`, categoria: 1, descricao: 'Direitos de adaptação do romance', valorUnitario: 1500000, quantidade: 1, dias: 1, custoReal: 1500000, markup: 0, taxaIva: 0.23, fixo: true, origem: 'manual' },
      { id: `bl_${uid()}`, categoria: 1, descricao: 'Guionista — 6 episódios', valorUnitario: 800000, quantidade: 1, dias: 1, custoReal: 800000, markup: 0, taxaIva: 0.23, fixo: true, origem: 'manual' },
      // Cat 2 — Elenco
      { id: `bl_${uid()}`, categoria: 2, descricao: 'Elenco principal — Miguel (18 dias)', valorUnitario: 80000, quantidade: 1, dias: 18, custoReal: 1440000, markup: 0, taxaIva: 0.23, origem: 'team-sync' },
      { id: `bl_${uid()}`, categoria: 2, descricao: 'Elenco principal — Clara (15 dias)', valorUnitario: 70000, quantidade: 1, dias: 15, custoReal: 1050000, markup: 0, taxaIva: 0.23, origem: 'team-sync' },
      { id: `bl_${uid()}`, categoria: 2, descricao: 'Elenco principal — Tomás (10 dias)', valorUnitario: 60000, quantidade: 1, dias: 10, custoReal: 600000, markup: 0, taxaIva: 0.23, origem: 'team-sync' },
      { id: `bl_${uid()}`, categoria: 2, descricao: 'Elenco secundário (Rosa, Padre Silva, Det. Sousa)', valorUnitario: 35000, quantidade: 3, dias: 6, custoReal: 630000, markup: 0, taxaIva: 0.23, origem: 'manual' },
      { id: `bl_${uid()}`, categoria: 2, descricao: 'Figuração (8 figurantes × 6 dias)', valorUnitario: 8000, quantidade: 8, dias: 6, custoReal: 384000, markup: 0, taxaIva: 0.23, origem: 'manual' },
      // Cat 3 — Equipa Técnica
      { id: `bl_${uid()}`, categoria: 3, descricao: 'Realizador', valorUnitario: 30000, quantidade: 1, dias: 18, custoReal: 540000, markup: 0, taxaIva: 0.23, origem: 'team-sync' },
      { id: `bl_${uid()}`, categoria: 3, descricao: 'Directora de Produção', valorUnitario: 35000, quantidade: 1, dias: 25, custoReal: 875000, markup: 0, taxaIva: 0.23, origem: 'team-sync' },
      { id: `bl_${uid()}`, categoria: 3, descricao: 'Director de Fotografia', valorUnitario: 28000, quantidade: 1, dias: 18, custoReal: 504000, markup: 0, taxaIva: 0.23, origem: 'team-sync' },
      { id: `bl_${uid()}`, categoria: 3, descricao: 'Equipa técnica (12 membros)', valorUnitario: 15000, quantidade: 12, dias: 18, custoReal: 3240000, markup: 0, taxaIva: 0.23, origem: 'manual' },
      // Cat 4 — Equipamento
      { id: `bl_${uid()}`, categoria: 4, descricao: 'Kit câmara ARRI Alexa Mini LF + ópticas Cooke', valorUnitario: 150000, quantidade: 1, dias: 18, custoReal: 2700000, markup: 0.10, taxaIva: 0.23, origem: 'manual' },
      { id: `bl_${uid()}`, categoria: 4, descricao: 'Kit iluminação (HMI 4kW + ARRI SkyPanel)', valorUnitario: 50000, quantidade: 1, dias: 18, custoReal: 900000, markup: 0.10, taxaIva: 0.23, origem: 'manual' },
      { id: `bl_${uid()}`, categoria: 4, descricao: 'Kit som (Sound Devices 888 + microfones)', valorUnitario: 25000, quantidade: 1, dias: 18, custoReal: 450000, markup: 0, taxaIva: 0.23, origem: 'manual' },
      { id: `bl_${uid()}`, categoria: 4, descricao: 'Drone DJI Inspire 3 + operador', valorUnitario: 80000, quantidade: 1, dias: 4, custoReal: 320000, markup: 0, taxaIva: 0.23, origem: 'manual' },
      // Cat 5 — Cenografia / Arte
      { id: `bl_${uid()}`, categoria: 5, descricao: 'Decoração — Apt Miguel + Escritório', valorUnitario: 350000, quantidade: 1, dias: 1, custoReal: 350000, markup: 0.15, taxaIva: 0.23, fixo: true, origem: 'manual' },
      { id: `bl_${uid()}`, categoria: 5, descricao: 'Adereços de cena (lote completo)', valorUnitario: 120000, quantidade: 1, dias: 1, custoReal: 120000, markup: 0, taxaIva: 0.23, fixo: true, origem: 'manual' },
      { id: `bl_${uid()}`, categoria: 5, descricao: 'Guarda-roupa elenco principal', valorUnitario: 200000, quantidade: 1, dias: 1, custoReal: 200000, markup: 0, taxaIva: 0.23, fixo: true, origem: 'manual' },
      // Cat 7 — Transportes
      { id: `bl_${uid()}`, categoria: 7, descricao: 'Carrinha produção + combustível (18 dias)', valorUnitario: 15000, quantidade: 2, dias: 18, custoReal: 540000, markup: 0, taxaIva: 0.23, origem: 'manual' },
      { id: `bl_${uid()}`, categoria: 7, descricao: 'Transporte elenco (transfers)', valorUnitario: 10000, quantidade: 1, dias: 18, custoReal: 180000, markup: 0, taxaIva: 0.23, origem: 'manual' },
      // Cat 8 — Alimentação
      { id: `bl_${uid()}`, categoria: 8, descricao: 'Catering rodagem (25 pax × 18 dias)', valorUnitario: 2500, quantidade: 25, dias: 18, custoReal: 1125000, markup: 0, taxaIva: 0.23, origem: 'manual' },
      // Cat 10 — Pós-Produção
      { id: `bl_${uid()}`, categoria: 10, descricao: 'Montagem — 6 episódios (12 semanas)', valorUnitario: 500000, quantidade: 1, dias: 1, custoReal: 500000, markup: 0, taxaIva: 0.23, fixo: true, origem: 'manual' },
      { id: `bl_${uid()}`, categoria: 10, descricao: 'Colorização DaVinci Resolve', valorUnitario: 200000, quantidade: 1, dias: 1, custoReal: 200000, markup: 0, taxaIva: 0.23, fixo: true, origem: 'manual' },
      { id: `bl_${uid()}`, categoria: 10, descricao: 'Sound design + mix 5.1', valorUnitario: 250000, quantidade: 1, dias: 1, custoReal: 250000, markup: 0, taxaIva: 0.23, fixo: true, origem: 'manual' },
      { id: `bl_${uid()}`, categoria: 10, descricao: 'VFX (40 planos)', valorUnitario: 300000, quantidade: 1, dias: 1, custoReal: 300000, markup: 0, taxaIva: 0.23, fixo: true, origem: 'manual' },
      // Cat 11 — Seguros
      { id: `bl_${uid()}`, categoria: 11, descricao: 'Seguro de produção all-risk', valorUnitario: 350000, quantidade: 1, dias: 1, custoReal: 350000, markup: 0, taxaIva: 0.23, fixo: true, origem: 'manual' },
      // Cat 12 — Despesas Gerais
      { id: `bl_${uid()}`, categoria: 12, descricao: 'Contingência (5% do orçamento)', valorUnitario: 100000, quantidade: 1, dias: 1, custoReal: 100000, markup: 0, taxaIva: 0, fixo: true, origem: 'manual' },
    ],
    financing: [
      { id: `fin_${uid()}`, nome: 'ICA — Apoio à Produção', tipo: 'subsídio', valor: 500000000, confirmado: true, notas: 'Concurso Séries Ficção 2026 — resultado Fev.2026' },
      { id: `fin_${uid()}`, nome: 'StreamPT — Coprodução', tipo: 'cash', valor: 800000000, confirmado: true, notas: 'Contrato assinado. 50% upfront, 50% entrega.' },
      { id: `fin_${uid()}`, nome: 'RTP — Pré-compra', tipo: 'cash', valor: 200000000, confirmado: false, notas: 'Em negociação — janela de emissão 2027.' },
    ],
    createdAt: '2026-02-15T10:30:00.000Z',
    updatedAt: '2026-03-10T16:45:00.000Z',
  }
}

// ═══════════════════════════════════════════════════════════════════════
// UNIVERSO (personagens, bible, forças)
// ═══════════════════════════════════════════════════════════════════════
const UNIVERSE = {
  chars: [
    { id: `char_${uid()}`, name: 'MIGUEL', arcType: 'protagonist', group: 'Família Mendes', description: 'Arquitecto de 35 anos que regressa a Lisboa após a morte do pai. Dividido entre a culpa de ter partido e a necessidade de descobrir a verdade.', notes: 'Sempre de camisa com mangas arregaçadas. Fumador em recuperação — isqueiro no bolso como talismã.', x: 400, y: 300, photo: null, age: '35', occupation: 'Arquitecto', backstory: 'Saiu de Portugal aos 22 após uma discussão violenta com o pai. Viveu em Berlim 13 anos. Regressou há 3 meses.', arc: 'Da fuga à confrontação. Aprende que a verdade familiar é mais complexa do que o preto e branco que imaginava.', traits: ['reservado', 'observador', 'teimoso', 'leal'], scale: 'centro', voice: { when: 'Fala em frases curtas e directas', what: 'Evita falar de emoções, usa metáforas de arquitectura', example: '"Esta família é como um prédio com fundações podres. Não se repara por fora."' } },
    { id: `char_${uid()}`, name: 'CLARA', arcType: 'co-protagonist', group: 'Família Mendes', description: 'Jornalista de investigação, ex-mulher de Miguel. Inteligente, obstinada, com um sentido de justiça inabalável.', notes: 'Visual prático mas elegante. Sempre com bloco de notas e caneta. Bebe café preto obsessivamente.', x: 520, y: 250, photo: null, age: '33', occupation: 'Jornalista de investigação', backstory: 'Casou com Miguel aos 24, divorciaram-se quando ele partiu para Berlim. Nunca o perdoou totalmente. Trabalha no Público.', arc: 'De justiceira solitária a parceira. Descobre que a verdade não é só profissional — é pessoal.', traits: ['determinada', 'cáustica', 'empática', 'insone'], scale: 'centro', voice: { when: 'Directa e incisiva, estilo jornalístico', what: 'Faz perguntas em vez de afirmações', example: '"Sabes qual é a diferença entre um segredo e uma mentira? O tempo."' } },
    { id: `char_${uid()}`, name: 'TOMÁS', arcType: 'antagonist', group: 'Círculo Profissional', description: 'Advogado da família Mendes há 20 anos. Elegante, manipulador, com segredos próprios que protege a todo o custo.', notes: 'Fato impecável, relógio caro. Sempre com um copo de whisky. Gestos calculados.', x: 280, y: 200, photo: null, age: '52', occupation: 'Advogado', backstory: 'Amigo de infância do pai de Miguel. A sua lealdade tem um preço que ninguém conhece.', arc: 'De guardião aparente a ameaça real. A sua queda revela que a corrupção tem raízes profundas.', traits: ['eloquente', 'calculista', 'charmoso', 'desesperado'], scale: 'real', voice: { when: 'Formal e controlado, mas perde a compostura quando encurralado', what: 'Usa legalismos como arma e eufemismos para esconder', example: '"O teu pai e eu tínhamos um acordo de cavalheiros. Cavalheiros não escrevem contratos."' } },
    { id: `char_${uid()}`, name: 'ROSA', arcType: 'mentor', group: 'Família Mendes', description: 'Mãe de Miguel, 68 anos. Mulher forte que sobreviveu a um casamento difícil. Guarda segredos que protegem e destroem.', notes: 'Avental quando em casa. Cruz de ouro ao peito. Mãos sempre ocupadas (cozinhar, costurar, rezar).', x: 400, y: 420, photo: null, age: '68', occupation: 'Reformada (ex-professora primária)', backstory: 'Nasceu em Setúbal, casou aos 20 com o pai de Miguel. Sabe mais do que todos sobre o passado da família.', arc: 'Do silêncio protector à revelação libertadora. Aceita que proteger os filhos às vezes significa contar a verdade.', traits: ['maternal', 'resiliente', 'secreta', 'sábia'], scale: 'real' },
    { id: `char_${uid()}`, name: 'DETECTIVE SOUSA', arcType: 'catalyst', group: 'Autoridades', description: 'Detective da PJ, 45 anos. Investiga o caso há meses. Metódico, paciente, com uma bússola moral firme.', notes: 'Gabardina bege, bigode. Fuma cigarrilhas. Caderninho preto inseparável.', x: 550, y: 400, photo: null, age: '45', occupation: 'Detective da Polícia Judiciária', backstory: 'Filho de pescadores de Peniche. Subiu na PJ pelo mérito. Este caso é pessoal — o pai de Miguel ajudou-o em tempos.', arc: 'De observador neutro a agente de justiça. Confronta o dilema entre a lei e a gratidão.', traits: ['metódico', 'paciente', 'íntegro', 'melancólico'], scale: 'social' },
    { id: `char_${uid()}`, name: 'PADRE SILVA', arcType: 'threshold-guardian', group: 'Comunidade', description: 'Pároco da São Roque, 60 anos. Confidente da família. Sabe segredos que o confessionário o impede de revelar.', notes: 'Batina sempre impecável. Óculos de massa. Voz grave e pausada.', x: 280, y: 400, photo: null, age: '60', occupation: 'Pároco', backstory: 'Baptizou Miguel, casou Miguel e Clara, celebrou o funeral do pai. É a memória viva da família.', arc: 'Do silêncio sagrado à acção moral. Quando a verdade pode salvar vidas, o sigilo torna-se um peso insuportável.', traits: ['contemplativo', 'bondoso', 'conflituado', 'firme'], scale: 'social' },
  ],
  relations: [
    { from: 'MIGUEL', to: 'CLARA', type: 'romantic', label: 'Ex-casal / Aliados' },
    { from: 'MIGUEL', to: 'ROSA', type: 'family', label: 'Filho' },
    { from: 'MIGUEL', to: 'TOMÁS', type: 'conflict', label: 'Desconfiança crescente' },
    { from: 'CLARA', to: 'ROSA', type: 'family', label: 'Ex-nora / Afecto mútuo' },
    { from: 'TOMÁS', to: 'DETECTIVE SOUSA', type: 'conflict', label: 'Investigado' },
    { from: 'PADRE SILVA', to: 'ROSA', type: 'friendship', label: 'Confidente' },
    { from: 'DETECTIVE SOUSA', to: 'MIGUEL', type: 'professional', label: 'Aliança relutante' },
  ],
  arcs: [],
  bible: {
    logline: 'Quando um arquitecto regressa a Lisboa para o funeral do pai, descobre que a herança familiar esconde um segredo que pode destruir tudo — ou finalmente libertar a verdade.',
    genre: 'Drama / Thriller Familiar',
    tone: 'Atmosférico, tenso, com momentos de ternura. Lisboa como personagem — luz dourada vs. sombras nos becos. Ritmo europeu, não americano.',
    themes: 'Verdade vs. Protecção, Herança e Culpa, Regresso e Pertença, Justiça vs. Lealdade',
    text: 'DESDOBRADO é uma série sobre os segredos que as famílias guardam e o preço de os revelar. Ambientada numa Lisboa contemporânea mas com ecos do passado, a narrativa cruza o thriller de investigação com o drama familiar íntimo. Cada episódio desdobra uma camada da verdade, como quem desfaz um novelo — cada fio puxa outro.\n\nA série privilegia o silêncio e o olhar sobre a exposição. Os espaços (o miradouro, o palácio em ruínas, a igreja) são extensões emocionais das personagens. A fotografia joga com a luz natural de Lisboa — dourada e generosa de dia, azul e misteriosa à noite.',
    sections: [
      { id: `sec_${uid()}`, title: 'Tom & Voz', text: 'Diálogos naturalistas, com subtexto. Evitar exposição directa — as personagens escondem mais do que revelam. Influências: "Succession" no conflito familiar, "The Night Manager" na tensão, cinema português de Miguel Gomes na estética.', order: 0 },
      { id: `sec_${uid()}`, title: 'Regras de Escrita', text: '1. Cada cena deve ter pelo menos um segredo não dito.\n2. Os flashbacks são sempre motivados por um objecto no presente.\n3. Miguel nunca diz "eu amo-te" — mostra-o de outras formas.\n4. Tomás nunca mente directamente — omite.\n5. Rosa fala em provérbios quando não quer responder.', order: 1 },
      { id: `sec_${uid()}`, title: 'Influências Visuais', text: 'Paolo Sorrentino (composição), Edward Hopper (solidão), fotografia de Lisboa de Daniel Blaufuks. Paleta: âmbar/dourado (dia), azul petróleo (noite), verde-musgo (Sintra).', order: 2 },
    ],
  },
  glossary: [
    { id: `gl_${uid()}`, term: 'O Testamento', definition: 'Documento deixado pelo pai de Miguel com condições misteriosas para a herança', category: 'plot' },
    { id: `gl_${uid()}`, term: 'A Casa de Sintra', definition: 'Palácio abandonado na Serra de Sintra onde o pai de Miguel escondia documentos', category: 'location' },
    { id: `gl_${uid()}`, term: 'O Acordo', definition: 'Pacto secreto entre o pai de Miguel e Tomás, feito há 20 anos', category: 'plot' },
    { id: `gl_${uid()}`, term: 'Desdobrado', definition: 'Termo usado por Rosa — "a verdade é como um guardanapo desdobrado, cada dobra esconde outra"', category: 'thematic' },
  ],
  writersRoom: [],
  forces: [
    { id: `force_${uid()}`, num: 1, title: 'A Verdade Enterrada', text: 'O passado da família Mendes tem camadas de segredos que vão sendo desenterrados episódio a episódio. Cada revelação muda o contexto de tudo o que já vimos.', color: '#E8A838', reference: 'Ep. 1-6' },
    { id: `force_${uid()}`, num: 2, title: 'Lisboa como Espelho', text: 'A cidade reflecte o estado emocional das personagens. Os miradouros são lugares de verdade, os becos de segredo, o rio de passagem e transformação.', color: '#5B8DEF', reference: 'Todos os episódios' },
    { id: `force_${uid()}`, num: 3, title: 'Herança e Culpa', text: 'O que herdamos dos pais — não só bens, mas padrões, segredos, culpa. Cada personagem carrega algo que não pediu e precisa decidir o que fazer com isso.', color: '#E74C3C', reference: 'Arco principal' },
    { id: `force_${uid()}`, num: 4, title: 'Justiça Imperfeita', text: 'Nem a lei nem a moral conseguem dar respostas limpas. A justiça nesta série é sempre um compromisso, uma negociação entre o ideal e o possível.', color: '#2EA080', reference: 'Arco Det. Sousa' },
  ],
  episodeArcs: [
    { id: `earc_${uid()}`, epNum: 1, title: 'A Maré Sobe', phase: 'setup', phaseColor: '#5B8DEF', desire: 'Miguel quer resolver o testamento rapidamente e voltar a Berlim', description: 'Regresso, descoberta do testamento, reencontro com Clara, primeira suspeita sobre Tomás', anchorScene: 'EP01-SC004', notes: 'Estabelecer Lisboa como personagem. Ritmo lento no início, acelera a partir da cena 7.' },
    { id: `earc_${uid()}`, epNum: 2, title: 'Debaixo da Ponte', phase: 'confrontation', phaseColor: '#E8A838', desire: 'Miguel quer a verdade; Tomás quer manter o segredo', description: 'Confrontos directos, perseguição em Sintra, revelações de Rosa, aliança Miguel-Clara reactivada', anchorScene: 'EP02-SC005', notes: 'Episódio mais físico e tenso. Palácio de Sintra como set piece central.' },
  ],
  decisions: [
    { id: `dec_${uid()}`, title: 'Flashbacks: em cor ou P&B?', description: 'Os flashbacks de infância do Miguel devem ser em cor (mais quentes) ou a preto e branco?', urgency: 'média', options: [{ id: 'a', label: 'Cor quente', text: 'Tons âmbar/dourados, 16mm look, grão. Mais emotivo e nostálgico.' }, { id: 'b', label: 'Preto e Branco', text: 'P&B com contraste suave. Mais distante, como memória desbotada.' }, { id: 'c', label: 'Misto', text: 'Começam em P&B e ganham cor à medida que Miguel recupera as memórias.' }], status: 'open', chosenOption: null, createdAt: '2026-03-01T14:00:00.000Z' },
    { id: `dec_${uid()}`, title: 'Destino do Tomás no final da série', description: 'O Tomás deve ser preso, fugir, ou redimir-se parcialmente?', urgency: 'alta', options: [{ id: 'a', label: 'Preso', text: 'Justiça clara. Satisfatório mas previsível.' }, { id: 'b', label: 'Foge', text: 'Deixa porta aberta para S2. Mais ambíguo.' }], status: 'open', chosenOption: null, createdAt: '2026-03-05T10:00:00.000Z' },
  ],
  files: [],
}

// ═══════════════════════════════════════════════════════════════════════
// SUGESTÕES CRUZADAS (5 sugestões — mix de estados)
// ═══════════════════════════════════════════════════════════════════════
const SUGGESTIONS = [
  { id: `sug_${uid()}`, type: 'team-salary→budget', source: 'team', target: 'budget', sourceId: 'team_salary', title: 'Actualizar orçamento — cachê do elenco', description: 'O elenco principal foi confirmado com cachês diários. Actualizar as linhas de orçamento da categoria "Elenco" para reflectir os valores reais.', data: { affectedCategory: 2 }, status: 'pending', createdAt: '2026-03-08T10:00:00.000Z' },
  { id: `sug_${uid()}`, type: 'day-add→budget', source: 'production', target: 'budget', sourceId: 'production_days', title: 'Dias de rodagem — impacto no orçamento', description: '7 dias de rodagem foram criados. Verificar se as linhas de equipamento, catering e transportes reflectem o número correcto de dias.', data: { totalDays: 7 }, status: 'approved', createdAt: '2026-03-06T15:00:00.000Z', approvedAt: '2026-03-07T09:00:00.000Z' },
  { id: `sug_${uid()}`, type: 'location-status→production', source: 'locations', target: 'production', sourceId: 'loc_guincho', title: 'Praia do Guincho — autorização pendente', description: 'A localização "Praia do Guincho" ainda não tem autorização confirmada. A cena EP01-SC005 está agendada para D3. Considerar plano B.', data: { sceneKey: 'EP01-SC005', dayLabel: 'D3' }, status: 'pending', createdAt: '2026-03-10T11:00:00.000Z' },
  { id: `sug_${uid()}`, type: 'dept-item→continuity', source: 'departments', target: 'continuity', sourceId: 'dept_wardrobe', title: 'Guarda-roupa Miguel — verificar continuidade', description: 'Novo item de guarda-roupa adicionado para Miguel (fato cinzento). Verificar coerência com cenas já filmadas.', data: { characterName: 'MIGUEL', department: 'wardrobe' }, status: 'dismissed', createdAt: '2026-03-09T14:00:00.000Z' },
  { id: `sug_${uid()}`, type: 'team-add→budget', source: 'team', target: 'budget', sourceId: 'team_new', title: 'Novo membro — Inês Figueiredo (Boom)', description: 'Boom operator adicionada à equipa com cachê diário de €110. Criar linha no orçamento.', data: { memberName: 'Inês Figueiredo', cacheDiario: 11000 }, status: 'pending', createdAt: '2026-03-11T09:30:00.000Z' },
]

// ═══════════════════════════════════════════════════════════════════════
// ITEMS DE DEPARTAMENTO (8 items)
// ═══════════════════════════════════════════════════════════════════════
const DEPARTMENT_ITEMS = [
  { id: `dept_${uid()}`, department: 'wardrobe', characterId: 'MIGUEL', name: 'Fato principal Miguel', scenes: ['EP01-SC002', 'EP01-SC004', 'EP01-SC008', 'EP02-SC001', 'EP02-SC002'], photos: [], notes: 'Camisa branca linho + calças cinza escuro. Mangas sempre arregaçadas. Sapatos de camurça castanhos.', approved: true, createdAt: '2026-03-05T10:00:00.000Z' },
  { id: `dept_${uid()}`, department: 'wardrobe', characterId: 'CLARA', name: 'Look dia Clara', scenes: ['EP01-SC003', 'EP01-SC006', 'EP02-SC003'], photos: [], notes: 'Trench coat bege + blusa preta + jeans escuros. Sempre com saco a tiracolo (bloco notas visível).', approved: true, createdAt: '2026-03-05T10:30:00.000Z' },
  { id: `dept_${uid()}`, department: 'wardrobe', characterId: 'TOMÁS', name: 'Fato Tomás', scenes: ['EP01-SC004', 'EP01-SC007', 'EP02-SC002', 'EP02-SC005'], photos: [], notes: 'Fato azul marinho Hugo Boss, camisa azul clara, gravata bordô. Relógio Omega no pulso esquerdo. Lenço no bolso.', approved: false, createdAt: '2026-03-06T09:00:00.000Z' },
  { id: `dept_${uid()}`, department: 'props', name: 'Carta testamento', scenes: ['EP01-SC004', 'EP01-SC008', 'EP02-SC005'], photos: [], notes: 'Envelope amarelado formato A4, lacrado com cera vermelha. Interior: 3 folhas manuscritas em papel pergaminho. Tinta azul desbotada. Precisamos de 4 cópias (limpas + envelhecidas).', approved: true, createdAt: '2026-03-05T14:00:00.000Z' },
  { id: `dept_${uid()}`, department: 'props', name: 'Isqueiro Miguel', scenes: ['EP01-SC001', 'EP01-SC002', 'EP01-SC007', 'EP01-SC010', 'EP02-SC001', 'EP02-SC003'], photos: [], notes: 'Zippo prateado, gravado "JM" (iniciais do pai). Gasoso mas funcional. Miguel brinca com ele quando nervoso — nunca acende.', approved: true, createdAt: '2026-03-05T14:30:00.000Z' },
  { id: `dept_${uid()}`, department: 'art', locationId: 'Apartamento Miguel', name: 'Decoração sala Miguel', scenes: ['EP01-SC002', 'EP01-SC008', 'EP02-SC001'], photos: [], notes: 'Estante IKEA com livros de arquitectura + molduras família (fotos a definir com produção). Mesa de desenho com projectos. Pouca decoração — ar de quem acabou de chegar. Caixas por abrir no canto.', approved: true, createdAt: '2026-03-04T16:00:00.000Z' },
  { id: `dept_${uid()}`, department: 'makeup', characterId: 'MIGUEL', name: 'Cicatriz sobrancelha Miguel', scenes: ['EP01-SC001', 'EP01-SC002', 'EP01-SC003', 'EP01-SC004', 'EP01-SC005', 'EP01-SC007', 'EP01-SC008', 'EP01-SC010', 'EP02-SC001', 'EP02-SC002', 'EP02-SC003', 'EP02-SC005', 'EP02-SC006', 'EP02-SC008'], photos: [], notes: 'Pequena cicatriz na sobrancelha direita (acidente de infância). Silicone prosthetic + pintura. Aplicação: 15min. Referência fotográfica a enviar.', approved: false, createdAt: '2026-03-07T11:00:00.000Z' },
  { id: `dept_${uid()}`, department: 'sfx', name: 'Fumo palácio Sintra', scenes: ['EP02-SC005', 'EP02-SC006'], photos: [], notes: 'Nevoeiro baixo no jardim + fumo interior (ruínas). 2× máquinas de nevoeiro MDG. Atenção à ventilação no interior. Testar com realizador no recce.', approved: false, createdAt: '2026-03-08T09:00:00.000Z' },
]

// ═══════════════════════════════════════════════════════════════════════
// PRÉ-PRODUÇÃO
// ═══════════════════════════════════════════════════════════════════════
const PRE_PRODUCTION = {
  shootDate: '2026-03-20',
  teamMembers: [],
  tasks: [
    { id: `task_${uid()}`, title: 'Autorização APA — Praia do Guincho', status: 'em progresso', assignee: 'Rui Mendes Ferreira', dueDate: '2026-03-15', notes: 'Enviar pedido com antecedência de 30 dias' },
    { id: `task_${uid()}`, title: 'Recce Palácio Sintra com realizador', status: 'concluído', assignee: 'Sofia Martins Rocha', dueDate: '2026-03-10', notes: 'Feito a 8/3. Notas e fotos no Drive.' },
    { id: `task_${uid()}`, title: 'Contractos elenco principal', status: 'em progresso', assignee: 'Mariana Lopes Cardoso', dueDate: '2026-03-18', notes: 'Miguel e Clara assinados. Tomás em revisão pelo agente.' },
    { id: `task_${uid()}`, title: 'Aluguer kit câmara Alexa Mini LF', status: 'concluído', assignee: 'Tiago Almeida Santos', dueDate: '2026-03-12', notes: 'Confirmado com a Lenspool. Recolha 19/3.' },
    { id: `task_${uid()}`, title: 'Casting figuração — café + igreja', status: 'pendente', assignee: 'Catarina Duarte', dueDate: '2026-03-17', notes: '8 figurantes para café, 15 para igreja (funeral).' },
  ],
  castingStatus: {
    'MIGUEL': 'contratado',
    'CLARA': 'contratado',
    'TOMÁS': 'contratado',
    'ROSA': 'contratado',
    'PADRE SILVA': 'contratado',
    'DETECTIVE SOUSA': 'em audição',
  },
  castingDetails: {
    'MIGUEL': { actorName: 'Diogo Vasconcelos', contact: '+351 912 345 014', notes: 'Confirmado. Ensaios começam 16/3.' },
    'CLARA': { actorName: 'Carolina Ferraz Leitão', contact: '+351 912 345 015', notes: 'Confirmada. Disponibilidade total Março-Abril.' },
    'TOMÁS': { actorName: 'Ricardo Magalhães', contact: '+351 912 345 016', notes: 'Contrato em revisão pelo agente.' },
    'ROSA': { actorName: 'Marta Oliveira Cruz', contact: '+351 912 345 017', notes: 'Disponível apenas seg-sex.' },
    'PADRE SILVA': { actorName: 'João Pedro Esteves', contact: '+351 912 345 018', notes: '' },
    'DETECTIVE SOUSA': { actorName: '', contact: '', notes: 'Audições: Álvaro Cunhal, Pedro Almendra. Callback 14/3.' },
  },
  crewStatus: {
    realizador: { name: 'Gonçalo Vieira Branco', status: 'contratado', contact: '+351 912 345 004' },
    dir_fotografia: { name: 'Tiago Almeida Santos', status: 'contratado', contact: '+351 912 345 007' },
    director_arte: { name: 'Helena Tavares Monteiro', status: 'contratado', contact: '+351 912 345 012' },
    operador_som: { name: 'Miguel Soares Pinto', status: 'contratado', contact: '+351 912 345 010' },
  },
  locationSubStatus: {
    'Apartamento Miguel': { autorização: 'confirmado', recce: 'feito' },
    'Escritório Advocacia': { autorização: 'confirmado', recce: 'feito' },
    'Café Tertúlia': { autorização: 'confirmado', recce: 'feito' },
    'Palácio Sintra': { autorização: 'em curso', recce: 'feito' },
    'Praia do Guincho': { autorização: 'pendente', recce: 'feito' },
    'Igreja São Roque': { autorização: 'confirmado', recce: 'feito' },
    'Armazém Alcântara': { autorização: 'confirmado', recce: 'feito' },
    'Miradouro Graça': { autorização: 'em curso', recce: 'feito' },
    'Casa Avó Rosa': { autorização: 'pendente', recce: 'por fazer' },
  },
  locationDetails: {},
}

// ═══════════════════════════════════════════════════════════════════════
// PARSED CHARACTERS + LOCATIONS (do guião)
// ═══════════════════════════════════════════════════════════════════════
const PARSED_CHARACTERS = [
  // EP01 cast
  { name: 'JOÃO', scenes: [1,2,3,4,5,6,7,8,9,10,11,12,14,15,16,17,18,19,20,21,22,24], lineCount: 176 },
  { name: 'LU', scenes: [3,4,5,6,7,8,10,11,14,15,16,20,21,22], lineCount: 112 },
  { name: 'MÃE', scenes: [1,2,18], lineCount: 24 },
  { name: 'RUBEN', scenes: [17,19,20], lineCount: 24 },
  { name: 'JÚLIO', scenes: [5,10], lineCount: 16 },
  { name: 'PROF', scenes: [6,9], lineCount: 16 },
  { name: 'SR ANTÓNIO', scenes: [4], lineCount: 8 },
  { name: 'FÁBIO', scenes: [7], lineCount: 8 },
  { name: 'ALUNO', scenes: [10], lineCount: 8 },
  // EP02 cast (adicionais)
  { name: 'CAS', scenes: [6,7,10,11,12,13,14,15,16,20,21,23,24], lineCount: 104 },
  { name: 'MATI', scenes: [5,6,10,11,12,14,15,16,19,20,21,23], lineCount: 96 },
  { name: 'PEQUENO', scenes: [11,12,14,15,18,20,21,23,24], lineCount: 72 },
  { name: 'JU', scenes: [6,11,12,15,21,23,24], lineCount: 56 },
  { name: 'JOÃO PEQUENO', scenes: [6,9,12], lineCount: 24 },
  { name: 'PROF GINÁSTICA', scenes: [14], lineCount: 8 },
  { name: 'MAE LU', scenes: [16], lineCount: 8 },
]

const PARSED_LOCATIONS = [
  // EP01 locations
  'Cozinha João', 'Hall Prédio', 'Rua', 'Portão Escola', 'Pátio Da Escola',
  'Sala Aula', 'Escola', 'Biblioteca Escola', 'Sala De Aula', 'Pátio Escola',
  'Mercearia', 'Porta Prédio', 'Fim De Dia', 'Jardim Banco De Jardim',
  'Casa Do Rúben Sala', 'Cozinha', 'Sala',
  // EP02 locations (adicionais)
  'Porta Da Rua', 'Prédio', 'Jardim', 'Corredor Escola', 'Wc Escola',
  'Balneário', 'Ginásio', 'Esquina Por Do Sol', 'Quarto João', 'Sala De Estar',
  'Cozinha João', 'Madrugada',
]

// ═══════════════════════════════════════════════════════════════════════
// SCENE TAKES (alguns takes para cenas já "filmadas")
// ═══════════════════════════════════════════════════════════════════════
const SCENE_TAKES = {
  // Simular que algumas cenas do D1 já têm takes registados
}

// ═══════════════════════════════════════════════════════════════════════
// CONTINUITY DATA
// ═══════════════════════════════════════════════════════════════════════
const CONTINUITY_DATA = {
  'EP01-SC002': {
    wardrobe: 'Miguel: camisa branca linho, mangas arregaçadas, calças cinza. Descalço em casa.',
    props: 'Telemóvel na mesa, caneca café (meia), isqueiro no bolso calças.',
    makeup: 'Cicatriz sobrancelha dir. Barba de 2 dias.',
    notes: 'Luz natural da janela — manhã. Caixas de mudança no fundo.',
    photos: [],
  },
  'EP01-SC003': {
    wardrobe: 'Miguel: mesmo que SC002 + casaco preto por cima. Clara: trench bege, blusa preta, jeans.',
    props: 'Documentos (envelope A4 kraft), 2 cafés na mesa, bloco notas Clara.',
    makeup: 'Miguel: mesma continuidade. Clara: maquilhagem natural, rímel.',
    notes: 'Mesa ao fundo à esquerda. Balcão com máquina café visível.',
    photos: [],
  },
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN SEED FUNCTION
// ═══════════════════════════════════════════════════════════════════════
export function seedDummyData(store) {
  const state = store.getState()

  // Build scene assignments using the actual day IDs
  const sceneAssignments = buildSceneAssignments(SHOOTING_DAYS)

  // Build scene order from assignments
  const sceneOrder = {}
  Object.entries(sceneAssignments).forEach(([sceneKey, dayId]) => {
    if (!sceneOrder[dayId]) sceneOrder[dayId] = []
    sceneOrder[dayId].push(sceneKey)
  })

  // Build universe with proper char ID cross-references for relations
  const universe = { ...UNIVERSE }
  const charIdMap = {}
  universe.chars.forEach(c => { charIdMap[c.name] = c.id })
  universe.relations = universe.relations.map(r => ({
    ...r,
    from: charIdMap[r.from] || r.from,
    to: charIdMap[r.to] || r.to,
  }))

  // Set everything at once via setState for speed
  store.setState({
    // Project identity
    projectName: 'DESDOBRADO',
    projectFps: 25,
    projectParams: {
      episodes: '6',
      episodeDuration: '50',
      shootDays: '18',
    },

    // Team
    team: TEAM,

    // Locations
    locations: LOCATIONS,

    // Shooting days + assignments
    shootingDays: SHOOTING_DAYS,
    sceneAssignments,
    sceneOrder,
    sceneTakes: SCENE_TAKES,

    // Scripts
    parsedScripts: PARSED_SCRIPTS,
    parsedCharacters: PARSED_CHARACTERS,
    parsedLocations: PARSED_LOCATIONS,

    // Budget
    budgets: [buildBudget()],

    // Universe
    universe,

    // Suggestions
    suggestions: SUGGESTIONS,

    // Department items
    departmentItems: DEPARTMENT_ITEMS,

    // Pre-production
    preProduction: PRE_PRODUCTION,

    // Continuity
    continuityData: CONTINUITY_DATA,

    // Scene tags
    sceneTags: {
      'EP01-SC001': ['drone', 'golden-hour'],
      'EP01-SC005': ['flashback', 'ext-praia', 'golden-hour'],
      'EP01-SC007': ['noite', 'tensão'],
      'EP02-SC005': ['sfx', 'palácio', 'tensão'],
      'EP02-SC006': ['noite', 'sfx', 'perseguição'],
    },
  })

  console.info('[SEED] Dados dummy carregados com sucesso — DESDOBRADO')
  return {
    team: TEAM.length,
    locations: LOCATIONS.length,
    shootingDays: SHOOTING_DAYS.length,
    scenes: Object.values(PARSED_SCRIPTS).reduce((n, p) => n + (p.scenes?.length || 0), 0),
    assignments: Object.keys(sceneAssignments).length,
    budgetLines: buildBudget().lines.length,
    universeChars: universe.chars.length,
    suggestions: SUGGESTIONS.length,
    deptItems: DEPARTMENT_ITEMS.length,
  }
}

// ═══════════════════════════════════════════════════════════════════════
// RESET — limpa dados de projecto, mantém auth + apiKey + config
// ═══════════════════════════════════════════════════════════════════════
export function resetProjectData(store) {
  store.setState({
    projectName: '',
    projectParams: { episodes: '', episodeDuration: '', shootDays: '' },
    projectTheme: null,
    wallpaper: { type: 'none', preset: null, customUrl: null, gradient: null, blur: 20, opacity: 0.85, dim: 0.3 },

    team: [],
    locations: [],
    shootingDays: [],
    sceneAssignments: {},
    sceneOrder: {},
    sceneTakes: {},
    sceneTags: {},

    parsedCharacters: [],
    parsedLocations: [],
    parsedScripts: {},

    budgets: [],
    suppliers: [],
    budgetVersions: {},
    budgetDocuments: [],

    universe: {
      chars: [], relations: [], arcs: [],
      bible: { logline: '', genre: '', tone: '', themes: '', text: '', sections: [] },
      glossary: [], writersRoom: [], forces: [],
      episodeArcs: [], decisions: [], files: [],
    },

    suggestions: [],
    reactiveAudit: [],

    departmentItems: [],

    continuityData: {},
    continuityDecisions: [],

    preProduction: {
      shootDate: '', teamMembers: [], tasks: [],
      castingStatus: {}, castingDetails: {},
      crewStatus: {}, locationSubStatus: {}, locationDetails: {},
    },

    captures: [],
    captureNotes: [],

    productionScript: {
      versao_atual: 'v1', versoes: [], cenas: {},
      sequencias: [], costuras: [],
    },
    sidesGerados: [],

    dailies: { cameras: [], clipMeta: {}, audioTracks: [] },
    cameraReports: {},
    rsvp: {},
    callsheetNotes: {},

    scheduleMode: 'creative',
    scheduleBudgetEnvelope: null,
    scheduleVersions: [],
  })

  console.info('[SEED] Dados de projecto limpos — auth e apiKey preservados')
}
