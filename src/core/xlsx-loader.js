// Shared XLSX loader — uses script tag from /public/ to avoid Vite ESM issues
let _promise = null

export function getXLSX() {
  if (window.XLSX) return Promise.resolve(window.XLSX)
  if (_promise) return _promise
  _promise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = '/xlsx.full.min.js'
    s.onload = () => resolve(window.XLSX)
    s.onerror = () => { _promise = null; reject(new Error('Falha ao carregar xlsx')) }
    document.head.appendChild(s)
  })
  return _promise
}
