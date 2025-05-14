import { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PDF to Word Converter',
  description: 'Convert PDF files to Word documents easily and accurately',
  openGraph: {
    title: 'PDF to Word Converter',
    description: 'Convert PDF files to Word documents easily and accurately',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: 'PDF Converter',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
