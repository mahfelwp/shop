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

  // دریافت تنظیمات کلی
  const fetchSettings = async () => {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .maybeSingle() // Use maybeSingle to avoid error on empty table

      if (data && !error) {
        settings.value = { ...settings.value, ...data }
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
    console.log('Store: Updating settings...', newSettings)
    
    try {
      // Check if row exists
      const { data: existing, error: fetchError } = await supabase
        .from('site_settings')
        .select('id')
        .maybeSingle()

      if (fetchError) {
        console.error('Store: Error checking existing settings:', fetchError)
        loading.value = false
        return fetchError
      }

      let error
      if (existing) {
        console.log('Store: Updating existing row ID:', existing.id)
        const { error: updateError } = await supabase
          .from('site_settings')
          .update(newSettings)
          .eq('id', existing.id)
        error = updateError
      } else {
        console.log('Store: Inserting new settings row')
        const { error: insertError } = await supabase
          .from('site_settings')
          .insert([newSettings])
        error = insertError
      }

      if (!error) {
        settings.value = { ...settings.value, ...newSettings }
        console.log('Store: Settings updated successfully')
      } else {
        console.error('Store: Supabase update error:', error)
      }
      
      loading.value = false
      return error
    } catch (err: any) {
      console.error('Store: Exception in updateSettings:', err)
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
    fetchSettings, 
    updateSettings,
    fetchShippingMethods,
    addShippingMethod,
    updateShippingMethod,
    deleteShippingMethod
  }
})