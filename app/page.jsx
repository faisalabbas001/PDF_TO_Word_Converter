"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useDropzone } from "react-dropzone"
import Navbar from "./components/Navbar"
import pako from 'pako'

const initDB = async () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('PDFConverter', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('chunks')) {
        db.createObjectStore('chunks', { keyPath: 'id' })
      }
    }
  })
}

const storeChunk = async (db, id, data) => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['chunks'], 'readwrite')
    const store = transaction.objectStore('chunks')
    const request = store.put({ id, data })
    
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

const ProgressBar = ({ progress, status }) => {
  return (
    <div className="w-full max-w-xl mx-auto mt-6 px-4">
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
      {/* Upload speed and time estimation */}
      {progress > 0 && progress < 100 && (
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Time left: ~{Math.ceil((100 - progress) / 20)} seconds</span>
          <span>Upload speed: {(progress < 50 ? '1.2' : '2.4')} MB/S</span>
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [isConverting, setIsConverting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState(null)
  const [processingChunks, setProcessingChunks] = useState(false)
  const router = useRouter()

  // Move all useEffect hooks to the top level
  useEffect(() => {
    setMounted(true)
  }, [])

  // Add the conversion timeout effect
  useEffect(() => {
    let timeoutId

    if (isConverting) {
      // Disable the button completely after first click
      const button = document.querySelector('button[disabled]')
      if (button) {
        button.style.pointerEvents = 'none'
      }

      // Set a maximum loading time
      timeoutId = setTimeout(() => {
        setIsConverting(false)
        setError("Conversion is taking longer than expected. Please try again.")
      }, 30000) // 30 seconds timeout
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [isConverting])

  const handleFileChange = (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (file) {
      if (file.type !== "application/pdf") {
        setError("Please select a PDF file")
        return
      }
      if (file.size > 100 * 1024 * 1024) {
        setError("File size should be less than 100MB")
        return
      }
      setError(null)
      setSelectedFile(file)
    }
  }

  const handleConvertClick = async () => {
    if (!selectedFile || isConverting) return
    
    setIsConverting(true)
    setError(null)
    
    try {
      // Add a minimum loading time to prevent quick flashes
      const minLoadingTime = new Promise(resolve => setTimeout(resolve, 1500))
      
      // Your existing conversion logic
      const conversionPromise = (async () => {
        const db = await initDB()
        // Read the file as ArrayBuffer
        const arrayBuffer = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsArrayBuffer(selectedFile)
          
          reader.onprogress = (event) => {
            if (event.lengthComputable) {
              setUploadProgress(Math.round((event.loaded / event.total) * 50))
            }
          }
        })

        setUploadProgress(75)

        // Compress the ArrayBuffer directly
        const compressedData = pako.deflate(new Uint8Array(arrayBuffer))
        
        setUploadProgress(90)

        // Store the compressed data in chunks
        const chunkSize = 5 * 1024 * 1024 // 5MB chunks
        const totalChunks = Math.ceil(compressedData.length / chunkSize)

        // Store metadata
        sessionStorage.setItem(
          "pdfMetadata",
          JSON.stringify({
            fileName: selectedFile.name,
            fileType: selectedFile.type,
            fileSize: selectedFile.size,
            timestamp: new Date().getTime(),
            totalChunks,
            isCompressed: true,
            originalSize: arrayBuffer.byteLength,
            compressedSize: compressedData.length
          })
        )

        // Store chunks
        for (let i = 0; i < totalChunks; i++) {
          const start = i * chunkSize
          const end = Math.min(start + chunkSize, compressedData.length)
          const chunk = compressedData.slice(start, end)
          await storeChunk(db, `pdfChunk_${i}`, Array.from(chunk))
        }

        setUploadProgress(100)
      })()

      // Wait for both minimum time and conversion
      await Promise.all([minLoadingTime, conversionPromise])
      
      // Add a small delay before navigation for smooth transition
      await new Promise(resolve => setTimeout(resolve, 500))
      router.push("/editpdf")

    } catch (error) {
      console.error("Error processing PDF:", error)
      setError(error.message || "Error processing PDF. Please try again.")
      setIsConverting(false)
    }
  }

  const dropzoneConfig = useMemo(() => ({
    onDrop: handleFileChange,
    accept: {
      "application/pdf": [".pdf"],
    },
    multiple: false,
  }), [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone(dropzoneConfig)

  // Prevent hydration mismatch
  if (!mounted) {
    return null
  }

  const commonTools = [
    {
      name: "Compress PDF",
      icon: "/icons/compress.svg",
      description: "Reduce file size while optimizing quality",
      path: "/compress-pdf",
      bgColor: "bg-red-50",
    },
    {
      name: "Edit PDF",
      icon: "/icons/edit.svg",
      description: "Add text, images, shapes or draw",
      path: "/edit-pdf",
      bgColor: "bg-cyan-50",
    },
    {
      name: "Convert PDF",
      icon: "/icons/convert.svg",
      description: "Convert PDFs to Word, Excel, PPT and more",
      path: "/convert-pdf",
      bgColor: "bg-blue-50",
    },
    {
      name: "Merge PDF",
      icon: "/icons/merge.svg",
      description: "Combine PDFs in the order you want",
      path: "/merge-pdf",
      bgColor: "bg-purple-50",
    },
  ]

  return (
    <main className="min-h-screen">
      <Navbar />
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            PDF to Word Converter
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Convert your PDF to Word documents easily and edit them like the original
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
            <button 
              type="button"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Get Started
            </button>
            <button 
              type="button"
              className="border border-gray-300 px-8 py-4 rounded-lg hover:bg-gray-50 transition-colors"
            >
              See All Tools
            </button>
          </div>

          {/* Simplified File Drop Zone */}
          <div className="bg-white p-8 rounded-xl shadow-lg max-w-3xl mx-auto w-full p-8 relative transition-all duration-300 ease-in-out rounded-lg cursor-pointer
                  bg-[linear-gradient(90deg,transparent_50%,transparent_50%)_repeat] bg-[length:8px_2px] 
                  [background-position-x:0px] animate-border-dance">
            <div className="flex flex-col items-center gap-4">
              {/* Dropzone UI */}
              <div
                {...getRootProps()}
                className={`w-full p-8 border-2 border-dashed transition-all duration-300 ease-in-out rounded-lg cursor-pointer
                  ${
                    isDragActive
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                  }`}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center justify-center text-center">
                  <svg
                    className={`w-12 h-12 mb-4 transition-colors duration-300 ${
                      isDragActive ? "text-blue-500" : "text-gray-400"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className={`text-lg ${isDragActive ? "text-blue-500" : "text-gray-600"}`}>
                    {isDragActive ? "Drop your PDF here..." : "Drag & drop your PDF here, or click to select"}
                  </p>
                  <p className="text-sm text-gray-500 mt-2  ">Only PDF files are accepted</p>
                </div>
              </div>

              {/* File status and button */}
              {selectedFile && (
                <div className="w-full">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <p className="text-gray-700">
                        Selected: <span className="font-medium">{selectedFile.name}</span>
                      </p>
                    </div>
                    
                    {/* Enhanced Convert Button with Better Loading State */}
                    <button
                      onClick={handleConvertClick}
                      disabled={isConverting}
                      className={`w-full relative flex items-center justify-center text-white px-8 py-4 rounded-lg mt-4 transition-all duration-300
                        ${isConverting 
                          ? 'bg-blue-400 cursor-not-allowed' 
                          : 'bg-blue-600 hover:bg-blue-700 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]'
                        }`}
                    >
                      {isConverting ? (
                        <div className="flex items-center justify-center space-x-3">
                          <div className="relative">
                            {/* Outer spinning circle */}
                            <div className="w-6 h-6 border-3 border-blue-200 border-t-blue-100 rounded-full animate-spin"></div>
                            {/* Inner pulsing circle */}
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          </div>
                          <div className="flex flex-col items-start">
                            <span className="text-sm font-medium">Converting PDF to Word</span>
                            <span className="text-xs opacity-75">Please don't close this window...</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2 group">
                          <svg 
                            className="w-5 h-5 transform group-hover:rotate-6 transition-transform" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                            />
                          </svg>
                          <span>Convert PDF to Word</span>
                        </div>
                      )}
                    </button>

                    {/* Processing Status Message */}
                    {isConverting && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">
                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm text-blue-700 font-medium">Processing your document</p>
                            <p className="text-xs text-blue-600 mt-1">
                              This may take a few moments depending on the file size
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Common Tools Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Most Popular PDF Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {commonTools.map((tool) => (
              <Link
                key={tool.name}
                href={tool.path}
                className="group p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`${tool.bgColor} p-3 rounded-lg w-fit mb-4 group-hover:scale-110 transition-transform`}>
                  <div className="w-6 h-6"></div>
                </div>
                <h3 className="text-xl font-semibold mb-2">{tool.name}</h3>
                <p className="text-gray-600">{tool.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Our PDF Tools?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
              <p className="text-gray-600">Your files are automatically deleted after 2 hours</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy to Use</h3>
              <p className="text-gray-600">No installation or registration required</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Cloud-Based</h3>
              <p className="text-gray-600">Access your tools from any device, anywhere</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to make your PDF tasks easier?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join millions of users who trust our PDF tools for their document needs
          </p>
          <button className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors">
            Get Started Now - It's Free
          </button>
        </div>
      </section>

      {/* Add error message display */}
      {error && (
        <div className="w-full mt-4 p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      {/* Add progress bar */}
      {isConverting && (
        <div className="mt-8">
          <ProgressBar 
            progress={uploadProgress} 
            status={
              uploadProgress < 50 ? "Uploading file..." :
              uploadProgress < 75 ? "Processing PDF..." :
              uploadProgress < 90 ? "Compressing data..." :
              uploadProgress < 100 ? "Finalizing..." :
              "Complete!"
            }
          />
        </div>
      )}
    </main>
  )
}
