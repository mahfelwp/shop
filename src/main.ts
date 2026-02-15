import { ViteSSG } from 'vite-ssg'
import { createPinia } from 'pinia'
import App from './App.vue'
import { routes, setupGuards } from './router'
import './style.css'

// استفاده از ViteSSG به جای createApp معمولی
export const createApp = ViteSSG(
  App,
  { 
    routes,
    // تنظیم رفتار اسکرول برای تجربه کاربری بهتر
    scrollBehavior(to, from, savedPosition) {
      if (savedPosition) return savedPosition
      return { top: 0 }
    }
  },
  ({ app, router, routes, isClient, initialState }) => {
    const pinia = createPinia()
    app.use(pinia)
    
    // گاردهای روتر فقط در سمت کلاینت اجرا می‌شوند
    if (isClient) {
      setupGuards(router)
      
      // رفع باگ Hydration Mismatch برای صفحات ادمین
      // اگر در مسیر ادمین هستیم، صبر می‌کنیم تا روتر کاملا آماده شود
      router.isReady().then(() => {
        // لاجیک‌های اضافی کلاینت ساید اگر نیاز بود
      })
    }
  }
)