<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Package, Truck, CheckCircle2, ClipboardList, XCircle, Clock, ChevronDown, ChevronUp, ShoppingBag, CreditCard, Wallet, Receipt, Phone } from 'lucide-vue-next'
import { useToastStore } from '@/stores/toast'
import { useSettingsStore } from '@/stores/settings'
 
const props = defineProps<{
  orders: any[]
  loading: boolean
}>()
 
const toastStore = useToastStore()
const settingsStore = useSettingsStore()
const expandedOrders = ref<Set<number>>(new Set())
 
onMounted(() => {
  settingsStore.fetchShippingMethods()
})

const toggleOrderDetails = (orderId: number) => {
  if (expandedOrders.has(orderId)) {
    expandedOrders.value.delete(orderId)
  } else {
    expandedOrders.value.add(orderId)
  }
}
 
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fa-IR')
}
 
const orderSteps = [
  { status: 'pending', label: 'ثبت سفارش', icon: ClipboardList },
  { status: 'processing', label: 'پردازش و بسته‌بندی', icon: Package },
  { status: 'shipped', label: 'تحویل به پست/پیک', icon: Truck },
  { status: 'delivered', label: 'تحویل به مشتری', icon: CheckCircle2 }
]
 
const getCurrentStepIndex = (status: string) => {
  if (status === 'pending' || status === 'pending_approval' || status === 'paid') return 0
  if (status === 'processing') return 1
  if (status === 'shipped') return 2
  if (status === 'delivered') return 3
  return -1
}
 
const getStatusColor = (status: string) => {
  switch(status) {
    case 'paid': return 'bg-blue-100 text-blue-700'
    case 'processing': return 'bg-purple-100 text-purple-700'
    case 'shipped': return 'bg-indigo-100 text-indigo-700'
    case 'delivered': return 'bg-green-100 text-green-700'
    case 'cancelled': return 'bg-red-100 text-red-700'
    case 'pending_approval': return 'bg-orange-100 text-orange-700'
    default: return 'bg-yellow-100 text-yellow-700'
  }
}
 
const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    'pending': 'در انتظار پرداخت',
    'pending_approval': 'در انتظار تایید فیش',
    'paid': 'پرداخت شده',
    'processing': 'در حال آماده‌سازی',
    'shipped': 'تحویل پست/پیک شده',
    'delivered': 'تحویل شده',
    'cancelled': 'لغو شده'
  }
  return map[status] || status
}
 
const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
  toastStore.showToast('کد کپی شد!', 'success', 2000)
}

const getTrackingLink = (order: any) => {
  if (!order.tracking_code) return null
  const method = settingsStore.shippingMethods.find(m => m.id === order.shipping_method_id)
  if (method && method.tracking_url_template) {
    return method.tracking_url_template.replace('{CODE}', order.tracking_code)
  }
  return null
}

const getShippingMethodTitle = (order: any) => {
  const method = settingsStore.shippingMethods.find(m => m.id === order.shipping_method_id)
  return method ? method.title : 'نامشخص'
}

const isCourier = (order: any) => {
  const method = settingsStore.shippingMethods.find(m => m.id === order.shipping_method_id)
  return method?.type === 'courier'
}
</script>
 
