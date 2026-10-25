import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: { proxy: { '/api': { target: 'http://localhost:5175', changeOrigin: false } } },
  plugins: [vue(), VitePWA({
    registerType: 'prompt',
    useCredentials: true,
    strategies: 'injectManifest',
    srcDir: 'src',
    filename: 'sw.js',
    includeAssets: ['icon.svg', 'icons/*.png'],
    manifest: {
      name: 'promoTiles', short_name: 'promoTiles',
      description: 'Le challenge musical de Noël entre collègues.', lang: 'fr',
      id: '/', scope: '/', categories: ['games','music'],
      theme_color: '#071426', background_color: '#071426', display: 'standalone', start_url: '/',
      icons: [{ src: '/icons/promotiles-192.png', sizes: '192x192', type: 'image/png' }, { src: '/icons/promotiles-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }, { src: '/icons/promotiles-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }],
    },
    injectManifest: { globPatterns: ['**/*.{js,css,html,woff2,svg,png,json,webp}'], globIgnores: ['music/catalog/**', 'music/artwork/**', 'music/credits.json'], maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
    },
  })],
  build: { rollupOptions: { output: { manualChunks: (id) => id.includes('/node_modules/three/') ? 'three' : undefined } } },
})
