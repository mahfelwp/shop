import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref({
    zarinpal_merchant: '',
    card_number: '',
    card_owner: '',
    card_shaba: '',
    bank_name: ''
  })
  const loading = ref(false)

  // دریافت تنظیمات از دیتابیس
  const fetchSettings = async () => {
    loading.value = true
    // فرض می‌کنیم یک جدول site_settings داریم که یک ردیف دارد
    // اگر جدول ندارید، فعلا مقادیر پیش‌فرض را برمی‌گرداند یا می‌توانید دستی در کد ست کنید
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .single()

    if (data && !error) {
      settings.value = { ...settings.value, ...data }
    }
    loading.value = false
  }

  // ذخیره تنظیمات
  const updateSettings = async (newSettings: any) => {
    loading.value = true
    
    // بررسی اینکه آیا ردیفی وجود دارد یا خیر
    const { data: existing } = await supabase.from('site_settings').select('id').single()

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
    }
    loading.value = false
    return error
  }

  return { settings, loading, fetchSettings, updateSettings }
})