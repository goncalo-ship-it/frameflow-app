// mediaCompressor.js — Compressão e redimensionamento de imagens no browser

/**
 * Redimensiona e comprime uma imagem para base64 JPEG.
 * @param {File|Blob} file
 * @param {number} maxDim — dimensão máxima (largura ou altura)
 * @param {number} quality — qualidade JPEG 0-1
 * @returns {Promise<string>} base64 sem prefixo data:...
 */
function resizeToBase64(file, maxDim, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img
      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.round((height / width) * maxDim)
          width = maxDim
        } else {
          width = Math.round((width / height) * maxDim)
          height = maxDim
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      // Extrair base64 sem o prefixo
      const dataUrl = canvas.toDataURL('image/jpeg', quality)
      const base64 = dataUrl.split(',')[1]
      resolve(base64)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Erro ao carregar imagem'))
    }

    img.src = url
  })
}

/**
 * Comprime uma imagem para enviar à API (max 1200px, 80% quality).
 * @param {File|Blob} file
 * @returns {Promise<string>} base64 JPEG
 */
export function compressImage(file) {
  return resizeToBase64(file, 800, 0.70)
}

/**
 * Cria thumbnail para preview na UI (max 200px, 75% quality).
 * @param {File|Blob} file
 * @returns {Promise<string>} base64 JPEG
 */
export function createThumbnail(file) {
  return resizeToBase64(file, 160, 0.65)
}

/**
 * Converte um Blob/File para base64 sem compressão (útil para audio).
 * @param {Blob} blob
 * @returns {Promise<string>} base64
 */
export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
