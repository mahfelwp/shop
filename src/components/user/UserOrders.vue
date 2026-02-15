<script setup lang="ts">
import { Package, Truck, Copy, ExternalLink, CheckCircle2, ClipboardList, XCircle, Clock } from 'lucide-vue-next'
import { useToastStore } from '@/stores/toast'

const props = defineProps<{
  orders: any[]
  loading: boolean
}>()

const toastStore = useToastStore()

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fa-IR')
}

// مراحل سفارش برای نوار پیشرفت
const orderSteps = [
  { status: 'pending', label: 'ثبت سفارش', icon: ClipboardList },
  { status: 'processing', label: 'پردازش و بسته‌بندی', icon: Package },
  { status: 'shipped', label: 'تحویل به پست', icon: Truck },
  { status: 'delivered', label: 'تحویل به مشتری', icon: CheckCircle2 }
]

// محاسبه مرحله فعلی بر اساس وضعیت سفارش
const getCurrentStepIndex = (status: string) => {
  if (status === 'pending' || status === 'pending_approval' || status === 'paid') return 0
  if (status === 'processing') return 1
  if (status === 'shipped') return 2
  if (status === 'delivered') return 3
  return -1 // برای وضعیت‌های نامشخص یا لغو شده
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
    'shipped': 'تحویل پست شده',
    'delivered': 'تحویل شده',
    'cancelled': 'لغو شده'
  }
  return map[status] || status
}

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
  toastStore.showToast('کد رهگیری کپی شد!', 'success', 2000)
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

    <div v-else class="space-y-8">
      <div v-for="order in orders" :key="order.id" class="border border-stone-200 rounded-2xl p-6 hover:border-stone-300 transition bg-white shadow-sm group">
        
        <!-- Order Header -->
        <div class="flex flex-wrap justify-between items-center gap-4 mb-6 pb-4 border-b border-stone-100">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center font-mono font-bold text-stone-600">
              #{{ order.id }}
            </div>
            <div>
              <div class="font-bold text-stone-800 text-lg">سفارش {{ formatDate(order.created_at) }}</div>
              <div class="text-xs text-stone-500 mt-0.5">{{ order.order_items.length }} قلم کالا</div>
            </div>
          </div>
          <span class="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5" :class="getStatusColor(order.status)">
            <span v-if="order.status === 'cancelled'"><XCircle class="w-3.5 h-3.5" /></span>
            <span v-else-if="order.status === 'pending_approval'"><Clock class="w-3.5 h-3.5" /></span>
            <span v-else><CheckCircle2 class="w-3.5 h-3.5" /></span>
            {{ getStatusText(order.status) }}
          </span>
        </div>

        <!-- Visual Progress Bar (Stepper) -->
        <div v-if="order.status !== 'cancelled'" class="mb-8 px-2">
          <div class="relative flex items-center justify-between w-full">
            <!-- Background Line -->
            <div class="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-stone-100 rounded-full -z-0"></div>
            
            <!-- Active Line -->
            <div 
              class="absolute right-0 top-1/2 transform -translate-y-1/2 h-1 bg-green-500 rounded-full -z-0 transition-all duration-1000"
              :style="{ width: `${(getCurrentStepIndex(order.status) / (orderSteps.length - 1)) * 100}%` }"
            ></div>

            <!-- Steps -->
            <div 
              v-for="(step, index) in orderSteps" 
              :key="index" 
              class="relative z-10 flex flex-col items-center gap-2"
            >
              <div 
                class="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300"
                :class="index <= getCurrentStepIndex(order.status) 
                  ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-200 scale-110' 
                  : 'bg-white border-stone-200 text-stone-300'"
              >
                <component :is="step.icon" class="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <span 
                class="text-[10px] md:text-xs font-bold absolute -bottom-6 whitespace-nowrap transition-colors duration-300"
                :class="index <= getCurrentStepIndex(order.status) ? 'text-stone-800' : 'text-stone-300'"
              >
                {{ step.label }}
              </span>
            </div>
          </div>
        </div>

        <!-- Cancelled Alert -->
        <div v-else class="bg-red-50 border border-red-100 rounded-xl p-4 mb-6 flex items-center gap-3 text-red-700">
          <XCircle class="w-5 h-5" />
          <span class="text-sm font-bold">این سفارش لغو شده است. در صورت پرداخت وجه، مبلغ طی ۷۲ ساعت به حساب شما بازخواهد گشت.</span>
        </div>
        
        <!-- Tracking Section -->
        <div v-if="order.tracking_code" class="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
          <div class="flex items-center gap-3 w-full sm:w-auto">
            <div class="bg-white p-2.5 rounded-xl text-indigo-600 shadow-sm border border-indigo-50">
              <Truck class="w-6 h-6" />
            </div>
            <div>
              <div class="text-xs text-indigo-600 font-bold mb-1">کد رهگیری مرسوله پستی</div>
              <div class="font-mono text-lg font-bold text-stone-800 tracking-wider select-all">{{ order.tracking_code }}</div>
            </div>
          </div>
          <div class="flex gap-2 w-full sm:w-auto">
            <button @click="copyToClipboard(order.tracking_code)" class="flex-1 sm:flex-none bg-white border border-indigo-200 text-indigo-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-50 transition flex items-center justify-center gap-2" title="کپی کد">
              <Copy class="w-4 h-4" />
              <span class="sm:hidden">کپی کد</span>
            </button>
            <a :href="`https://tracking.post.ir/?id=${order.tracking_code}`" target="_blank" class="flex-1 sm:flex-none bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-200">
              رهگیری در پست
              <ExternalLink class="w-4 h-4" />
            </a>
          </div>
        </div>

        <!-- Items & Total -->
        <div class="bg-stone-50 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
          <!-- Items Thumbs -->
          <div class="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
            <div v-for="item in order.order_items" :key="item.id" class="flex-shrink-0 w-14 h-14 bg-white rounded-lg overflow-hidden border border-stone-200 relative group/item" :title="item.products?.title">
              <img v-if="item.products?.image" :src="item.products.image" class="w-full h-full object-cover" />
              <span class="absolute bottom-0 right-0 bg-stone-900/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-tl-md">{{ item.quantity }}</span>
            </div>
          </div>

          <!-- Total Price -->
          <div class="flex items-center gap-2 whitespace-nowrap">
            <span class="text-sm text-stone-500">مبلغ کل سفارش:</span>
            <span class="font-black text-xl text-stone-900">{{ order.total_price.toLocaleString() }} <span class="text-xs font-normal text-stone-500">تومان</span></span>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>