<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
import { useToastStore } from '@/stores/toast'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { CreditCard, MapPin, Truck, Loader2, Upload, AlertCircle, Copy, Plus, Home, Briefcase, FileText } from 'lucide-vue-next'
 
const cartStore = useCartStore()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const toastStore = useToastStore()
const router = useRouter()
const loading = ref(false)
 
const paymentMethod = ref<'online' | 'card_to_card'>('online')
const receiptFile = ref<File | null>(null)
const receiptPreview = ref<string | null>(null)
 
// Address Management
const savedAddresses = ref<any[]>([])
const selectedAddressId = ref<number | 'new'>('new')
 
const form = ref({
  fullName: authStore.profile?.full_name || '',
  phone: authStore.profile?.phone || '',
  address: '',
  postalCode: '',
  note: '' // فیلد جدید برای توضیحات سفارش
})
 
onMounted(async () => {
  settingsStore.fetchSettings()
  
  // Fetch Saved Addresses
  if (authStore.user) {
    const { data } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', authStore.user.id)
      .order('created_at', { ascending: false })
    
    if (data && data.length > 0) {
      savedAddresses.value = data
      selectedAddressId.value = data[0].id // Select first address by default
    }
  }
})
 
// Watch for address selection change
watch(selectedAddressId, (newVal) => {
  if (newVal === 'new') {
    form.value.address = ''
    form.value.postalCode = ''
    form.value.phone = authStore.profile?.phone || ''
  } else {
    const addr = savedAddresses.value.find(a => a.id === newVal)
    if (addr) {
      form.value.address = addr.address
      form.value.postalCode = addr.postal_code || ''
      form.value.phone = addr.phone || authStore.profile?.phone || ''
    }
  }
})
 
const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    receiptFile.value = target.files[0]
    receiptPreview.value = URL.createObjectURL(target.files[0])
  }
}
 
const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
  toastStore.showToast('شماره کارت کپی شد', 'success', 2000)
}
 
