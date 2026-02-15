<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useToastStore } from '@/stores/toast'
import { useSettingsStore } from '@/stores/settings'
import { CreditCard, Upload, Loader2, CheckCircle2, X, Copy, AlertCircle } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toastStore = useToastStore()
const settingsStore = useSettingsStore()

const token = route.params.token as string
const order = ref<any>(null)
const loading = ref(true)
const submitting = ref(false)

const paymentMethod = ref<'online' | 'card_to_card'>('online')
const receiptFile = ref<File | null>(null)
const receiptPreview = ref<string | null>(null)

onMounted(async () => {
  if (!token) {
    router.push('/')
    return
  }
  
  await settingsStore.fetchSettings()

  // Fetch order by token
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('shipping_payment_token', token)
    .single()

  if (error || !data) {
    toastStore.showToast('سفارش یافت نشد یا لینک نامعتبر است', 'error')
    router.push('/')
  } else {
    order.value = data
    // اگر قبلاً پرداخت شده، ریدایرکت یا پیام
    if (data.shipping_payment_status === 'paid_separately') {
      toastStore.showToast('هزینه ارسال این سفارش قبلاً پرداخت شده است', 'success')
      router.push('/')
    }
  }
  loading.value = false
})

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    receiptFile.value = target.files[0]
    receiptPreview.value = URL.createObjectURL(target.files[0])
  }
}

const removeReceipt = () => {
  receiptFile.value = null
  receiptPreview.value = null
}

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
  toastStore.showToast('شماره کارت کپی شد', 'success')
}

