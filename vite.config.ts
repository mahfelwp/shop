import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  // تنظیم بیس برای اطمینان از لود صحیح فایل‌ها در سرور
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // جلوگیری از تکه‌تکه شدن بیش از حد CSS که باعث خطای لود می‌شود
    cssCodeSplit: false,
    // افزایش محدودیت حجم چانک‌ها برای جلوگیری از هشدارهای بیلد
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
  },
  // تنظیمات اختصاصی SSG
  // @ts-ignore
  ssgOptions: {
    script: 'async',
    formatting: 'minify',
    // استراتژی نقد کردن برای جلوگیری از باگ‌های Hydration
    crittersOptions: {
      reduceInlineStyles: false,
    },
    // این بخش حیاتی است: تعیین می‌کند کدام صفحات بیلد شوند و کدام نشوند
    includedRoutes(paths, routes) {
      // تمام صفحات ادمین و داینامیک را از بیلد استاتیک حذف می‌کنیم
      // تا به صورت SPA کامل اجرا شوند و مشکل Hydration نداشته باشند
      return paths.filter(i => 
        !i.includes('/login') && 
        !i.includes('/admin') && 
        !i.includes('/profile') && 
        !i.includes('/cart') && 
        !i.includes('/checkout') &&
        !i.includes('/pay-shipping')
      )
    },
    onFinished() { 
      console.log('Build finished. Static pages generated for SEO.') 
    }
  }
})