"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Navbar from "../components/Navbar"
import { Document, Packer, Paragraph, TextRun } from "docx"
import dynamic from 'next/dynamic'
import { loadPdfjs } from '../utils/pdfLoader'
import pako from 'pako';

const initDB = async () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('PDFConverter', 1)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

const getChunk = async (db, id) => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['chunks'], 'readonly')
    const store = transaction.objectStore('chunks')
    const request = store.get(id)
    
    request.onsuccess = () => resolve(request.result?.data)
    request.onerror = () => reject(request.error)
  })
}

const deleteChunk = async (db, id) => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['chunks'], 'readwrite')
    const store = transaction.objectStore('chunks')
    const request = store.delete(id)
    
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

const ConversionProgress = ({ progress, status }) => {
  return (
    <div className="w-full max-w-xl mx-auto bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium text-blue-700">{status}</span>
        <span className="text-sm font-medium text-blue-700">{progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div 
          className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
          style={{ 
            width: `${progress}%`,
            transition: 'width 0.5s ease-out'
          }}
        />
      </div>
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          {progress < 30 ? "Analyzing PDF structure..." :
           progress < 60 ? "Extracting content..." :
           progress < 90 ? "Converting to Word format..." :
           progress < 100 ? "Finalizing document..." :
           "Conversion complete!"}
        </p>
      </div>
    </div>
  )
}

const PDFConverter = () => {
  const [mounted, setMounted] = useState(false)
  const [documentTitle, setDocumentTitle] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [isFileDeleted, setIsFileDeleted] = useState(false)
  const [timeLeft, setTimeLeft] = useState({
    hours: 1,
    minutes: 54,
    seconds: 41
  })
  const [isConverting, setIsConverting] = useState(false)
  const [convertedContent, setConvertedContent] = useState(null)
  const [conversionProgress, setConversionProgress] = useState(0)
  const [conversionError, setConversionError] = useState(null)
  const router = useRouter()

  // Timer countdown effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        // Check if time is up
        if (prev.hours === 0 && prev.minutes === 0 && prev.seconds === 0) {
          handleFileExpired()
          return prev
        }

        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 }
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 }
        }
        return prev
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleFileExpired = () => {
    setIsFileDeleted(true)
    setShowModal(false)
    // Clear file data from session storage
    sessionStorage.removeItem("pdfData")
  }

  const handleDelete = () => {
    setShowModal(true)
  }

  const handleDeleteNow = () => {
    setIsFileDeleted(true)
    setShowModal(false)
    // Clear file data from session storage
    sessionStorage.removeItem("pdfData")
  }

  const convertPdfToWord = async (pdfData, fileName) => {
    setIsConverting(true)
    setConversionError(null)
    setConversionProgress(0)

    try {
      const PDFJS = await loadPdfjs()
      const pdf = await PDFJS.getDocument({
        data: pdfData,
        useWorkerFetch: true,
        isEvalSupported: false,
        useSystemFonts: true
      }).promise

      const totalPages = pdf.numPages
      let documentContent = []

      // Process pages in batches
      const BATCH_SIZE = 5
      for (let i = 0; i < totalPages; i += BATCH_SIZE) {
        const batch = []
        for (let j = 0; j < BATCH_SIZE && i + j < totalPages; j++) {
          batch.push(pdf.getPage(i + j + 1))
        }

        const pages = await Promise.all(batch)
        
        for (const page of pages) {
          const textContent = await page.getTextContent({
            normalizeWhitespace: true,
            disableCombineTextItems: false,
          })
          
          const viewport = page.getViewport({ scale: 1.0 })
          
          const processedItems = textContent.items
            .map(item => ({
              text: item.str,
              x: item.transform[4],
              y: viewport.height - item.transform[5],
              fontSize: Math.abs(item.transform[0]) || 12,
              fontFamily: item.fontName || 'Arial',
              bold: item.fontName?.toLowerCase().includes('bold'),
              italic: item.fontName?.toLowerCase().includes('italic'),
            }))
            .sort((a, b) => {
              const yDiff = Math.abs(a.y - b.y)
              return yDiff < 5 ? a.x - b.x : b.y - a.y
            })

          documentContent.push(processedItems)
        }

        setConversionProgress(Math.round(((i + BATCH_SIZE) / totalPages) * 100))
        await new Promise(resolve => setTimeout(resolve, 0))
      }

      // Create Word document with improved formatting
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: fileName.replace(".pdf", ""),
                  bold: true,
                  size: 32,
                }),
              ],
              spacing: { after: 400 },
            }),
            ...documentContent.flat().map(item => 
              new Paragraph({
                children: [
                  new TextRun({
                    text: item.text,
                    size: Math.round(item.fontSize * 2),
                    bold: item.bold,
                    italic: item.italic,
                    font: item.fontFamily,
                  }),
                ],
                spacing: { after: 200 },
              })
            ),
          ],
        }],
      })

      const buffer = await Packer.toBuffer(doc)
      setConvertedContent(buffer)
      
    } catch (error) {
      console.error('PDF conversion error:', error)
      setConversionError("Error converting PDF. Please try again.")
    } finally {
      setIsConverting(false)
      setConversionProgress(0)
    }
  }

  const handleDownload = () => {
    try {
      if (!convertedContent) {
        alert("Please wait for conversion to complete")
        return
      }

      // Create blob from buffer
      const blob = new Blob([convertedContent], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      })
      
      // Download file
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${documentTitle || 'document'}.docx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

    } catch (error) {
      console.error("Error downloading document:", error)
      alert("Error downloading file. Please try again.")
    }
  }

  const loadPdfData = async () => {
    try {
      const metadataStr = sessionStorage.getItem("pdfMetadata")
      if (!metadataStr) {
        router.push("/")
        return
      }

      const metadata = JSON.parse(metadataStr)
      setDocumentTitle(metadata.fileName.replace(".pdf", ""))

      // Initialize IndexedDB
      const db = await initDB()

      // Reconstruct the compressed data
      let compressedArray = new Uint8Array(metadata.compressedSize)
      let offset = 0

      for (let i = 0; i < metadata.totalChunks; i++) {
        const chunk = await getChunk(db, `pdfChunk_${i}`)
        if (!chunk) {
          throw new Error("File data is incomplete")
        }
        compressedArray.set(chunk, offset)
        offset += chunk.length
      }

      // Clean up chunks
      for (let i = 0; i < metadata.totalChunks; i++) {
        await deleteChunk(db, `pdfChunk_${i}`)
      }

      // Decompress the data
      const decompressedData = pako.inflate(compressedArray)
      
      // Create a copy of the data for PDF.js
      const pdfData = new Uint8Array(decompressedData)

      // Load PDF.js
      const PDFJS = await loadPdfjs()

      // Create a fresh copy for the PDF document
      const pdfDataCopy = new Uint8Array(pdfData)
      
      // Load and verify PDF
      const pdf = await PDFJS.getDocument({
        data: pdfDataCopy.buffer,
        useWorkerFetch: true,
        isEvalSupported: false,
        useSystemFonts: true
      }).promise

      // If PDF loads successfully, proceed with conversion using another copy
      const conversionCopy = new Uint8Array(pdfData)
      await convertPdfToWord(conversionCopy, metadata.fileName)

      sessionStorage.removeItem("pdfMetadata")

    } catch (error) {
      console.error("Error loading PDF data:", error)
      setConversionError("Error loading PDF data. Please try again.")
    }
  }

  useEffect(() => {
    setMounted(true)
    loadPdfData()
  }, [])

  // Prevent hydration mismatch
  if (!mounted) {
    return null
  }

  if (isFileDeleted) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
        <Navbar />
        
        <main className="flex-grow flex flex-col items-center justify-center px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-2xl w-full"
          >
            <h1 className="text-[#383E45] text-3xl font-semibold mb-12">
              This task has already been deleted.
            </h1>

            <div className="flex justify-center gap-3 mb-16">
              <button
                onClick={() => router.push("/")}
                className="flex items-center gap-2 px-6 py-3 bg-[#e12d39] hover:bg-[#c42832] text-white rounded-lg text-lg font-semibold transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Back to homepage
              </button>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#f0f7ff] rounded-lg p-6 text-left"
            >
              <h2 className="text-xl font-semibold text-[#383E45] mb-4">
                Secure. Private. In your control
              </h2>
              <p className="text-gray-600 mb-4">
                For over a decade, iLovePDF has securely processed documents with no storage, no tracking, and complete privacy. Your files are always handled safely and automatically deleted after 2 hours.
                <a href="#" className="text-blue-600 hover:text-blue-800 ml-1">Learn more</a>
              </p>
              <div className="flex items-center gap-6 mt-6">
                <img src="/iso-certified.png" alt="ISO Certified" className="h-8 w-auto" />
                <img src="/secure.png" alt="Secure" className="h-8 w-auto" />
                <img src="/pdf-association.png" alt="PDF Association" className="h-8 w-auto" />
              </div>
            </motion.div>
          </motion.div>
        </main>

        <footer className="bg-white border-t border-gray-200 mt-auto">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-600 tracking-wider uppercase mb-4">
                  Product
                </h3>
                <ul className="space-y-3">
                  <li><a href="#" className="text-gray-500 hover:text-gray-700">Features</a></li>
                  <li><a href="#" className="text-gray-500 hover:text-gray-700">Pricing</a></li>
                  <li><a href="#" className="text-gray-500 hover:text-gray-700">Teams</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-600 tracking-wider uppercase mb-4">
                  Solutions
                </h3>
                <ul className="space-y-3">
                  <li><a href="#" className="text-gray-500 hover:text-gray-700">Convert PDF</a></li>
                  <li><a href="#" className="text-gray-500 hover:text-gray-700">Edit PDF</a></li>
                  <li><a href="#" className="text-gray-500 hover:text-gray-700">Sign PDF</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-600 tracking-wider uppercase mb-4">
                  Company
                </h3>
                <ul className="space-y-3">
                  <li><a href="#" className="text-gray-500 hover:text-gray-700">About</a></li>
                  <li><a href="#" className="text-gray-500 hover:text-gray-700">Blog</a></li>
                  <li><a href="#" className="text-gray-500 hover:text-gray-700">Contact</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-600 tracking-wider uppercase mb-4">
                  Legal
                </h3>
                <ul className="space-y-3">
                  <li><a href="#" className="text-gray-500 hover:text-gray-700">Privacy</a></li>
                  <li><a href="#" className="text-gray-500 hover:text-gray-700">Terms</a></li>
                  <li><a href="#" className="text-gray-500 hover:text-gray-700">Security</a></li>
                </ul>
              </div>
            </div>
          </div>
        </footer>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      <Navbar />
      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center pt-10 md:pt-20 px-4">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl md:text-3xl font-semibold text-[#383E45] mb-8 text-center"
        >
          Your PDF has been converted to an editable WORD document
        </motion.h1>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-4 mb-12"
        >
          <button
            onClick={() => router.push("/")}
            className="p-3 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-6 py-3 bg-[#e12d39] hover:bg-[#c42832] text-white rounded-lg text-lg font-semibold transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download WORD
          </button>

          <button 
            onClick={handleDelete}
            className="p-3 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </motion.div>

        {/* Share Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <h2 className="text-xl font-semibold text-[#383E45] mb-2">
            How can you thank us? Spread the word!
          </h2>
          <p className="text-gray-600 mb-4">
            Please share the tool to inspire more productive people!
          </p>
          <div className="flex gap-3 justify-center">
            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors">Trustpilot</button>
            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors">Facebook</button>
            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors">Twitter</button>
            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors">LinkedIn</button>
          </div>
        </motion.div>

        {/* Show conversion progress */}
        {isConverting && (
          <ConversionProgress 
            progress={conversionProgress}
            status="Converting PDF to Word"
          />
        )}

        {/* Show error if any */}
        {conversionError && (
          <div className="mt-6 max-w-xl mx-auto p-4 bg-red-50 border border-red-100 rounded-lg">
            <p className="text-red-600 text-sm">{conversionError}</p>
          </div>
        )}
      </main>
      <footer className="bg-white border-t border-gray-200 mt-auto">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-600 tracking-wider uppercase mb-4">
                  Product
                </h3>
                <ul className="space-y-3">
                  <li><a href="#" className="text-gray-500 hover:text-gray-700">Features</a></li>
                  <li><a href="#" className="text-gray-500 hover:text-gray-700">Pricing</a></li>
                  <li><a href="#" className="text-gray-500 hover:text-gray-700">Teams</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-600 tracking-wider uppercase mb-4">
                  Solutions
                </h3>
                <ul className="space-y-3">
                  <li><a href="#" className="text-gray-500 hover:text-gray-700">Convert PDF</a></li>
                  <li><a href="#" className="text-gray-500 hover:text-gray-700">Edit PDF</a></li>
                  <li><a href="#" className="text-gray-500 hover:text-gray-700">Sign PDF</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-600 tracking-wider uppercase mb-4">
                  Company
                </h3>
                <ul className="space-y-3">
                  <li><a href="#" className="text-gray-500 hover:text-gray-700">About</a></li>
                  <li><a href="#" className="text-gray-500 hover:text-gray-700">Blog</a></li>
                  <li><a href="#" className="text-gray-500 hover:text-gray-700">Contact</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-600 tracking-wider uppercase mb-4">
                  Legal
                </h3>
                <ul className="space-y-3">
                  <li><a href="#" className="text-gray-500 hover:text-gray-700">Privacy</a></li>
                  <li><a href="#" className="text-gray-500 hover:text-gray-700">Terms</a></li>
                  <li><a href="#" className="text-gray-500 hover:text-gray-700">Security</a></li>
                </ul>
              </div>
            </div>
          </div>
        </footer>
      {/* Timer Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-sm w-full mx-4"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">File available time</h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <p className="text-gray-600 text-center mb-6">
                All your files will be automatically deleted after
              </p>

              <div className="flex justify-center gap-8 mb-6">
                <div className="text-center">
                  <div className="text-4xl font-bold">{String(timeLeft.hours).padStart(2, '0')}</div>
                  <div className="text-gray-600">Hours</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold">{String(timeLeft.minutes).padStart(2, '0')}</div>
                  <div className="text-gray-600">Minutes</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold">{String(timeLeft.seconds).padStart(2, '0')}</div>
                  <div className="text-gray-600">Seconds</div>
                </div>
              </div>

              <button
                onClick={handleDeleteNow}
                className="w-full bg-[#e12d39] hover:bg-[#c42832] text-white py-3 rounded-lg transition-colors text-lg font-semibold"
              >
                Delete it now
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default PDFConverter
