<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useToastStore } from '@/stores/toast'
import { Save, Globe, Link, Loader2 } from 'lucide-vue-next'

const settingsStore = useSettingsStore()
const toastStore = useToastStore()
const saving = ref(false)

const form = ref({
  product_url_type: 'id' // 'id' | 'slug'
})

onMounted(async () => {
  await settingsStore.fetchSettings()
  form.value.product_url_type = settingsStore.settings.product_url_type || 'id'
})

const saveSettings = async () => {
  console.log('Save button clicked. Data:', form.value)
  saving.value = true
  
  try {
    const error = await settingsStore.updateSettings({
      product_url_type: form.value.product_url_type
    })
    
    console.log('Update result error:', error)

    if (!error) {
      toastStore.showToast('تنظیمات عمومی با موفقیت ذخیره شد', 'success')
    } else {
      toastStore.showToast('خطا در ذخیره تنظیمات: ' + (error.message || error), 'error')
    }
  } catch (e: any) {
    console.error('Unexpected error in saveSettings:', e)
    toastStore.showToast('خطای غیرمنتظره: ' + e.message, 'error')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-8 animate-fade-in">
    <div>
      <h3 class="font-bold text-lg text-stone-800 mb-1">تنظیمات عمومی سایت</h3>
      <p class="text-sm text-stone-500">پیکربندی ساختار آدرس‌دهی و سئو</p>
    </div>

    <!-- URL Structure -->
    <div class="bg-stone-50 p-5 rounded-xl border border-stone-200">
      <h4 class="font-bold text-stone-800 mb-4 flex items-center gap-2">
        <Link class="w-5 h-5 text-indigo-600" />
        ساختار آدرس محصولات (URL)
      </h4>
      
      <div class="space-y-4">
        <label class="flex items-start gap-3 p-4 bg-white border border-stone-200 rounded-xl cursor-pointer hover:border-indigo-300 transition relative overflow-hidden" :class="form.product_url_type === 'id' ? 'border-indigo-500 ring-1 ring-indigo-500' : ''">
          <input type="radio" v-model="form.product_url_type" value="id" class="mt-1 accent-indigo-600" />
          <div>
            <span class="font-bold text-stone-800 block mb-1">استفاده از شناسه (ID)</span>
            <span class="text-xs text-stone-500 dir-ltr block font-mono">example.com/products/123</span>
            <p class="text-xs text-stone-400 mt-2">ساده و کوتاه، اما برای سئو بهترین گزینه نیست.</p>
          </div>
        </label>

        <label class="flex items-start gap-3 p-4 bg-white border border-stone-200 rounded-xl cursor-pointer hover:border-indigo-300 transition relative overflow-hidden" :class="form.product_url_type === 'slug' ? 'border-indigo-500 ring-1 ring-indigo-500' : ''">
          <input type="radio" v-model="form.product_url_type" value="slug" class="mt-1 accent-indigo-600" />
          <div>
            <span class="font-bold text-stone-800 block mb-1">استفاده از نامک (Slug)</span>
            <span class="text-xs text-stone-500 dir-ltr block font-mono">example.com/products/my-product-name</span>
            <p class="text-xs text-stone-400 mt-2">بهترین گزینه برای سئو. نامک باید برای هر محصول یکتا باشد.</p>
          </div>
        </label>
      </div>
    </div>

    <div class="pt-4 border-t border-stone-100">
      <button 
        type="button"
        @click="saveSettings" 
        :disabled="saving"
        class="bg-stone-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-accent transition flex items-center gap-2 shadow-lg shadow-stone-900/20 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
        <Save v-else class="w-4 h-4" />
        <span v-if="saving">در حال ذخیره...</span>
        <span v-else>ذخیره تغییرات</span>
      </button>
    </div>
  </div>
</template>