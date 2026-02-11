import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useToastStore } from '@/stores/toast'

export interface Product {
  id: number
  title: string
  price: number
  image: string
  category: string
  min_order?: number
  max_order?: number
}

export interface CartItem extends Product {
  quantity: number
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  const toastStore = useToastStore()

  const addItem = (product: Product) => {
    const existingItem = items.value.find(item => item.id === product.id)
    const minOrder = product.min_order || 1
    const maxOrder = product.max_order || 999999

    if (existingItem) {
      if (existingItem.quantity < maxOrder) {
        existingItem.quantity++
      } else {
        toastStore.showToast(`حداکثر تعداد سفارش برای این محصول ${maxOrder} عدد است`, 'warning')
      }
    } else {
      items.value.push({ ...product, quantity: minOrder })
      toastStore.showToast('به سبد خرید اضافه شد', 'success', 1500)
    }
  }

  const decreaseItem = (productId: number) => {
    const existingItem = items.value.find(item => item.id === productId)
    if (existingItem) {
      const minOrder = existingItem.min_order || 1
      
      if (existingItem.quantity > minOrder) {
        existingItem.quantity--
      } else {
        removeItem(productId)
      }
    }
  }

  const removeItem = (productId: number) => {
    const index = items.value.findIndex(item => item.id === productId)
    if (index > -1) {
      items.value.splice(index, 1)
    }
  }

  const clearCart = () => {
    items.value = []
  }

  const totalItems = computed(() => {
    return items.value.reduce((total, item) => total + item.quantity, 0)
  })

  const totalPrice = computed(() => {
    return items.value.reduce((total, item) => total + (item.price * item.quantity), 0)
  })

  return { items, addItem, decreaseItem, removeItem, clearCart, totalItems, totalPrice }
})