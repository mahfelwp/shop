<script setup lang="ts">
// دریافت داده‌ها به صورت Props برای داینامیک شدن
defineProps<{
  data: {
    label: string
    value: number
    height: string
    count: number
  }[]
}>()

const formatPrice = (price: number) => {
  if (price >= 1000000) return (price / 1000000).toFixed(1) + 'M'
  if (price >= 1000) return (price / 1000).toFixed(0) + 'K'
  return price
}
</script>

<template>
  <div class="w-full h-full flex items-end justify-between gap-2 px-2 pb-6 pt-4 relative">
    <!-- Grid Lines -->
    <div class="absolute inset-0 flex flex-col justify-between pointer-events-none px-2 pb-6 pt-4 opacity-30">
      <div class="w-full h-px bg-stone-200 border-t border-dashed border-stone-300"></div>
      <div class="w-full h-px bg-stone-200 border-t border-dashed border-stone-300"></div>
      <div class="w-full h-px bg-stone-200 border-t border-dashed border-stone-300"></div>
      <div class="w-full h-px bg-stone-200 border-t border-dashed border-stone-300"></div>
      <div class="w-full h-px bg-stone-200 border-t border-dashed border-stone-300"></div>
    </div>

    <div v-if="data.length === 0" class="absolute inset-0 flex items-center justify-center text-stone-400 text-sm">
      داده‌ای برای نمایش وجود ندارد
    </div>

    <!-- Bars -->
    <div 
      v-for="(item, index) in data" 
      :key="index" 
      class="flex-1 flex flex-col items-center justify-end h-full group relative z-10"
    >
      <!-- Tooltip -->
      <div class="absolute -top-12 opacity-0 group-hover:opacity-100 transition bg-stone-800 text-white text-xs px-2 py-1.5 rounded mb-2 whitespace-nowrap z-20 shadow-lg pointer-events-none">
        <div class="font-bold">{{ item.value.toLocaleString() }} تومان</div>
        <div class="text-[10px] opacity-80">{{ item.count }} سفارش</div>
        <div class="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-stone-800 rotate-45"></div>
      </div>
      
      <!-- Bar -->
      <div 
        class="w-full max-w-[30px] bg-stone-900 rounded-t-lg transition-all duration-500 hover:bg-accent relative overflow-hidden min-h-[4px]"
        :style="{ height: item.height }"
      >
        <!-- Shine effect -->
        <div class="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/10 to-transparent opacity-50"></div>
      </div>
      
      <!-- Label -->
      <span class="text-[10px] text-stone-500 mt-2 font-bold absolute -bottom-6 truncate w-full text-center">{{ item.label }}</span>
    </div>
  </div>
</template>