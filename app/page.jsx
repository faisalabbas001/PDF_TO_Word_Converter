"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useDropzone } from "react-dropzone"
import Navbar from "./components/Navbar"
export default function Home() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [isConverting, setIsConverting] = useState(false)
  const router = useRouter()

  const handleFileChange = (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (file) {
      if (file.type !== "application/pdf") {
        alert("Please select a PDF file")
        return
      }
      setSelectedFile(file)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileChange,
    accept: {
      "application/pdf": [".pdf"],
    },
    multiple: false,
  })

  const handleConvertClick = async () => {
    if (!selectedFile) return
    setIsConverting(true)

    try {
      // Read file as ArrayBuffer instead of DataURL
      const arrayBuffer = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsArrayBuffer(selectedFile)
      })

      // Convert ArrayBuffer to Base64
      const base64 = btoa(
        new Uint8Array(arrayBuffer)
          .reduce((data, byte) => data + String.fromCharCode(byte), '')
      )

      // Store PDF data in sessionStorage
      sessionStorage.setItem(
        "pdfData",
        JSON.stringify({
          fileData: base64,
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          fileSize: selectedFile.size,
          timestamp: new Date().getTime(),
        })
      )

      // Navigate to edit page
      router.push("/editpdf")
    } catch (error) {
      console.error("Error processing PDF:", error)
      alert("Error processing PDF. Please try again.")
    } finally {
      setIsConverting(false)
    }
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
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">PDF to Word Converter</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Convert your PDF to Word documents easily and edit them like the original
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
            <button className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors">
              Get Started
            </button>
            <button className="border border-gray-300 px-8 py-4 rounded-lg hover:bg-gray-50 transition-colors">
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
                    <button
                      onClick={handleConvertClick}
                      disabled={isConverting}
                      className="w-full bg-blue-600 hover:bg-blue-700 cursor-pointer text-white px-8 py-3 rounded-lg mt-4 transition-colors duration-300 disabled:bg-blue-400"
                    >
                      {isConverting ? (
                        <span className="flex items-center justify-center">
                          <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Converting...
                        </span>
                      ) : (
                        "Convert PDF to Word"
                      )}
                    </button>
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
    </main>
  )
}
