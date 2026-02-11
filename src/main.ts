import { ViteSSG } from 'vite-ssg'
import { createPinia } from 'pinia'
import App from './App.vue'
import { routes, setupGuards } from './router'
import './style.css'

// استفاده از ViteSSG به جای createApp معمولی
export const createApp = ViteSSG(
  App,
  { routes },
  ({ app, router, routes, isClient, initialState }) => {
    const pinia = createPinia()
    app.use(pinia)
    
    // گاردهای روتر فقط در سمت کلاینت اجرا می‌شوند تا بیلد را خراب نکنند
    if (isClient) {
      setupGuards(router)
    }
  }
)