const handleSubmit = async () => {
  if (paymentMethod.value === 'card_to_card' && !receiptFile.value) {
    toastStore.showToast('لطفا تصویر فیش واریزی را آپلود کنید', 'warning')
    return
  }

  submitting.value = true
  try {
    let receiptUrl = null
    if (paymentMethod.value === 'card_to_card' && receiptFile.value) {
      const fileName = `shipping_${order.value.id}_${Date.now()}_${receiptFile.value.name.replace(/[^a-zA-Z0-9.]/g, '')}`
      const { error: uploadError } = await supabase.storage.from('receipts').upload(fileName, receiptFile.value)
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('receipts').getPublicUrl(fileName)
      receiptUrl = data.publicUrl
    }

    // اگر پرداخت آنلاین بود (شبیه‌سازی)
    if (paymentMethod.value === 'online') {
      // اینجا باید به درگاه وصل شود. فعلاً مستقیم تایید می‌کنیم
      await supabase.from('orders').update({
        shipping_payment_status: 'paid_separately'
      }).eq('id', order.value.id)
      
      toastStore.showToast('پرداخت با موفقیت انجام شد', 'success')
      router.push('/')
    } else {
      // کارت به کارت: فقط آپلود فیش
      await supabase.from('orders').update({
        shipping_receipt_url: receiptUrl
        // وضعیت همچنان pending_payment می‌ماند تا ادمین تایید کند
      }).eq('id', order.value.id)
      
      toastStore.showToast('فیش واریزی ثبت شد و در انتظار تایید است', 'success')
      router.push('/')
    }

  } catch (e: any) {
    toastStore.showToast('خطا در ثبت پرداخت: ' + e.message, 'error')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-stone-50 flex items-center justify-center p-4">
    <div v-if="loading" class="text-center">
      <Loader2 class="w-10 h-10 animate-spin text-stone-400 mx-auto mb-4" />
      <p class="text-stone-500">در حال دریافت اطلاعات...</p>
    </div>

    <div v-else-if="order" class="bg-white w-full max-w-md rounded-3xl shadow-xl border border-stone-100 overflow-hidden">
      <div class="bg-stone-900 text-white p-6 text-center">
        <h1 class="text-xl font-bold mb-2">پرداخت هزینه ارسال</h1>
        <p class="text-stone-300 text-sm">سفارش شماره #{{ order.id }}</p>
      </div>

      <div class="p-6 space-y-6">
        <div class="text-center">
          <div class="text-sm text-stone-500 mb-1">مبلغ قابل پرداخت</div>
          <div class="text-3xl font-black text-stone-800">{{ order.shipping_cost_real.toLocaleString() }} <span class="text-sm font-normal text-stone-500">تومان</span></div>
        </div>

        <!-- Payment Method -->
        <div class="space-y-3">
          <label class="flex items-center justify-between p-4 border rounded-xl cursor-pointer transition relative overflow-hidden" :class="paymentMethod === 'online' ? 'border-yellow-400 bg-yellow-50 ring-1 ring-yellow-400' : 'border-gray-200 hover:bg-gray-50'">
            <div class="flex items-center gap-3 z-10">
              <input type="radio" v-model="paymentMethod" value="online" class="w-5 h-5 text-yellow-600 focus:ring-yellow-500" />
              <div>
                <span class="font-bold text-gray-800 block">پرداخت اینترنتی</span>
              </div>
            </div>
          </label>
          
          <label class="flex items-center justify-between p-4 border rounded-xl cursor-pointer transition relative overflow-hidden" :class="paymentMethod === 'card_to_card' ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-400' : 'border-gray-200 hover:bg-gray-50'">
            <div class="flex items-center gap-3 z-10">
              <input type="radio" v-model="paymentMethod" value="card_to_card" class="w-5 h-5 text-blue-600 focus:ring-blue-500" />
              <div>
                <span class="font-bold text-gray-800 block">کارت به کارت</span>
              </div>
            </div>
          </label>
        </div>

        <!-- Card Info & Upload -->
        <div v-if="paymentMethod === 'card_to_card'" class="bg-stone-50 p-4 rounded-xl border border-stone-200 animate-fade-in">
          <div class="bg-white p-3 rounded-lg border border-stone-200 mb-4 shadow-sm">
            <div class="flex justify-between items-center mb-2"><span class="text-stone-500 text-xs">بانک:</span><span class="font-bold text-sm">{{ settingsStore.settings.bank_name }}</span></div>
            <div class="flex justify-between items-center mb-2"><span class="text-stone-500 text-xs">صاحب حساب:</span><span class="font-bold text-sm">{{ settingsStore.settings.card_owner }}</span></div>
            <div class="flex justify-between items-center bg-stone-50 p-2 rounded border border-stone-100">
              <span class="text-stone-500 text-xs">شماره کارت:</span>
              <div class="flex items-center gap-2"><span class="font-mono font-bold dir-ltr">{{ settingsStore.settings.card_number }}</span><button @click="copyToClipboard(settingsStore.settings.card_number)" class="text-blue-600 hover:text-blue-800"><Copy class="w-4 h-4" /></button></div>
            </div>
          </div>

          <div class="border-2 border-dashed border-stone-300 rounded-xl p-4 text-center hover:bg-white transition cursor-pointer relative">
            <input type="file" accept="image/*" @change="handleFileUpload" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
            <div v-if="!receiptPreview" class="flex flex-col items-center gap-2 text-stone-400">
              <Upload class="w-6 h-6" />
              <span class="text-xs">آپلود فیش واریزی</span>
            </div>
            <div v-else class="relative z-20">
              <img :src="receiptPreview" class="max-h-32 mx-auto rounded-lg shadow-md" />
              <button @click.stop="removeReceipt" class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition z-30"><X class="w-3 h-3" /></button>
            </div>
          </div>
        </div>

        <button 
          @click="handleSubmit" 
          :disabled="submitting"
          class="w-full py-4 rounded-xl font-bold text-lg transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-70"
          :class="paymentMethod === 'online' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-blue-600 text-white hover:bg-blue-700'"
        >
          <Loader2 v-if="submitting" class="animate-spin w-5 h-5" />
          <span v-else>{{ paymentMethod === 'online' ? 'پرداخت آنلاین' : 'ثبت فیش' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>