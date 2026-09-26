import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

// Self-host the OCR engine so image/scanned-PDF OCR works fully offline (no CDN)
function ocrAssets() {
  const files: [string, string][] = [
    ['node_modules/tesseract.js/dist/worker.min.js', 'worker.min.js'],
    ['node_modules/tesseract.js-core/tesseract-core-lstm.wasm.js', 'tesseract-core-lstm.wasm.js'],
    ['node_modules/tesseract.js-core/tesseract-core-simd-lstm.wasm.js', 'tesseract-core-simd-lstm.wasm.js'],
    ['node_modules/tesseract.js-core/tesseract-core-relaxedsimd-lstm.wasm.js', 'tesseract-core-relaxedsimd-lstm.wasm.js'],
    ['node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz', 'eng.traineddata.gz'],
  ]
  return {
    name: 'mdify-ocr-assets',
    buildStart() {
      const out = resolve(__dirname, 'public/ocr')
      mkdirSync(out, { recursive: true })
      for (const [from, to] of files) {
        if (!existsSync(resolve(out, to))) copyFileSync(resolve(__dirname, from), resolve(out, to))
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  const isElectron = mode === 'electron'
  return {
  base: isElectron ? './' : '/',
  plugins: [
    ocrAssets(),
    react(),
    tailwindcss(),
    !isElectron &&
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg'],
        manifest: {
          name: 'Mdify — Anything to Markdown',
          short_name: 'Mdify',
          description: 'Convert any file or folder into clean Markdown. Offline.',
          theme_color: '#09090b',
          background_color: '#09090b',
          display: 'standalone',
          start_url: '/',
          icons: [
            { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
          share_target: undefined,
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,woff2,wasm,mjs}'],
          globIgnores: ['ocr/**'],
          maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname.startsWith('/ocr/'),
              handler: 'CacheFirst',
              options: { cacheName: 'mdify-ocr', expiration: { maxEntries: 10 } },
            },
          ],
        },
      }),
  ],
  build: { chunkSizeWarningLimit: 4000 },
}
})
