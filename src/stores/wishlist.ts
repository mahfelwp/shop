import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useToastStore } from '@/stores/toast'

export const useWishlistStore = defineStore('wishlist', () => {
  // بازیابی از لوکال استوریج
  const saved = localStorage.getItem('wishlist_items')
  const items = ref<number[]>(saved ? JSON.parse(saved) : [])
  
  const toastStore = useToastStore()

  // ذخیره خودکار تغییرات
  watch(items, (newVal) => {
    localStorage.setItem('wishlist_items', JSON.stringify(newVal))
  }, { deep: true })

  const toggleWishlist = (productId: number) => {
    const index = items.value.indexOf(productId)
    if (index === -1) {
      items.value.push(productId)
      toastStore.showToast('به لیست علاقه‌مندی‌ها اضافه شد', 'success')
    } else {
      items.value.splice(index, 1)
      toastStore.showToast('از لیست علاقه‌مندی‌ها حذف شد', 'info')
    }
  }

  const isInWishlist = (productId: number) => {
    return items.value.includes(productId)
  }

  return { items, toggleWishlist, isInWishlist }
})