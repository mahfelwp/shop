import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
 
export interface Coupon {
  id: number
  code: string
  discount_type: 'percent' | 'fixed'
  amount: number
  min_order_amount: number
  expires_at: string | null
  usage_limit: number | null
  used_count: number
  created_at: string
}
 
export const useCouponStore = defineStore('coupon', () => {
  const coupons = ref<Coupon[]>([])
  const loading = ref(false)
 
  const fetchCoupons = async () => {
    loading.value = true
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) {
      coupons.value = data as Coupon[]
    }
    loading.value = false
  }
 
  const createCoupon = async (couponData: any) => {
    const { data, error } = await supabase
      .from('coupons')
      .insert([couponData])
      .select()
      .single()
    
    if (data) {
      coupons.value.unshift(data as Coupon)
      return null
    }
    return error
  }
 
  const deleteCoupon = async (id: number) => {
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id)
    
    if (!error) {
      coupons.value = coupons.value.filter(c => c.id !== id)
    }
    return error
  }
 
  return { coupons, loading, fetchCoupons, createCoupon, deleteCoupon }
})