const handlePayment = async () => {
  if (!authStore.user) {
    router.push('/login')
    return
  }
 
  if (!form.value.fullName || !form.value.address || !form.value.phone) {
    toastStore.showToast('لطفا اطلاعات ارسال را کامل کنید', 'warning')
    return
  }
 
  if (paymentMethod.value === 'card_to_card' && !receiptFile.value) {
    toastStore.showToast('لطفا تصویر فیش واریزی را آپلود کنید', 'warning')
    return
  }
 
  loading.value = true
  
  try {
    let receiptUrl = null
 
    // 1. Upload Receipt if Card to Card
    if (paymentMethod.value === 'card_to_card' && receiptFile.value) {
      const fileName = `${authStore.user.id}_${Date.now()}_${receiptFile.value.name.replace(/[^a-zA-Z0-9.]/g, '')}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, receiptFile.value)
      
      if (uploadError) throw uploadError
      
      // Get Public URL
      const { data: publicUrlData } = supabase.storage.from('receipts').getPublicUrl(fileName)
      receiptUrl = publicUrlData.publicUrl
    }
 
    // 2. Create Order
    const status = paymentMethod.value === 'online' ? 'pending' : 'pending_approval'
    
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: authStore.user.id,
        total_price: cartStore.totalPrice,
        status: status,
        shipping_address: `${form.value.address} - کدپستی: ${form.value.postalCode}`,
        receiver_name: form.value.fullName,
        receiver_phone: form.value.phone,
        payment_method: paymentMethod.value,
        payment_receipt_url: receiptUrl,
        note: form.value.note // ارسال توضیحات به دیتابیس
      })
      .select()
      .single()
 
    if (orderError) throw orderError
 
    // 3. Create Order Items
    const orderItems = cartStore.items.map(item => ({
      order_id: orderData.id,
      product_id: item.id,
      quantity: item.quantity,
      price_at_purchase: item.price
    }))
 
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)
 
    if (itemsError) throw itemsError
 
    // 4. Handle Payment Redirect
    if (paymentMethod.value === 'online') {
      console.log('Redirecting to ZarinPal with Merchant:', settingsStore.settings.zarinpal_merchant)
      setTimeout(() => {
        cartStore.clearCart()
        router.push({ 
          name: 'payment-result', 
          query: { status: 'success', orderId: orderData.id.toString(), method: 'online' } 
        })
      }, 2000)
    } else {
      cartStore.clearCart()
      router.push({ 
        name: 'payment-result', 
        query: { status: 'success', orderId: orderData.id.toString(), method: 'card_to_card' } 
      })
    }
 
  } catch (error: any) {
    console.error('Error creating order:', error)
    toastStore.showToast('خطا در ثبت سفارش: ' + error.message, 'error')
  } finally {
    if (paymentMethod.value !== 'online') {
      loading.value = false
    }
  }
}
</script>
 
<template>
  <div class="container mx-auto px-4 py-8 pt-32">
    <h1 class="text-2xl font-bold text-gray-800 mb-8">تسویه حساب و پرداخت</h1>
 
    <div class="grid lg:grid-cols-3 gap-8">
      <!-- Shipping Info Form -->
      <div class="lg:col-span-2 space-y-6">
        
        <!-- Address Section -->
        <div class="bg-white p-6 rounded-2xl border border-primary-100">
          <div class="flex items-center gap-2 mb-6 text-primary-700">
            <MapPin class="w-6 h-6" />
            <h2 class="font-bold text-lg">آدرس تحویل سفارش</h2>
          </div>
 
          <!-- Saved Addresses Selection -->
          <div v-if="savedAddresses.length > 0" class="mb-6 grid gap-3">
            <label 
              v-for="addr in savedAddresses" 
              :key="addr.id"
              class="flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition relative"
              :class="selectedAddressId === addr.id ? 'border-stone-900 bg-stone-50 ring-1 ring-stone-900' : 'border-stone-200 hover:bg-stone-50'"
            >
              <input type="radio" :value="addr.id" v-model="selectedAddressId" class="mt-1 accent-stone-900" />
              <div class="flex-grow">
                <div class="flex items-center gap-2 mb-1">
                  <span class="font-bold text-stone-800 text-sm">{{ addr.title }}</span>
                  <span class="text-xs text-stone-500 bg-white px-2 py-0.5 rounded border border-stone-100">{{ addr.phone }}</span>
                </div>
                <p class="text-sm text-stone-600 leading-relaxed">{{ addr.address }}</p>
              </div>
            </label>
 
            <!-- New Address Option -->
            <label 
              class="flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition border-dashed"
              :class="selectedAddressId === 'new' ? 'border-stone-900 bg-stone-50' : 'border-stone-300 hover:bg-stone-50'"
            >
              <input type="radio" value="new" v-model="selectedAddressId" class="accent-stone-900" />
              <span class="font-bold text-stone-700 text-sm flex items-center gap-2">
                <Plus class="w-4 h-4" />
                افزودن / نوشتن آدرس جدید
              </span>
            </label>
          </div>
          
          <!-- Form Fields -->
          <div class="grid md:grid-cols-2 gap-4 animate-fade-in" :class="{ 'opacity-50 pointer-events-none': selectedAddressId !== 'new' && false }">
            <div class="space-y-1">
              <label class="text-sm text-gray-600">نام و نام خانوادگی تحویل گیرنده</label>
              <input v-model="form.fullName" type="text" class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none" />
            </div>
            <div class="space-y-1">
              <label class="text-sm text-gray-600">شماره موبایل</label>
              <input v-model="form.phone" type="tel" class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none" />
            </div>
            <div class="md:col-span-2 space-y-1">
              <label class="text-sm text-gray-600">آدرس کامل پستی</label>
              <textarea v-model="form.address" rows="3" class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none" :readonly="selectedAddressId !== 'new'"></textarea>
            </div>
            <div class="space-y-1">
              <label class="text-sm text-gray-600">کد پستی (اختیاری)</label>
              <input v-model="form.postalCode" type="text" class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none" :readonly="selectedAddressId !== 'new'" />
            </div>
          </div>
        </div>
 
        <!-- Additional Info (Note) Section -->
        <div class="bg-white p-6 rounded-2xl border border-primary-100">
          <div class="flex items-center gap-2 mb-4 text-primary-700">
            <FileText class="w-6 h-6" />
            <h2 class="font-bold text-lg">توضیحات سفارش (اختیاری)</h2>
          </div>
          <p class="text-sm text-stone-500 mb-3">
            اگر نکته‌ای برای تحویل سفارش دارید (مانند زمان تحویل، نیاز به فاکتور رسمی و ...) اینجا بنویسید.
          </p>
          <textarea 
            v-model="form.note" 
            rows="3" 
            placeholder="مثلا: لطفا قبل از ارسال تماس بگیرید..."
            class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-stone-900 outline-none transition"
          ></textarea>
        </div>
 
        <!-- Payment Method -->
        <div class="bg-white p-6 rounded-2xl border border-primary-100">
          <div class="flex items-center gap-2 mb-4 text-primary-700">
            <CreditCard class="w-6 h-6" />
            <h2 class="font-bold text-lg">شیوه پرداخت</h2>
          </div>
          
          <div class="space-y-4">
            <!-- Online Payment Option -->
            <label class="flex items-center justify-between p-4 border rounded-xl cursor-pointer transition relative overflow-hidden" :class="paymentMethod === 'online' ? 'border-yellow-400 bg-yellow-50 ring-1 ring-yellow-400' : 'border-gray-200 hover:bg-gray-50'">
              <div class="flex items-center gap-3 z-10">
                <input type="radio" v-model="paymentMethod" value="online" class="w-5 h-5 text-yellow-600 focus:ring-yellow-500" />
                <div>
                  <span class="font-bold text-gray-800 block">پرداخت اینترنتی (زرین پال)</span>
                  <span class="text-xs text-gray-500">پرداخت با کلیه کارت‌های عضو شتاب</span>
                </div>
              </div>
              <div class="bg-white px-2 py-1 rounded text-xs font-bold text-blue-800 border border-blue-200 z-10">ZarinPal</div>
            </label>
 
            <!-- Card to Card Option -->
            <label class="flex items-center justify-between p-4 border rounded-xl cursor-pointer transition relative overflow-hidden" :class="paymentMethod === 'card_to_card' ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-400' : 'border-gray-200 hover:bg-gray-50'">
              <div class="flex items-center gap-3 z-10">
                <input type="radio" v-model="paymentMethod" value="card_to_card" class="w-5 h-5 text-blue-600 focus:ring-blue-500" />
                <div>
                  <span class="font-bold text-gray-800 block">کارت به کارت (واریز به حساب)</span>
                  <span class="text-xs text-gray-500">ارسال فیش واریزی جهت تایید</span>
                </div>
              </div>
            </label>
 
            <!-- Card Details & Upload Section -->
            <div v-if="paymentMethod === 'card_to_card'" class="mt-4 p-5 bg-stone-50 rounded-xl border border-stone-200 animate-fade-in">
              <div class="mb-6">
                <h3 class="font-bold text-stone-800 mb-3 text-sm">اطلاعات حساب جهت واریز:</h3>
                <div class="bg-white p-4 rounded-lg border border-stone-200 space-y-3 shadow-sm">
                  <div class="flex justify-between items-center">
                    <span class="text-stone-500 text-sm">بانک:</span>
                    <span class="font-bold">{{ settingsStore.settings.bank_name || 'بانک ملی' }}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-stone-500 text-sm">صاحب حساب:</span>
                    <span class="font-bold">{{ settingsStore.settings.card_owner || 'مدیریت فروشگاه' }}</span>
                  </div>
                  <div class="flex justify-between items-center bg-stone-50 p-2 rounded border border-stone-100">
                    <span class="text-stone-500 text-sm">شماره کارت:</span>
                    <div class="flex items-center gap-2">
                      <span class="font-mono font-bold text-lg dir-ltr">{{ settingsStore.settings.card_number || '----' }}</span>
                      <button @click="copyToClipboard(settingsStore.settings.card_number)" class="text-blue-600 hover:text-blue-800"><Copy class="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div v-if="settingsStore.settings.card_shaba" class="flex justify-between items-center">
                    <span class="text-stone-500 text-sm">شبا:</span>
                    <span class="font-mono text-xs text-stone-600">IR{{ settingsStore.settings.card_shaba }}</span>
                  </div>
                </div>
              </div>
 
              <div>
                <h3 class="font-bold text-stone-800 mb-3 text-sm flex items-center gap-2">
                  <Upload class="w-4 h-4" />
                  آپلود فیش واریزی
                </h3>
                <div class="border-2 border-dashed border-stone-300 rounded-xl p-6 text-center hover:bg-white transition cursor-pointer relative">
                  <input type="file" accept="image/*" @change="handleFileUpload" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <div v-if="!receiptPreview" class="flex flex-col items-center gap-2 text-stone-500">
                    <Upload class="w-8 h-8 text-stone-400" />
                    <span class="text-sm">برای انتخاب تصویر کلیک کنید</span>
                  </div>
                  <div v-else class="relative">
                    <img :src="receiptPreview" class="max-h-40 mx-auto rounded-lg shadow-md" />
                    <span class="block mt-2 text-xs text-green-600 font-bold">تصویر انتخاب شد</span>
                  </div>
                </div>
                <div class="flex items-start gap-2 mt-3 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                  <AlertCircle class="w-4 h-4 shrink-0" />
                  <p>سفارش شما پس از بررسی فیش واریزی توسط مدیریت تایید و ارسال خواهد شد.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
 
      </div>
 
      <!-- Summary & Pay Button -->
      <div class="lg:col-span-1">
        <div class="bg-white p-6 rounded-2xl border border-primary-100 sticky top-32">
          <h2 class="font-bold text-lg mb-4 text-gray-800">مبلغ قابل پرداخت</h2>
          
          <div class="flex justify-between items-center mb-6">
            <span class="text-gray-600">جمع کل خرید</span>
            <span class="font-bold text-xl text-primary-700">{{ cartStore.totalPrice.toLocaleString() }} <span class="text-sm font-normal">تومان</span></span>
          </div>
 
          <button 
            @click="handlePayment"
            :disabled="loading"
            class="w-full text-white py-4 rounded-xl font-bold text-lg transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
            :class="paymentMethod === 'online' ? 'bg-green-600 hover:bg-green-700 shadow-green-600/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'"
          >
            <Loader2 v-if="loading" class="animate-spin w-6 h-6" />
            <span v-else>
              {{ paymentMethod === 'online' ? 'پرداخت آنلاین' : 'ثبت فیش و سفارش' }}
            </span>
          </button>
          
          <p v-if="paymentMethod === 'online'" class="text-xs text-gray-400 text-center mt-4">
            انتقال به درگاه امن بانکی
          </p>
        </div>
      </div>
    </div>
  </div>
</template>