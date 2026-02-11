<script setup lang="ts">
import { Package, Users, DollarSign } from 'lucide-vue-next'

defineProps<{
  stats: {
    totalProducts: number
    totalOrders: number
    totalRevenue: number
    pendingOrders: number
  }
}>()
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-fade-in">
    <div class="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-4">
      <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
        <Package class="w-6 h-6" />
      </div>
      <div>
        <div class="text-stone-500 text-sm">تعداد محصولات</div>
        <div class="text-2xl font-bold">{{ stats.totalProducts }}</div>
      </div>
    </div>
    
    <div class="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-4">
      <div class="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
        <DollarSign class="w-6 h-6" />
      </div>
      <div>
        <div class="text-stone-500 text-sm">درآمد کل (تایید شده)</div>
        <div class="text-2xl font-bold">{{ stats.totalRevenue.toLocaleString() }} <span class="text-xs text-stone-400">تومان</span></div>
      </div>
    </div>
    
    <div class="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-4">
      <div class="w-12 h-12 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center">
        <Users class="w-6 h-6" />
      </div>
      <div>
        <div class="text-stone-500 text-sm">سفارشات در انتظار</div>
        <div class="text-2xl font-bold">{{ stats.pendingOrders }}</div>
      </div>
    </div>
  </div>
</template>