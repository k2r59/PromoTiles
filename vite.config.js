import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [vue(), VitePWA({
    registerType: 'prompt',
    strategies: 'injectManifest',
    srcDir: 'src',
    filename: 'sw.js',
    includeAssets: ['icon.svg', 'icons/*.png'],
    manifest: {
      name: 'Promodev — Piano Challenge', short_name: 'Promodev',
      description: 'Le challenge musical de Noël entre collègues.', lang: 'fr',
      theme_color: '#071426', background_color: '#071426', display: 'standalone', start_url: '/',
      icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }],
    },
    injectManifest: { globPatterns: ['**/*.{js,css,html,woff2,svg,png,json,webp,mp3}'], maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
    },
  })],
  build: { rollupOptions: { output: { manualChunks: (id) => id.includes('/node_modules/three/') ? 'three' : undefined } } },
})
