import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: number
  message: string
  type: ToastType
  duration?: number
}

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([])

  const showToast = (message: string, type: ToastType = 'info', duration: number = 3000) => {
    const id = Date.now() + Math.random()
    const toast: Toast = { id, message, type, duration }
    
    // افزودن به ابتدای آرایه برای نمایش جدیدترین‌ها در بالا
    toasts.value.unshift(toast)

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
  }

  const removeToast = (id: number) => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  return { toasts, showToast, removeToast }
})