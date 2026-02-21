<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useAdminStore } from '@/stores/admin'
import SimpleBarChart from '@/components/admin/charts/SimpleBarChart.vue'
import { TrendingUp, Users, ShoppingCart, DollarSign, Activity, ShoppingBag } from 'lucide-vue-next'

const adminStore = useAdminStore()

onMounted(() => {
  adminStore.fetchStats()
  adminStore.subscribeToStats()
})

onUnmounted(() => {
  adminStore.unsubscribeFromStats()
})
</script>

<template>
  <div class="space-y-8 animate-fade-in">
    <!-- Header -->
    <div>
      <h2 class="text-2xl font-bold text-gray-800">آمار و گزارشات تحلیلی</h2>
      <p class="text-gray-500 text-sm mt-1">بررسی عملکرد فروشگاه بر اساس داده‌های واقعی (بروزرسانی زنده)</p>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div class="flex justify-between items-start mb-4">
          <div class="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <DollarSign class="w-6 h-6" />
          </div>
          <span class="flex items-center text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-lg animate-pulse">
            <TrendingUp class="w-3 h-3 mr-1" /> درآمد
          </span>
        </div>
        <div class="text-3xl font-black text-gray-800 mb-1">{{ (adminStore.stats.totalRevenue / 1000000).toFixed(1) }}M</div>
        <div class="text-sm text-gray-500">درآمد کل (تومان)</div>
      </div>

      <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div class="flex justify-between items-start mb-4">
          <div class="p-3 bg-blue-50 rounded-xl text-blue-600">
            <ShoppingCart class="w-6 h-6" />
          </div>
          <span class="flex items-center text-blue-600 text-xs font-bold bg-blue-50 px-2 py-1 rounded-lg">
            <TrendingUp class="w-3 h-3 mr-1" /> سفارشات
          </span>
        </div>
        <div class="text-3xl font-black text-gray-800 mb-1">{{ adminStore.stats.totalOrders }}</div>
        <div class="text-sm text-gray-500">تعداد کل سفارشات ثبت شده</div>
      </div>

      <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div class="flex justify-between items-start mb-4">
          <div class="p-3 bg-orange-50 rounded-xl text-orange-600">
            <Users class="w-6 h-6" />
          </div>
          <span class="flex items-center text-orange-600 text-xs font-bold bg-orange-50 px-2 py-1 rounded-lg">
            <TrendingUp class="w-3 h-3 mr-1" /> مشتریان
          </span>
        </div>
        <div class="text-3xl font-black text-gray-800 mb-1">{{ adminStore.stats.uniqueCustomers }}</div>
        <div class="text-sm text-gray-500">تعداد مشتریان یکتا</div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid lg:grid-cols-2 gap-6">
      <!-- Sales Chart -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div class="flex justify-between items-center mb-8">
          <h3 class="font-bold text-lg text-gray-800 flex items-center gap-2">
            <Activity class="w-5 h-5 text-indigo-500" />
            روند فروش ۷ روز گذشته
          </h3>
        </div>
        <div class="h-64">
          <SimpleBarChart :data="adminStore.chartData" />
        </div>
      </div>

      <!-- Category Chart -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div class="flex justify-between items-center mb-8">
          <h3 class="font-bold text-lg text-gray-800 flex items-center gap-2">
            <ShoppingBag class="w-5 h-5 text-orange-500" />
            فروش بر اساس دسته‌بندی
          </h3>
        </div>
        <div class="h-64">
          <SimpleBarChart :data="adminStore.categoryStats" />
        </div>
      </div>
    </div>
  </div>
</template>