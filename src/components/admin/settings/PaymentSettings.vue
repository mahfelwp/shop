<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useToastStore } from '@/stores/toast'
import { Save, CreditCard, Globe } from 'lucide-vue-next'

const settingsStore = useSettingsStore()
const toastStore = useToastStore()

const form = ref({
  zarinpal_merchant: '',
  card_number: '',
  card_owner: '',
  card_shaba: '',
  bank_name: ''
})

onMounted(async () => {
  await settingsStore.fetchSettings()
  form.value = { ...settingsStore.settings }
})

const saveSettings = async () => {
  const error = await settingsStore.updateSettings(form.value)
  if (!error) {
    toastStore.showToast('تنظیمات درگاه ذخیره شد', 'success')
  } else {
    toastStore.showToast('خطا در ذخیره تنظیمات', 'error')
  }
}
</script>

<template>
  <div class="space-y-8 animate-fade-in">
    <div>
      <h3 class="font-bold text-lg text-stone-800 mb-1">تنظیمات درگاه و حساب‌ها</h3>
      <p class="text-sm text-stone-500">مدیریت روش‌های دریافت پول از مشتریان</p>
    </div>

    <!-- Zarinpal -->
    <div class="bg-stone-50 p-5 rounded-xl border border-stone-200">
      <h4 class="font-bold text-stone-800 mb-4 flex items-center gap-2">
        <Globe class="w-5 h-5 text-yellow-600" />
        درگاه پرداخت آنلاین (زرین پال)
      </h4>
      <div class="space-y-3">
        <label class="block text-sm font-medium text-stone-600">کد مرچنت (Merchant ID)</label>
        <input 
          v-model="form.zarinpal_merchant" 
          type="text" 
          class="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-stone-900 outline-none font-mono dir-ltr transition bg-white" 
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" 
        />
        <p class="text-xs text-stone-400">این کد را از پنل کاربری زرین‌پال دریافت کنید.</p>
      </div>
    </div>

    <!-- Card to Card -->
    <div class="bg-stone-50 p-5 rounded-xl border border-stone-200">
      <h4 class="font-bold text-stone-800 mb-4 flex items-center gap-2">
        <CreditCard class="w-5 h-5 text-blue-600" />
        اطلاعات کارت به کارت
      </h4>
      <div class="grid md:grid-cols-2 gap-5">
        <div class="space-y-2">
          <label class="block text-sm font-medium text-stone-600">نام بانک</label>
          <input v-model="form.bank_name" type="text" class="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-stone-900 outline-none bg-white transition" />
        </div>
        <div class="space-y-2">
          <label class="block text-sm font-medium text-stone-600">نام صاحب حساب</label>
          <input v-model="form.card_owner" type="text" class="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-stone-900 outline-none bg-white transition" />
        </div>
        <div class="md:col-span-2 space-y-2">
          <label class="block text-sm font-medium text-stone-600">شماره کارت</label>
          <input v-model="form.card_number" type="text" class="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-stone-900 outline-none font-mono dir-ltr bg-white transition" />
        </div>
        <div class="md:col-span-2 space-y-2">
          <label class="block text-sm font-medium text-stone-600">شماره شبا (بدون IR)</label>
          <div class="relative">
            <span class="absolute left-4 top-3.5 text-stone-400 font-mono">IR</span>
            <input v-model="form.card_shaba" type="text" class="w-full px-4 py-3 pl-10 rounded-xl border border-stone-300 focus:border-stone-900 outline-none font-mono dir-ltr bg-white transition" />
          </div>
        </div>
      </div>
    </div>

    <div class="pt-4 border-t border-stone-100">
      <button 
        @click="saveSettings" 
        class="bg-stone-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-accent transition flex items-center gap-2 shadow-lg shadow-stone-900/20"
      >
        <Save class="w-4 h-4" />
        ذخیره تغییرات
      </button>
    </div>
  </div>
</template>