import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export interface ShippingMethod {
  id: number
  title: string
  cost: number
  type: 'post' | 'courier'
  cost_type: 'fixed' | 'pas_kerayeh' | 'calculated_later'
  tracking_url_template?: string
  is_active: boolean
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref({
    zarinpal_merchant: '',
    card_number: '',
    card_owner: '',
    card_shaba: '',
    bank_name: '',
    product_url_type: 'id' // 'id' or 'slug'
  })
  
  const shippingMethods = ref<ShippingMethod[]>([])
  const loading = ref(false)
  const isLoaded = ref(false) // وضعیت لود شدن تنظیمات

  // دریافت تنظیمات کلی
  const fetchSettings = async () => {
    if (isLoaded.value) return // اگر قبلا لود شده، دوباره نگیر

    loading.value = true
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .maybeSingle()

      if (data && !error) {
        settings.value = { ...settings.value, ...data }
        isLoaded.value = true
      } else if (error) {
        console.error('Error fetching settings:', error)
      }
    } catch (e) {
      console.error('Exception fetching settings:', e)
    } finally {
      loading.value = false
    }
  }

  // ذخیره تنظیمات کلی
  const updateSettings = async (newSettings: any) => {
    loading.value = true
    
    try {
      const { data: existing, error: fetchError } = await supabase
        .from('site_settings')
        .select('id')
        .maybeSingle()

      if (fetchError) {
        loading.value = false
        return fetchError
      }

      let error
      if (existing) {
        const { error: updateError } = await supabase
          .from('site_settings')
          .update(newSettings)
          .eq('id', existing.id)
        error = updateError
      } else {
        const { error: insertError } = await supabase
          .from('site_settings')
          .insert([newSettings])
        error = insertError
      }

      if (!error) {
        settings.value = { ...settings.value, ...newSettings }
        isLoaded.value = true // تنظیمات جدید معتبر هستند
      }
      
      loading.value = false
      return error
    } catch (err: any) {
      loading.value = false
      return { message: err.message || 'Unknown error' }
    }
  }

  // --- Shipping Methods ---

  const fetchShippingMethods = async () => {
    loading.value = true
    const { data, error } = await supabase
      .from('shipping_methods')
      .select('*')
      .order('id')
    
    if (data) {
      shippingMethods.value = data
    }
    loading.value = false
  }

  const addShippingMethod = async (method: Omit<ShippingMethod, 'id'>) => {
    const { data, error } = await supabase
      .from('shipping_methods')
      .insert([method])
      .select()
      .single()
    
    if (data) {
      shippingMethods.value.push(data)
    }
    return error
  }

  const updateShippingMethod = async (id: number, updates: Partial<ShippingMethod>) => {
    const { data, error } = await supabase
      .from('shipping_methods')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (data) {
      const index = shippingMethods.value.findIndex(m => m.id === id)
      if (index !== -1) shippingMethods.value[index] = data
    }
    return error
  }

  const deleteShippingMethod = async (id: number) => {
    const { error } = await supabase
      .from('shipping_methods')
      .delete()
      .eq('id', id)
    
    if (!error) {
      shippingMethods.value = shippingMethods.value.filter(m => m.id !== id)
    }
    return error
  }

  return { 
    settings, 
    shippingMethods, 
    loading, 
    isLoaded,
    fetchSettings, 
    updateSettings,
    fetchShippingMethods,
    addShippingMethod,
    updateShippingMethod,
    deleteShippingMethod
  }
})