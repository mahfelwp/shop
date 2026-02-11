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
}

export const useProductStore = defineStore('product', () => {
  const products = ref<Product[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // دریافت همه محصولات از سوپابیس
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
      error.value = 'خطا در دریافت محصولات'
    } finally {
      loading.value = false
    }
  }

  // دریافت محصولات ویژه برای صفحه اصلی
  const fetchFeaturedProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('is_featured', true)
      .limit(4)
    return data as Product[] || []
  }

  return { products, loading, error, fetchProducts, fetchFeaturedProducts }
})