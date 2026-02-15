import { ViteSSG } from 'vite-ssg'
import { createPinia } from 'pinia'
import App from './App.vue'
import { routes, setupGuards } from './router'
import './style.css'

// --- FIX: جلوگیری از کرش کردن برنامه با خطاهای هندل نشده ---
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    // اگر خطا AbortError بود، آن را نادیده بگیر تا کنسول قرمز نشود و برنامه متوقف نشود
    if (event.reason && (event.reason.name === 'AbortError' || event.reason.message?.includes('aborted'))) {
      event.preventDefault()
      console.debug('Suppressed AbortError in main.ts')
    }
  })
}

export const createApp = ViteSSG(
  App,
  { 
    routes,
    scrollBehavior(to, from, savedPosition) {
      if (savedPosition) return savedPosition
      return { top: 0 }
    }
  },
  ({ app, router, routes, isClient, initialState }) => {
    const pinia = createPinia()
    app.use(pinia)
    
    if (isClient) {
      setupGuards(router)
      
      router.isReady().then(() => {
        console.log('Router is ready')
      })
    }
  }
)