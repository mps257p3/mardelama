import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  define: { __VERSAO__: JSON.stringify(new Date().toISOString()) },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['brand/*.png', 'destaque-padrao.jpg'],
      manifest: {
        name: 'Mar de Lama',
        short_name: 'Mar de Lama',
        lang: 'pt-BR',
        start_url: '/',
        display: 'standalone',
        background_color: '#F5F0E8',
        theme_color: '#F5F0E8',
        icons: [
          { src: '/brand/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/brand/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
        // fotos, links e textos de outros apps: o service worker guarda e abre a tela "Recebido"
        share_target: {
          action: '/compartilhar', method: 'POST', enctype: 'multipart/form-data',
          params: { title: 'title', text: 'text', url: 'url', files: [{ name: 'arquivos', accept: ['image/*', 'application/pdf', '.pdf'] }] },
        },
      },
      workbox: {
        importScripts: ['compartilhar-sw.js'],
        globPatterns: ['**/*.{js,css,html,png,jpg,svg,woff2}'],
        // o modelo de visão só carrega quando é usado; não entra na instalação do app
        globIgnores: ['**/transformers*.js', '**/ort-*', '**/pdf.worker*'],
        navigateFallback: '/index.html',
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        runtimeCaching: [{
          urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
          handler: 'CacheFirst',
          options: { cacheName: 'fontes', expiration: { maxEntries: 20, maxAgeSeconds: 31536000 } },
        }, {
          // imagens do Descobrir (acervos abertos): rolar de novo não baixa outra vez
          urlPattern: /^https:\/\/(www\.artic\.edu\/iiif|images\.metmuseum\.org|upload\.wikimedia\.org|i\.pinimg\.com)\/.*/,
          handler: 'CacheFirst',
          options: { cacheName: 'descobrir-img', expiration: { maxEntries: 400, maxAgeSeconds: 2592000 }, cacheableResponse: { statuses: [0, 200] } },
        }],
      },
    }),
  ],
})
