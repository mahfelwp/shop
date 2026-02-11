<script setup lang="ts">
import { Search, X } from 'lucide-vue-next'

const props = defineProps<{
  showMobile: boolean
  categories: string[]
  searchQuery: string
  selectedCategory: string
  maxPrice: number
}>()

const emit = defineEmits(['update:showMobile', 'update:searchQuery', 'update:selectedCategory', 'update:maxPrice', 'reset'])

const formatPrice = (price: number) => price.toLocaleString('fa-IR')
</script>

<template>
  <aside 
    class="lg:col-span-1 bg-white p-6 rounded-3xl shadow-lg border border-stone-100 lg:sticky lg:top-32 transition-all duration-300"
    :class="showMobile ? 'block' : 'hidden lg:block'"
  >
    <div class="flex items-center justify-between mb-6 lg:hidden">
      <span class="font-bold text-lg">فیلترها</span>
      <button @click="emit('update:showMobile', false)"><X class="w-5 h-5" /></button>
    </div>

    <!-- Search -->
    <div class="mb-8">
      <label class="block text-sm font-bold text-stone-700 mb-3">جستجو</label>
      <div class="relative">
        <input 
          :value="searchQuery"
          @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
          type="text" 
          placeholder="نام محصول..." 
          class="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 pr-10 pl-4 text-sm focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition"
        />
        <Search class="w-4 h-4 text-stone-400 absolute top-3.5 right-3" />
      </div>
    </div>

    <!-- Categories -->
    <div class="mb-8">
      <label class="block text-sm font-bold text-stone-700 mb-3">دسته‌بندی‌ها</label>
      <div class="space-y-2">
        <label 
          v-for="cat in categories" 
          :key="cat"
          class="flex items-center gap-3 cursor-pointer group"
        >
          <div class="relative flex items-center">
            <input 
              type="radio" 
              name="category" 
              :value="cat" 
              :checked="selectedCategory === cat"
              @change="emit('update:selectedCategory', cat)"
              class="peer appearance-none w-5 h-5 border-2 border-stone-300 rounded-full checked:border-accent checked:bg-accent transition"
            />
            <div class="absolute inset-0 m-auto w-2 h-2 rounded-full bg-white opacity-0 peer-checked:opacity-100 pointer-events-none"></div>
          </div>
          <span class="text-stone-600 group-hover:text-stone-900 transition capitalize">
            {{ cat === 'all' ? 'همه محصولات' : cat }}
          </span>
        </label>
      </div>
    </div>

    <!-- Price Range -->
    <div class="mb-8">
      <div class="flex justify-between items-center mb-3">
        <label class="text-sm font-bold text-stone-700">محدوده قیمت</label>
        <span class="text-xs text-accent font-bold bg-accent/10 px-2 py-1 rounded-lg">
          تا {{ formatPrice(maxPrice) }} تومان
        </span>
      </div>
      <input 
        type="range" 
        min="0" 
        max="5000000" 
        step="50000" 
        :value="maxPrice"
        @input="emit('update:maxPrice', parseInt(($event.target as HTMLInputElement).value))"
        class="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-900"
      />
    </div>

    <button 
      @click="emit('reset')"
      class="w-full py-3 text-sm font-bold text-stone-500 hover:text-stone-900 border border-dashed border-stone-300 rounded-xl hover:border-stone-900 transition"
    >
      حذف فیلترها
    </button>
  </aside>
</template>