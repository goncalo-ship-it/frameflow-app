// Utilitários monetários — trabalha sempre em cêntimos (inteiros) para evitar erros de vírgula flutuante

export const toCents = (euros) => Math.round((euros || 0) * 100)
export const toEuros = (cents) => (cents || 0) / 100
export const fmt = (cents) => '\u20AC\u00A0' + toEuros(cents).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const fmtShort = (cents) => '\u20AC\u00A0' + toEuros(cents).toLocaleString('pt-PT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

// Multiplicar cêntimos por escalares (arredondando sempre)
export const safeMul = (...args) => args.reduce((a, b) => Math.round(a * b), 1)

// nanoid simples — sem dependências externas
export const nanoid = () => Math.random().toString(36).slice(2, 10)
