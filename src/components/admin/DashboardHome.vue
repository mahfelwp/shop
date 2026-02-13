<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAdminStore } from '@/stores/admin'
import { supabase } from '@/lib/supabase'
import { TrendingUp, DollarSign, ShoppingBag, Clock, ArrowLeft, CheckCircle2, AlertCircle, AlertTriangle, ArrowRight } from 'lucide-vue-next'
import SimpleBarChart from '@/components/admin/charts/SimpleBarChart.vue'
import { useRouter } from 'vue-router'

const adminStore = useAdminStore()
const router = useRouter()
const lowStockProducts = ref<any[]>([])
const loadingLowStock = ref(false)

onMounted(async () => {
  adminStore.fetchStats()
  fetchLowStock()
})

// دریافت کالاهای کم موجودی برای نمایش در داشبورد
const fetchLowStock = async () => {
  loadingLowStock.value = true
  const { data } = await supabase
    .from('products')
    .select('id, title, stock, image')
    .lt('stock', 10) // کمتر از ۱۰
    .limit(3)
  
  if (data) {
    lowStockProducts.value = data
  }
  loadingLowStock.value = false
}

// محاسبه سفارشات اخیر از استور (واقعی)
const recentOrders = computed(() => {
  return adminStore.orders.slice(0, 5).map(order => ({
    id: order.id,
    user: order.receiver_name || 'کاربر مهمان',
    amount: order.total_price,
    status: order.status,
    date: new Date(order.created_at).toLocaleDateString('fa-IR')
  }))
})

// تولید فعالیت‌های اخیر بر اساس سفارشات جدید (واقعی)
const recentActivities = computed(() => {
  return adminStore.orders.slice(0, 4).map(order => {
    const timeDiff = Date.now() - new Date(order.created_at).getTime()
    const hours = Math.floor(timeDiff / (1000 * 60 * 60))
    const minutes = Math.floor(timeDiff / (1000 * 60))
    
    let timeText = ''
    if (hours > 24) timeText = `${Math.floor(hours / 24)} روز پیش`
    else if (hours > 0) timeText = `${hours} ساعت پیش`
    else timeText = `${minutes} دقیقه پیش`

    return {
      id: order.id,
      title: 'سفارش جدید ثبت شد',
      desc: `${order.receiver_name} - ${order.total_price.toLocaleString()} تومان`,
      time: timeText,
      type: 'order'
    }
  })
})

const getStatusColor = (status: string) => {
  const map: any = {
    paid: 'bg-blue-100 text-blue-700',
    processing: 'bg-purple-100 text-purple-700',
    shipped: 'bg-indigo-100 text-indigo-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    pending: 'bg-yellow-100 text-yellow-700',
    pending_approval: 'bg-orange-100 text-orange-700'
  }
  return map[status] || 'bg-gray-100'
}

const getStatusText = (status: string) => {
  const map: any = {
    paid: 'پرداخت شده',
    processing: 'در حال پردازش',
    shipped: 'ارسال شده',
    delivered: 'تحویل شده',
    cancelled: 'لغو شده',
    pending: 'در انتظار پرداخت',
    pending_approval: 'در انتظار تایید'
  }
  return map[status] || status
}
</script>

