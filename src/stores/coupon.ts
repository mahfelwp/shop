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

  // دریافت لیست کدها
  const fetchCoupons = async () => {
    loading.value = true
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) {
      coupons.value = data
    }
    loading.value = false
    return error
  }

  // ایجاد کد جدید
  const createCoupon = async (coupon: Omit<Coupon, 'id' | 'created_at' | 'used_count'>) => {
    const { data, error } = await supabase
      .from('coupons')
      .insert([coupon])
      .select()
      .single()
    
    if (data) {
      coupons.value.unshift(data)
    }
    return error
  }

  // حذف کد
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

  // اعتبارسنجی کد تخفیف (برای استفاده در سبد خرید)
  const validateCoupon = async (code: string, orderAmount: number) => {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .single()
    
    if (error || !data) {
      return { valid: false, message: 'کد تخفیف نامعتبر است' }
    }

    // بررسی انقضا
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return { valid: false, message: 'مهلت استفاده از این کد تمام شده است' }
    }

    // بررسی تعداد استفاده
    if (data.usage_limit !== null && data.used_count >= data.usage_limit) {
      return { valid: false, message: 'ظرفیت استفاده از این کد تکمیل شده است' }
    }

    // بررسی حداقل خرید
    if (data.min_order_amount > 0 && orderAmount < data.min_order_amount) {
      return { valid: false, message: `حداقل خرید برای اعمال این کد ${data.min_order_amount.toLocaleString()} تومان است` }
    }

    return { valid: true, coupon: data }
  }

  // افزایش تعداد استفاده (بعد از ثبت سفارش موفق)
  const incrementUsage = async (id: number) => {
    const { data } = await supabase.from('coupons').select('used_count').eq('id', id).single()
    if (data) {
      await supabase.from('coupons').update({ used_count: data.used_count + 1 }).eq('id', id)
    }
  }

  return { 
    coupons, 
    loading, 
    fetchCoupons, 
    createCoupon, 
    deleteCoupon, 
    validateCoupon, 
    incrementUsage 
  }
})