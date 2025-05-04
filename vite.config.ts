import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import dsv from '@rollup/plugin-dsv'
import purgecss from '@fullhuman/postcss-purgecss'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'fs'
import path from 'path'

const plugins = [
  svelte(),
  dsv(),
  VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['favicon.svg', 'logo.png', 'apple-touch-icon.png'],
    manifest: {
      name: 'QuarAI',
      short_name: 'QuarAI',
      description: 'AI web interface',
      theme_color: '#000000',
      background_color: '#000000',
      display: 'standalone',
      scope: '/',
      start_url: '/',
      icons: [
        {
          src: '/logo.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/logo.png',
          sizes: '512x512',
          type: 'image/png'
        },
        {
          src: '/logo.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      runtimeCaching: [
        {
          urlPattern: ({ request }) =>
            request.destination === 'document' ||
            request.destination === 'script' ||
            request.destination === 'style' ||
            request.destination === 'image' ||
            request.destination === 'font',
          handler: 'CacheFirst',
          options: {
            cacheName: 'quarai-static',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24 * 30
            }
          }
        }
      ],
      maximumFileSizeToCacheInBytes: 10 * 1024 * 1024
    }
  })  
]

export default defineConfig(({ command }) => {
  const baseConfig = {
    plugins,
    server: {
      https: {
        key: fs.readFileSync(path.resolve(__dirname, 'cert/key.pem')),
        cert: fs.readFileSync(path.resolve(__dirname, 'cert/cert.pem'))
      },
      host: true
    }
  }

  if (command === 'build') {
    return {
      ...baseConfig,
      css: {
        postcss: {
          plugins: [
            purgecss({
              content: ['./**/*.html', './**/*.svelte'],
              safelist: ['pre', 'code']
            })
          ]
        }
      },
      base: './'
    }
  }

  return baseConfig
})
