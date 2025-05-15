/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  compress: true,
  poweredByHeader: false,
  images: {
    domains: ['cdnjs.cloudflare.com'],
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
        canvas: false,
        crypto: false,
        http: false,
        https: false,
        stream: false,
        zlib: false,
      }
    }
    
    // PDF.js worker configuration
    config.module.rules.push({
      test: /pdf\.worker\.(min\.)?js/,
      type: 'asset/resource',
      generator: {
        filename: 'static/worker/[hash][ext][query]',
      },
    })

    return config
  },
  experimental: {
    serverActions: true,
    serverComponentsExternalPackages: ['pdfjs-dist'],
  },
}

export default nextConfig

export const loadPdfjs = async () => {
  if (typeof window === 'undefined') {
    return null
  }
  
  const PDFJS = await import('pdfjs-dist/legacy/build/pdf')
  return PDFJS
}

export const getPdfWorkerSrc = () => {
  if (typeof window === 'undefined') {
    return ''
  }
  
  return `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${process.env.NEXT_PUBLIC_PDFJS_VERSION}/pdf.worker.min.js`
}
