import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createHead } from '@vueuse/head'
import App from './App.vue'
import router from './router'
import { setupGuards } from './router'
import './style.css'

// --- FIX: جلوگیری از کرش کردن برنامه با خطاهای هندل نشده ---
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    // اگر خطا AbortError بود، آن را نادیده بگیر
    if (event.reason && (event.reason.name === 'AbortError' || event.reason.message?.includes('aborted'))) {
      event.preventDefault()
      console.debug('Suppressed AbortError in main.ts')
    }
  })
}

const app = createApp(App)
const pinia = createPinia()
const head = createHead()

app.use(pinia)
app.use(router)
app.use(head)

// راه اندازی گاردهای روتر (Auth Guards)
setupGuards(router)

// مانت کردن برنامه پس از آماده شدن روتر
// از .catch استفاده می‌کنیم تا اگر روتر به هر دلیلی آماده نشد، باز هم برنامه مانت شود
router.isReady()
  .then(() => {
    app.mount('#app')
    console.log('SPA App Mounted Successfully')
  })
  .catch((err) => {
    console.error('Router isReady failed:', err)
    // تلاش برای مانت اضطراری
    app.mount('#app')
  })