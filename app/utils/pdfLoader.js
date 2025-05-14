let pdfjsLib = null

export const loadPdfjs = async () => {
  if (!pdfjsLib) {
    // Use dynamic import with specific path
    pdfjsLib = await import('pdfjs-dist/legacy/build/pdf')
    const workerUrl = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl
  }
  return pdfjsLib
}

// Add a browser-compatible canvas if needed
export const createCanvas = (width, height) => {
  if (typeof window !== 'undefined') {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    return canvas
  }
  return null
} 