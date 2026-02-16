import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export interface Product {
  id: number
  title: string
  price: number
  image: string
  category: string
  description?: string
  is_featured?: boolean
  gallery?: string[]
  video?: string
  min_order?: number
  max_order?: number
  created_at?: string
  slug?: string
}

export const useProductStore = defineStore('product', () => {
  const products = ref<Product[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchProducts = async () => {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (err) throw err
      products.value = data as Product[]
    } catch (e: any) {
      console.error('Error fetching products:', e)
      // اگر خطا AbortError بود، یعنی درخواست کنسل شده، نیازی به نمایش خطا به کاربر نیست
      if (e.message && e.message.includes('AbortError')) {
        console.debug('Product fetch aborted')
      } else {
        error.value = 'خطا در دریافت محصولات'
      }
    } finally {
      loading.value = false
    }
  }

  const fetchFeaturedProducts = async () => {
    try {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('is_featured', true)
        .limit(4)
      return data as Product[] || []
    } catch (e) {
      console.error('Error fetching featured:', e)
      return []
    }
  }

  return { products, loading, error, fetchProducts, fetchFeaturedProducts }
})