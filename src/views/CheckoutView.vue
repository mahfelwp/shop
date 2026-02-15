<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
import { useToastStore } from '@/stores/toast'
import { useCouponStore } from '@/stores/coupon'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { CreditCard, MapPin, Loader2, Upload, AlertCircle, Copy, Plus, FileText, X, Ticket } from 'lucide-vue-next'
 
const cartStore = useCartStore()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const toastStore = useToastStore()
const couponStore = useCouponStore()
const router = useRouter()
const loading = ref(false)
 
// Validation State
const showErrors = ref(false)
 
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
  note: ''
})
 
// Coupon State
const couponCode = ref('')
const couponLoading = ref(false)
const appliedCoupon = ref<any>(null)
const discountAmount = ref(0)
const couponMessage = ref('')
const couponMessageType = ref<'success' | 'error'>('success')
 
onMounted(async () => {
  if (cartStore.totalItems === 0) {
    toastStore.showToast('سبد خرید شما خالی است', 'warning')
    router.push('/cart')
    return
  }
 
  settingsStore.fetchSettings()
  
  if (authStore.user) {
    const { data } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', authStore.user.id)
      .order('created_at', { ascending: false })
    
    if (data && data.length > 0) {
      savedAddresses.value = data
      selectedAddressId.value = data[0].id
    }
  }
})
 
watch(selectedAddressId, (newVal) => {
  // Reset validation errors when switching address mode
  showErrors.value = false
  
  if (newVal === 'new') {
    form.value.address = ''
    form.value.postalCode = ''
    form.value.phone = authStore.profile?.phone || ''
    form.value.fullName = authStore.profile?.full_name || ''
  } else {
    const addr = savedAddresses.value.find(a => a.id === newVal)
    if (addr) {
      form.value.address = addr.address
      form.value.postalCode = addr.postal_code || ''
      form.value.phone = addr.phone || authStore.profile?.phone || ''
    }
  }
})
 
// محاسبه قیمت نهایی
const finalPrice = computed(() => {
  const total = cartStore.totalPrice - discountAmount.value
  return total > 0 ? total : 0
})
 
const checkCoupon = async () => {
  if (!couponCode.value) return
  
  couponLoading.value = true
  couponMessage.value = ''
  
  const result = await couponStore.validateCoupon(couponCode.value, cartStore.totalPrice)
  
  if (result.valid && result.coupon) {
    appliedCoupon.value = result.coupon
    
    // محاسبه مقدار تخفیف
    if (result.coupon.discount_type === 'percent') {
      discountAmount.value = Math.round((cartStore.totalPrice * result.coupon.amount) / 100)
    } else {
      discountAmount.value = result.coupon.amount
    }
    
    // محدود کردن تخفیف به کل مبلغ سبد (نباید منفی شود)
    if (discountAmount.value > cartStore.totalPrice) {
      discountAmount.value = cartStore.totalPrice
    }
 
    couponMessageType.value = 'success'
    couponMessage.value = 'کد تخفیف با موفقیت اعمال شد'
    toastStore.showToast('کد تخفیف اعمال شد', 'success')
  } else {
    appliedCoupon.value = null
    discountAmount.value = 0
    couponMessageType.value = 'error'
    couponMessage.value = result.message || 'کد تخفیف نامعتبر است'
  }
  
  couponLoading.value = false
}
 
const removeCoupon = () => {
  appliedCoupon.value = null
  discountAmount.value = 0
  couponCode.value = ''
  couponMessage.value = ''
}
 
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
  const input = document.getElementById('receipt-input') as HTMLInputElement
  if (input) input.value = ''
}
 
const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
  toastStore.showToast('شماره کارت کپی شد', 'success', 2000)
}
 