<template>
  <div class="space-y-6">
    
    <!-- Low Stock Alert Banner (New) -->
    <div v-if="lowStockProducts.length > 0" class="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
      <div class="flex items-center gap-4">
        <div class="bg-white p-2 rounded-xl text-orange-500 shadow-sm">
          <AlertTriangle class="w-6 h-6" />
        </div>
        <div>
          <h3 class="font-bold text-orange-900">هشدار موجودی انبار</h3>
          <p class="text-sm text-orange-700 mt-1">
            موجودی {{ lowStockProducts.length }} محصول رو به اتمام است. لطفاً انبار را بررسی کنید.
          </p>
        </div>
      </div>
      <button @click="router.push({ name: 'admin-inventory' })" class="bg-white text-orange-600 border border-orange-200 px-4 py-2 rounded-xl text-sm font-bold hover:bg-orange-100 transition flex items-center gap-2 whitespace-nowrap">
        مدیریت موجودی <ArrowLeft class="w-4 h-4" />
      </button>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- Revenue Card -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 relative overflow-hidden group">
        <div class="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
        <div class="flex justify-between items-start mb-4">
          <div>
            <p class="text-stone-500 text-sm font-medium mb-1">درآمد کل</p>
            <h3 class="text-2xl font-black text-stone-800">{{ adminStore.stats.totalRevenue.toLocaleString() }} <span class="text-xs text-stone-400 font-normal">تومان</span></h3>
          </div>
          <div class="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
            <DollarSign class="w-5 h-5" />
          </div>
        </div>
        <div class="flex items-center gap-2 text-xs">
          <span class="text-green-600 flex items-center font-bold bg-green-50 px-1.5 py-0.5 rounded">
            <TrendingUp class="w-3 h-3 mr-1" /> بروزرسانی
          </span>
          <span class="text-stone-400">لحظه‌ای</span>
        </div>
      </div>

      <!-- Orders Card -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 relative overflow-hidden group">
        <div class="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
        <div class="flex justify-between items-start mb-4">
          <div>
            <p class="text-stone-500 text-sm font-medium mb-1">سفارشات</p>
            <h3 class="text-2xl font-black text-stone-800">{{ adminStore.stats.totalOrders }}</h3>
          </div>
          <div class="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <ShoppingBag class="w-5 h-5" />
          </div>
        </div>
        <div class="flex items-center gap-2 text-xs">
          <span class="text-blue-600 flex items-center font-bold bg-blue-50 px-1.5 py-0.5 rounded">
            <CheckCircle2 class="w-3 h-3 mr-1" /> فعال
          </span>
          <span class="text-stone-400">تعداد کل</span>
        </div>
      </div>

      <!-- Products Card -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 relative overflow-hidden group">
        <div class="absolute top-0 left-0 w-full h-1 bg-orange-500"></div>
        <div class="flex justify-between items-start mb-4">
          <div>
            <p class="text-stone-500 text-sm font-medium mb-1">محصولات</p>
            <h3 class="text-2xl font-black text-stone-800">{{ adminStore.stats.totalProducts }}</h3>
          </div>
          <div class="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
            <ShoppingBag class="w-5 h-5" />
          </div>
        </div>
        <div class="flex items-center gap-2 text-xs">
          <span class="text-stone-500 flex items-center font-bold bg-stone-100 px-1.5 py-0.5 rounded">
            موجودی
          </span>
          <span class="text-stone-400">در انبار</span>
        </div>
      </div>

      <!-- Pending Card -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 relative overflow-hidden group">
        <div class="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
        <div class="flex justify-between items-start mb-4">
          <div>
            <p class="text-stone-500 text-sm font-medium mb-1">در انتظار بررسی</p>
            <h3 class="text-2xl font-black text-stone-800">{{ adminStore.stats.pendingOrders }}</h3>
          </div>
          <div class="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600" :class="adminStore.stats.pendingOrders > 0 ? 'animate-pulse' : ''">
            <Clock class="w-5 h-5" />
          </div>
        </div>
        <div class="flex items-center gap-2 text-xs">
          <span v-if="adminStore.stats.pendingOrders > 0" class="text-red-600 font-bold flex items-center gap-1">
             <AlertCircle class="w-3 h-3" /> نیاز به اقدام
          </span>
          <span v-else class="text-green-600 font-bold flex items-center gap-1">
             <CheckCircle2 class="w-3 h-3" /> همه بررسی شدند
          </span>
        </div>
      </div>
    </div>

    <!-- Charts & Tables Section -->
    <div class="grid lg:grid-cols-3 gap-6">
      
      <!-- Chart Section -->
      <div class="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
        <div class="flex justify-between items-center mb-6">
          <h3 class="font-bold text-lg text-stone-800">نمودار فروش ۷ روز گذشته</h3>
          <div class="text-xs text-stone-400">بر اساس سفارشات موفق</div>
        </div>
        <div class="h-64 w-full">
          <!-- ارسال داده‌های واقعی به نمودار -->
          <SimpleBarChart :data="adminStore.chartData" />
        </div>
      </div>

      <!-- Recent Activity / Timeline -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
        <h3 class="font-bold text-lg text-stone-800 mb-6">فعالیت‌های اخیر</h3>
        
        <div v-if="recentActivities.length === 0" class="text-center text-stone-400 py-10 text-sm">
          هنوز فعالیتی ثبت نشده است
        </div>

        <div v-else class="space-y-6 relative before:absolute before:right-2.5 before:top-2 before:h-full before:w-0.5 before:bg-stone-100">
          <div v-for="activity in recentActivities" :key="activity.id" class="relative pr-8 animate-fade-in">
            <div class="absolute right-0 top-1 w-5 h-5 bg-green-100 rounded-full border-2 border-white flex items-center justify-center z-10">
              <div class="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
            <p class="text-sm font-bold text-stone-800">{{ activity.title }}</p>
            <p class="text-xs text-stone-500 mt-1">{{ activity.desc }}</p>
            <span class="text-[10px] text-stone-400 mt-1 block">{{ activity.time }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Orders Table -->
    <div class="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
      <div class="p-6 border-b border-stone-100 flex justify-between items-center">
        <h3 class="font-bold text-lg text-stone-800">آخرین سفارشات</h3>
        <button class="text-sm text-accent font-bold flex items-center gap-1 hover:gap-2 transition-all">
          مشاهده همه <ArrowLeft class="w-4 h-4" />
        </button>
      </div>
      
      <div v-if="recentOrders.length === 0" class="p-8 text-center text-stone-400">
        هنوز سفارشی ثبت نشده است.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-right">
          <thead class="bg-stone-50 text-stone-500 text-xs uppercase">
            <tr>
              <th class="p-4">شماره سفارش</th>
              <th class="p-4">مشتری</th>
              <th class="p-4">تاریخ</th>
              <th class="p-4">مبلغ</th>
              <th class="p-4">وضعیت</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-100">
            <tr v-for="order in recentOrders" :key="order.id" class="hover:bg-stone-50 transition">
              <td class="p-4 font-mono font-bold text-stone-700">#{{ order.id }}</td>
              <td class="p-4 font-medium">{{ order.user }}</td>
              <td class="p-4 text-stone-500 text-sm">{{ order.date }}</td>
              <td class="p-4 font-bold text-stone-800">{{ order.amount.toLocaleString() }}</td>
              <td class="p-4">
                <span class="px-2.5 py-1 rounded-lg text-xs font-bold" :class="getStatusColor(order.status)">
                  {{ getStatusText(order.status) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>