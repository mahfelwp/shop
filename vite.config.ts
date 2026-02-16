import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // جلوگیری از تکه‌تکه شدن بیش از حد CSS
    cssCodeSplit: false,
    // افزایش محدودیت حجم چانک‌ها
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  server: {
    host: true,
    port: 3000,
  }
})