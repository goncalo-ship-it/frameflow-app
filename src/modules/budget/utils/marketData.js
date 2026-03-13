// Dados de mercado português para produção audiovisual

// 13 categorias oficiais do orçamento de produção
export const CATEGORIAS = [
  { id: 1,  label: 'Pré-Produção' },
  { id: 2,  label: 'Elenco' },
  { id: 3,  label: 'Equipa Técnica' },
  { id: 4,  label: 'Equipamento Técnico' },
  { id: 5,  label: 'Departamento de Arte' },
  { id: 6,  label: 'Estúdios e Locais' },
  { id: 7,  label: 'Transporte, Alojamento e Alimentação' },
  { id: 8,  label: 'Offline (montagem)' },
  { id: 9,  label: 'Som' },
  { id: 10, label: 'Pós-Produção Vídeo' },
  { id: 11, label: 'Pós-Produção Fotografia' },
  { id: 12, label: 'Seguros e Diversos' },
  { id: 13, label: 'Honorários Produtora' },
]

// Markups por tipo de serviço
export const MARKUP_DEFAULTS = {
  equipa:       1.35,
  elenco:       1.25,
  equipamento:  1.35,
  pos:          1.35,
  catering:     1.20,
  transportes:  1.15,
  estudios:     1.25,
  seguros:      1.10,
  default:      1.30,
}

// Benchmarks de mercado — [min, max] em cêntimos por dia (preço de venda)
export const BENCHMARKS = {
  ap:               [15000, 25000],
  realizador:       [50000, 120000],
  dop:              [40000, 80000],
  dopPackage:       [150000, 350000],
  assCamera:        [15000, 25000],
  directorSom:      [25000, 45000],
  gaffer:           [20000, 35000],
  directorArte:     [25000, 45000],
  maquilhador:      [18000, 30000],
  packageFX6Basic:  [60000, 90000],
  packageFX6Full:   [120000, 180000],
  packageCinema:    [250000, 500000],
  packageSomBasico: [20000, 40000],
  estPequeno:       [50000, 120000],
  estMedio:         [120000, 250000],
  cateringAlmoco:   [800, 1500],   // por pessoa
}

// Pesos padrão por categoria (para estimativas rápidas)
export const PESOS_DEFAULT = {
  1:  0.05,
  2:  0.08,
  3:  0.15,
  4:  0.12,
  5:  0.05,
  6:  0.08,
  7:  0.07,
  8:  0.10,
  9:  0.05,
  10: 0.12,
  11: 0.00,
  12: 0.04,
  // 13 é calculado automaticamente como % do subtotal
}

// Taxas de IVA (Portugal)
export const IVA_TAXAS = {
  normal:     0.23,  // equipamento, equipa, pós, etc.
  intermédia: 0.13,  // restauração, catering, alimentação
  reduzida:   0.06,  // raramente usado em produção
}

export const IVA_DEFAULT_POR_CATEGORIA = {
  1:  0.23, 2:  0.23, 3:  0.23, 4:  0.23, 5:  0.23,
  6:  0.23, 7:  0.13, 8:  0.23, 9:  0.23, 10: 0.23,
  11: 0.23, 12: 0.23, 13: 0.23,
}

// Status possíveis de um orçamento
export const STATUS_LABELS = {
  draft:    { label: 'Rascunho',  color: 'var(--text-muted)' },
  sent:     { label: 'Enviado',   color: 'var(--health-yellow)' },
  approved: { label: 'Aprovado',  color: 'var(--health-green)' },
  rejected: { label: 'Rejeitado', color: '#F87171' },
}
