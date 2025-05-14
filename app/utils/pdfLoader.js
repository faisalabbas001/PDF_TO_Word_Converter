let pdfjsLib = null

export const loadPdfjs = async () => {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist')
    const workerUrl = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl
  }
  return pdfjsLib
} 