<template>
  <div class="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 min-h-[400px]">
    <h3 class="font-bold text-lg mb-6 flex items-center gap-2 border-b border-stone-100 pb-4">
      <Package class="w-5 h-5 text-accent" />
      سفارش‌های من
    </h3>
    
    <div v-if="loading" class="flex flex-col items-center justify-center py-12 text-stone-400">
      <div class="w-8 h-8 border-2 border-stone-200 border-t-stone-500 rounded-full animate-spin mb-2"></div>
      <span>در حال دریافت سفارشات...</span>
    </div>
 
    <div v-else-if="orders.length === 0" class="text-center py-12 text-stone-400 bg-stone-50 rounded-xl border border-dashed border-stone-200">
      هنوز سفارشی ثبت نکرده‌اید.
    </div>
 
    <div v-else class="space-y-6">
      <div v-for="order in orders" :key="order.id" class="border border-stone-200 rounded-2xl overflow-hidden bg-white shadow-sm transition-all duration-300" :class="expandedOrders.has(order.id) ? 'ring-1 ring-stone-200' : ''">
        
        <!-- Order Header -->
        <div class="p-6">
          <div class="flex flex-wrap justify-between items-start gap-4 mb-8">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 bg-stone-50 rounded-2xl flex items-center justify-center font-mono font-bold text-stone-500 border border-stone-100 text-lg">
                #{{ order.id }}
              </div>
              <div>
                <div class="font-bold text-stone-800 text-lg mb-1">سفارش {{ formatDate(order.created_at) }}</div>
                <div class="text-xs text-stone-500 flex items-center gap-2">
                  <span>{{ order.order_items.length }} قلم کالا</span>
                </div>
              </div>
            </div>
            
            <div class="flex flex-col items-end gap-2">
              <span class="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5" :class="getStatusColor(order.status)">
                <span v-if="order.status === 'cancelled'"><XCircle class="w-3.5 h-3.5" /></span>
                <span v-else-if="order.status === 'pending_approval'"><Clock class="w-3.5 h-3.5" /></span>
                <span v-else><CheckCircle2 class="w-3.5 h-3.5" /></span>
                {{ getStatusText(order.status) }}
              </span>
            </div>
          </div>
 
          <!-- Timeline -->
          <div v-if="order.status !== 'cancelled'" class="mb-6 px-2 py-4">
            <div class="relative flex items-center justify-between w-full">
              <div class="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-stone-100 rounded-full -z-0"></div>
              <div class="absolute right-0 top-1/2 transform -translate-y-1/2 h-1 bg-green-500 rounded-full -z-0 transition-all duration-1000" :style="{ width: `${(getCurrentStepIndex(order.status) / (orderSteps.length - 1)) * 100}%` }"></div>
              <div v-for="(step, index) in orderSteps" :key="index" class="relative z-10 flex flex-col items-center gap-2">
                <div class="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-white" :class="index <= getCurrentStepIndex(order.status) ? 'border-green-500 text-green-600 shadow-md' : 'border-stone-200 text-stone-300'">
                  <component :is="step.icon" class="w-4 h-4 md:w-5 md:h-5" :class="index <= getCurrentStepIndex(order.status) ? 'fill-green-100' : ''" />
                </div>
                <span class="text-[10px] md:text-xs font-bold absolute -bottom-6 whitespace-nowrap transition-colors duration-300" :class="index <= getCurrentStepIndex(order.status) ? 'text-stone-800' : 'text-stone-300'">{{ step.label }}</span>
              </div>
            </div>
          </div>
          <div v-else class="bg-red-50 border border-red-100 rounded-xl p-4 mb-6 flex items-center gap-3 text-red-700">
            <XCircle class="w-5 h-5" />
            <span class="text-sm font-bold">این سفارش لغو شده است.</span>
          </div>
          
          <!-- Tracking Code Box -->
          <div v-if="order.tracking_code" class="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 animate-fade-in">
            <div class="flex items-center gap-3 w-full sm:w-auto">
              <div class="bg-white p-2.5 rounded-xl text-indigo-600 shadow-sm">
                <Truck v-if="!isCourier(order)" class="w-6 h-6" />
                <Phone v-else class="w-6 h-6" />
              </div>
              <div>
                <div class="text-xs text-indigo-600 font-bold mb-1">
                  {{ isCourier(order) ? 'شماره تماس راننده / پیک' : 'کد رهگیری مرسوله پستی' }}
                  <span class="text-stone-500 font-normal">({{ getShippingMethodTitle(order) }})</span>
                </div>
                <div class="font-mono text-lg font-bold text-stone-800 tracking-widest select-all">{{ order.tracking_code }}</div>
              </div>
            </div>
            <div class="flex gap-2 w-full sm:w-auto text-xs font-bold">
              <button @click="copyToClipboard(order.tracking_code)" class="flex-1 sm:flex-none bg-white text-indigo-700 px-4 py-2.5 rounded-xl hover:bg-indigo-50 transition border border-indigo-200 shadow-sm">
                کپی {{ isCourier(order) ? 'شماره' : 'کد' }}
              </button>
              
              <a v-if="getTrackingLink(order)" :href="getTrackingLink(order)" target="_blank" class="flex-1 sm:flex-none bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition shadow-md shadow-indigo-200">
                رهگیری مرسوله
              </a>
              <a v-else-if="isCourier(order)" :href="`tel:${order.tracking_code}`" class="flex-1 sm:flex-none bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition shadow-md shadow-indigo-200">
                تماس با راننده
              </a>
            </div>
          </div>
        </div>
 
        <!-- Footer & Expandable Details -->
        <div class="bg-stone-50 border-t border-stone-100">
          <div class="p-4 flex items-center justify-between cursor-pointer hover:bg-stone-100 transition select-none" @click="toggleOrderDetails(order.id)">
            <div class="flex items-center gap-2">
              <span class="text-sm text-stone-500">مبلغ کل سفارش:</span>
              <span class="font-black text-lg text-stone-900">{{ order.total_price.toLocaleString() }} <span class="text-xs font-normal text-stone-500">تومان</span></span>
            </div>
            <button class="flex items-center gap-2 text-sm font-bold text-stone-600 bg-white px-4 py-2 rounded-lg border border-stone-200 shadow-sm">
              {{ expandedOrders.has(order.id) ? 'بستن جزئیات' : 'مشاهده اقلام و فاکتور' }}
              <component :is="expandedOrders.has(order.id) ? ChevronUp : ChevronDown" class="w-4 h-4" />
            </button>
          </div>
 
          <div v-if="expandedOrders.has(order.id)" class="border-t border-stone-200 bg-white p-6 animate-fade-in">
            <h4 class="font-bold text-stone-800 mb-4 flex items-center gap-2"><ShoppingBag class="w-5 h-5 text-stone-400" /> اقلام سفارش</h4>
            <div class="grid md:grid-cols-2 gap-4 mb-8">
              <div v-for="item in order.order_items" :key="item.id" class="flex gap-4 p-3 border border-stone-100 rounded-xl hover:border-stone-200 transition bg-stone-50/50">
                <div class="w-20 h-20 bg-white rounded-lg overflow-hidden border border-stone-200 shrink-0">
                  <img v-if="item.products?.image" :src="item.products.image" class="w-full h-full object-cover" />
                  <div v-else class="w-full h-full flex items-center justify-center text-stone-300"><ShoppingBag class="w-6 h-6" /></div>
                </div>
                <div class="flex-grow flex flex-col justify-between py-1">
                  <div>
                    <h4 class="font-bold text-stone-800 text-sm mb-1 line-clamp-1">{{ item.products?.title || 'محصول حذف شده' }}</h4>
                    <div class="text-xs text-stone-500">{{ item.products?.category }}</div>
                  </div>
                  <div class="flex justify-between items-end">
                    <div class="text-xs font-bold bg-white px-2 py-1 rounded border border-stone-200 text-stone-600">{{ item.quantity }} عدد</div>
                    <div class="font-bold text-stone-800 text-sm">{{ item.price_at_purchase.toLocaleString() }} <span class="text-[10px] font-normal text-stone-500">تومان</span></div>
                  </div>
                </div>
              </div>
            </div>
 
            <div class="grid md:grid-cols-2 gap-6 pt-6 border-t border-stone-100">
              <div class="space-y-4">
                <div class="bg-stone-50 p-4 rounded-xl border border-stone-100">
                  <h5 class="font-bold text-sm text-stone-700 mb-3 flex items-center gap-2"><Wallet class="w-4 h-4" /> اطلاعات پرداخت</h5>
                  <div class="space-y-2 text-sm">
                    <div class="flex justify-between"><span class="text-stone-500">روش پرداخت:</span><span class="font-bold text-stone-800 flex items-center gap-1"><CreditCard v-if="order.payment_method === 'online'" class="w-3 h-3 text-blue-600" /><Receipt v-else class="w-3 h-3 text-orange-600" /> {{ order.payment_method === 'online' ? 'درگاه اینترنتی' : 'کارت به کارت' }}</span></div>
                    <div class="flex justify-between"><span class="text-stone-500">تاریخ ثبت:</span><span class="font-mono text-stone-800">{{ new Date(order.created_at).toLocaleTimeString('fa-IR', {hour: '2-digit', minute:'2-digit'}) }} - {{ formatDate(order.created_at) }}</span></div>
                  </div>
                </div>
                <div v-if="order.note" class="p-3 bg-yellow-50 border border-yellow-100 rounded-xl text-xs text-yellow-800 leading-relaxed"><span class="font-bold block mb-1">یادداشت شما:</span>{{ order.note }}</div>
              </div>
 
              <div class="bg-stone-50 p-4 rounded-xl border border-stone-100">
                <h5 class="font-bold text-sm text-stone-700 mb-3 flex items-center gap-2"><Receipt class="w-4 h-4" /> جزئیات صورتحساب</h5>
                <div class="space-y-3 text-sm">
                  <div class="flex justify-between text-stone-600"><span>جمع کل اقلام:</span><span>{{ (order.total_price + (order.discount_amount || 0) - (order.shipping_cost || 0)).toLocaleString() }} تومان</span></div>
                  <div v-if="order.discount_amount > 0" class="flex justify-between text-red-500 font-medium"><span>سود شما از خرید (تخفیف):</span><span>{{ order.discount_amount.toLocaleString() }}- تومان</span></div>
                  <div class="flex justify-between text-stone-600">
                    <span>هزینه ارسال ({{ getShippingMethodTitle(order) }}):</span>
                    <span v-if="order.shipping_cost > 0">{{ order.shipping_cost.toLocaleString() }} تومان</span>
                    <span v-else class="text-green-600 font-bold">رایگان / پس‌کرایه</span>
                  </div>
                  <div class="border-t border-stone-200 my-2"></div>
                  <div class="flex justify-between items-center"><span class="font-bold text-stone-800">مبلغ نهایی پرداخت شده:</span><span class="font-black text-lg text-stone-900">{{ order.total_price.toLocaleString() }} <span class="text-xs font-normal text-stone-500">تومان</span></span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>