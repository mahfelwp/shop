<script setup lang="ts">
import { Package, Truck, Copy, ExternalLink } from 'lucide-vue-next'
import { useToastStore } from '@/stores/toast'

const props = defineProps<{
  orders: any[]
  loading: boolean
}>()

const toastStore = useToastStore()

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fa-IR')
}

const getStatusColor = (status: string) => {
  switch(status) {
    case 'paid': return 'bg-blue-100 text-blue-700'
    case 'processing': return 'bg-purple-100 text-purple-700'
    case 'shipped': return 'bg-indigo-100 text-indigo-700'
    case 'delivered': return 'bg-green-100 text-green-700'
    case 'cancelled': return 'bg-red-100 text-red-700'
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
    
    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading-spinner"></span> <!-- یا کامپوننت Loader -->
      <span class="text-stone-400 mr-2">در حال دریافت...</span>
    </div>

    <div v-else-if="orders.length === 0" class="text-center py-12 text-stone-400 bg-stone-50 rounded-xl border border-dashed border-stone-200">
      هنوز سفارشی ثبت نکرده‌اید.
    </div>

    <div v-else class="space-y-6">
      <div v-for="order in orders" :key="order.id" class="border border-stone-200 rounded-xl p-5 hover:border-stone-400 transition bg-white shadow-sm">
        <!-- Order Header -->
        <div class="flex flex-wrap justify-between items-center gap-4 mb-4 pb-4 border-b border-stone-100">
          <div class="flex items-center gap-3">
            <span class="font-bold text-stone-800 text-lg">سفارش #{{ order.id }}</span>
            <span class="text-xs px-3 py-1 rounded-full font-bold" :class="getStatusColor(order.status)">
              {{ getStatusText(order.status) }}
            </span>
          </div>
          <div class="text-sm text-stone-500">
            {{ formatDate(order.created_at) }}
          </div>
        </div>
        
        <!-- Tracking Section -->
        <div v-if="order.tracking_code" class="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="bg-white p-2 rounded-lg text-indigo-600 shadow-sm">
              <Truck class="w-5 h-5" />
            </div>
            <div>
              <div class="text-xs text-indigo-600 font-bold mb-1">کد رهگیری مرسوله:</div>
              <div class="font-mono text-lg font-bold text-stone-800 tracking-wider">{{ order.tracking_code }}</div>
            </div>
          </div>
          <div class="flex gap-2 w-full sm:w-auto">
            <button @click="copyToClipboard(order.tracking_code)" class="flex-1 sm:flex-none bg-white border border-indigo-200 text-indigo-700 px-3 py-2 rounded-lg text-sm hover:bg-indigo-100 transition flex items-center justify-center gap-1" title="کپی کد">
              <Copy class="w-4 h-4" />
              <span class="sm:hidden">کپی</span>
            </button>
            <a :href="`https://tracking.post.ir/?id=${order.tracking_code}`" target="_blank" class="flex-1 sm:flex-none bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2">
              رهگیری پست
              <ExternalLink class="w-4 h-4" />
            </a>
          </div>
        </div>

        <!-- Items -->
        <div class="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
          <div v-for="item in order.order_items" :key="item.id" class="flex-shrink-0 w-20 h-20 bg-stone-100 rounded-xl overflow-hidden border border-stone-200 relative group">
            <img v-if="item.products?.image" :src="item.products.image" class="w-full h-full object-cover" />
            <span class="absolute bottom-0 right-0 bg-black/60 text-white text-xs font-bold px-1.5 py-0.5 rounded-tl-lg">{{ item.quantity }}x</span>
          </div>
        </div>

        <!-- Footer -->
        <div class="mt-4 pt-4 border-t border-stone-100 flex justify-between items-center">
          <span class="text-sm text-stone-500">مبلغ کل:</span>
          <span class="font-black text-xl text-stone-900">{{ order.total_price.toLocaleString() }} <span class="text-xs font-normal text-stone-500">تومان</span></span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>