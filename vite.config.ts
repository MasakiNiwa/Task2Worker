/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

// GitHub Pages では https://<user>.github.io/Task2Worker/ で配信される
export default defineConfig({
  base: '/Task2Worker/',
  plugins: [
    react(),
    // ホーム画面に追加でき、一度開けばオフラインでも動くようにする
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Task2Worker',
        short_name: 'Task2Worker',
        description: '生き抜くためのタスク管理ダッシュボード',
        lang: 'ja',
        theme_color: '#1e2025',
        background_color: '#1e2025',
        display: 'standalone',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    rolldownOptions: {
      output: {
        // 更新頻度の低いライブラリを分けてキャッシュを効かせる
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler|react-router)/ },
            { name: 'mantine', test: /node_modules[\\/](@mantine|@floating-ui)/ },
            { name: 'vendor', test: /node_modules/ },
          ],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