const handlePayment = async () => {
  // 1. Trigger Validation UI
  showErrors.value = true
 
  if (!authStore.user) {
    router.push('/login')
    return
  }
 
  // 2. Validate Fields
  const isAddressValid = form.value.fullName && form.value.address && form.value.phone
  const isReceiptValid = paymentMethod.value === 'online' || (paymentMethod.value === 'card_to_card' && receiptFile.value)
 
  if (!isAddressValid) {
    toastStore.showToast('لطفا فیلدهای ستاره‌دار (ضروری) را تکمیل کنید', 'error')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
 
  if (!isReceiptValid) {
    toastStore.showToast('لطفا تصویر فیش واریزی را آپلود کنید', 'error')
    return
  }
 
  loading.value = true
  
  try {
    let receiptUrl = null
 
    if (paymentMethod.value === 'card_to_card' && receiptFile.value) {
      const fileName = `${authStore.user.id}_${Date.now()}_${receiptFile.value.name.replace(/[^a-zA-Z0-9.]/g, '')}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, receiptFile.value)
      
      if (uploadError) throw uploadError
      
      const { data: publicUrlData } = supabase.storage.from('receipts').getPublicUrl(fileName)
      receiptUrl = publicUrlData.publicUrl
    }
 
    const status = paymentMethod.value === 'online' ? 'pending' : 'pending_approval'
    
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: authStore.user.id,
        total_price: finalPrice.value, // استفاده از قیمت نهایی با تخفیف
        discount_amount: discountAmount.value, // ذخیره مبلغ تخفیف
        coupon_id: appliedCoupon.value?.id || null, // ذخیره شناسه کوپن
        status: status,
        shipping_address: `${form.value.address} - کدپستی: ${form.value.postalCode}`,
        receiver_name: form.value.fullName,
        receiver_phone: form.value.phone,
        payment_method: paymentMethod.value,
        payment_receipt_url: receiptUrl,
        note: form.value.note
      })
      .select()
      .single()
 
    if (orderError) throw orderError
 
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
 
    // افزایش تعداد استفاده از کد تخفیف
    if (appliedCoupon.value) {
      await couponStore.incrementUsage(appliedCoupon.value.id)
    }
 
    if (paymentMethod.value === 'online') {
      console.log('Redirecting to ZarinPal...')
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
          <div class="grid md:grid-cols-2 gap-4 animate-fade-in">
            <!-- Full Name -->
            <div class="space-y-1">
              <label class="text-sm text-gray-600 font-bold">
                نام و نام خانوادگی تحویل گیرنده <span class="text-red-500">*</span>
              </label>
              <input 
                v-model="form.fullName" 
                type="text" 
                class="w-full px-4 py-2 rounded-lg border outline-none transition"
                :class="showErrors && !form.fullName ? 'border-red-500 bg-red-50 focus:border-red-500' : 'border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500'"
              />
              <span v-if="showErrors && !form.fullName" class="text-xs text-red-500">این فیلد الزامی است</span>
            </div>
 
            <!-- Phone -->
            <div class="space-y-1">
              <label class="text-sm text-gray-600 font-bold">
                شماره موبایل <span class="text-red-500">*</span>
              </label>
              <input 
                v-model="form.phone" 
                type="tel" 
                class="w-full px-4 py-2 rounded-lg border outline-none transition"
                :class="showErrors && !form.phone ? 'border-red-500 bg-red-50 focus:border-red-500' : 'border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500'"
              />
              <span v-if="showErrors && !form.phone" class="text-xs text-red-500">این فیلد الزامی است</span>
            </div>
 
            <!-- Address -->
            <div class="md:col-span-2 space-y-1">
              <label class="text-sm text-gray-600 font-bold">
                آدرس کامل پستی <span class="text-red-500">*</span>
              </label>
              <textarea 
                v-model="form.address" 
                rows="3" 
                class="w-full px-4 py-2 rounded-lg border outline-none transition"
                :class="showErrors && !form.address ? 'border-red-500 bg-red-50 focus:border-red-500' : 'border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500'"
                :readonly="selectedAddressId !== 'new'"
              ></textarea>
              <span v-if="showErrors && !form.address" class="text-xs text-red-500">این فیلد الزامی است</span>
            </div>
 
            <!-- Postal Code -->
            <div class="space-y-1">
              <label class="text-sm text-gray-600">کد پستی (اختیاری)</label>
              <input 
                v-model="form.postalCode" 
                type="text" 
                class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none" 
                :readonly="selectedAddressId !== 'new'" 
              />
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
                  آپلود فیش واریزی <span class="text-red-500">*</span>
                </h3>
                
                <!-- Upload Box -->
                <div 
                  class="border-2 border-dashed rounded-xl p-6 text-center hover:bg-white transition cursor-pointer relative group"
                  :class="showErrors && !receiptFile ? 'border-red-400 bg-red-50' : 'border-stone-300'"
                >
                  <input id="receipt-input" type="file" accept="image/*" @change="handleFileUpload" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  
                  <div v-if="!receiptPreview" class="flex flex-col items-center gap-2 text-stone-500">
                    <Upload class="w-8 h-8" :class="showErrors && !receiptFile ? 'text-red-400' : 'text-stone-400'" />
                    <span class="text-sm" :class="showErrors && !receiptFile ? 'text-red-500 font-bold' : ''">
                      {{ showErrors && !receiptFile ? 'لطفا تصویر فیش را انتخاب کنید' : 'برای انتخاب تصویر کلیک کنید' }}
                    </span>
                  </div>
                  
                  <div v-else class="relative z-20">
                    <img :src="receiptPreview" class="max-h-40 mx-auto rounded-lg shadow-md" />
                    
                    <!-- Remove Button -->
                    <button 
                      @click.stop="removeReceipt" 
                      class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 transition z-30"
                      title="حذف تصویر"
                    >
                      <X class="w-4 h-4" />
                    </button>
                    
                    <span class="block mt-2 text-xs text-green-600 font-bold">تصویر انتخاب شد (برای تغییر کلیک کنید)</span>
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
          
          <!-- Coupon Section -->
          <div class="mb-6 border-b border-gray-100 pb-6">
            <label class="text-sm font-bold text-gray-700 mb-2 block flex items-center gap-2">
              <Ticket class="w-4 h-4" />
              کد تخفیف دارید؟
            </label>
            
            <div v-if="!appliedCoupon" class="flex gap-2">
              <input 
                v-model="couponCode" 
                type="text" 
                placeholder="کد تخفیف..." 
                class="flex-grow px-3 py-2 rounded-lg border border-gray-300 focus:border-stone-900 outline-none text-sm uppercase font-mono"
                @keyup.enter="checkCoupon"
              />
              <button 
                @click="checkCoupon" 
                :disabled="couponLoading || !couponCode"
                class="bg-stone-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-stone-800 transition disabled:opacity-70"
              >
                <Loader2 v-if="couponLoading" class="w-4 h-4 animate-spin" />
                <span v-else>ثبت</span>
              </button>
            </div>
 
            <div v-else class="bg-green-50 border border-green-200 rounded-lg p-3 flex justify-between items-center">
              <div>
                <span class="font-bold text-green-700 text-sm block">{{ appliedCoupon.code }}</span>
                <span class="text-xs text-green-600">تخفیف اعمال شد</span>
              </div>
              <button @click="removeCoupon" class="text-red-500 hover:text-red-700 p-1">
                <X class="w-4 h-4" />
              </button>
            </div>
 
            <p v-if="couponMessage" class="text-xs mt-2" :class="couponMessageType === 'success' ? 'text-green-600' : 'text-red-500'">
              {{ couponMessage }}
            </p>
          </div>
 
          <h2 class="font-bold text-lg mb-4 text-gray-800">مبلغ قابل پرداخت</h2>
          
          <div class="space-y-3 mb-6">
            <div class="flex justify-between items-center text-gray-600">
              <span>جمع کل خرید</span>
              <span>{{ cartStore.totalPrice.toLocaleString() }} <span class="text-xs">تومان</span></span>
            </div>
            
            <div v-if="discountAmount > 0" class="flex justify-between items-center text-red-500 font-bold">
              <span>تخفیف</span>
              <span>{{ discountAmount.toLocaleString() }}- <span class="text-xs">تومان</span></span>
            </div>
 
            <div class="border-t border-dashed border-gray-200 my-2"></div>
 
            <div class="flex justify-between items-center">
              <span class="font-bold text-gray-800">مبلغ نهایی</span>
              <span class="font-black text-xl text-primary-700">{{ finalPrice.toLocaleString() }} <span class="text-sm font-normal">تومان</span></span>
            </div>
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