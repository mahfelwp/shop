import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
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
    // این بخش حیاتی است: تعیین می‌کند کدام صفحات بیلد شوند و کدام نشوند
    includedRoutes(paths, routes) {
      // حذف صفحات ادمین، پروفایل، سبد خرید و چک‌اوت از پروسه بیلد استاتیک
      // این صفحات به صورت SPA در مرورگر کاربر رندر می‌شوند
      return paths.filter(i => 
        !i.includes('/admin') && 
        !i.includes('/profile') && 
        !i.includes('/cart') && 
        !i.includes('/checkout')
      )
    },
    onFinished() { 
      console.log('Build finished. Static pages generated for SEO.') 
    }
  }
})