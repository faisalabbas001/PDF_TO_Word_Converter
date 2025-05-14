import { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PDF to Word Converter',
  description: 'Convert PDF files to Word documents easily and accurately',
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
