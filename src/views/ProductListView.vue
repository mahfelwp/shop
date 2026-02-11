<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useProductStore } from '@/stores/product'
import { SlidersHorizontal, Filter, Loader2, Search } from 'lucide-vue-next'
import ProductCard from '@/components/ProductCard.vue'
import ProductFilterSidebar from '@/components/product/ProductFilterSidebar.vue'
import { useHead } from '@vueuse/head'

const productStore = useProductStore()

// استیت‌های فیلترینگ
const searchQuery = ref('')
const selectedCategory = ref('all')
const maxPrice = ref(5000000)
const sortOption = ref('newest')
const showMobileFilters = ref(false)

// سئو داینامیک بر اساس دسته‌بندی
useHead({
  title: computed(() => {
    if (selectedCategory.value !== 'all') {
      return `خرید ${selectedCategory.value}`
    }
    return 'فروشگاه محصولات'
  }),
  meta: [
    { 
      name: 'description', 
      content: computed(() => `لیست کامل محصولات حصیری${selectedCategory.value !== 'all' ? ' دسته‌بندی ' + selectedCategory.value : ''}. خرید آنلاین با بهترین قیمت و کیفیت تضمینی.`) 
    }
  ]
})

onMounted(() => {
  productStore.fetchProducts()
})

const categories = computed(() => {
  const cats = new Set(productStore.products.map(p => p.category))
  return ['all', ...cats]
})

const filteredProducts = computed(() => {
  let result = productStore.products.filter(product => {
    const matchSearch = product.title.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchCategory = selectedCategory.value === 'all' || product.category === selectedCategory.value
    const matchPrice = product.price <= maxPrice.value
    return matchSearch && matchCategory && matchPrice
  })

  if (sortOption.value === 'cheapest') {
    result.sort((a, b) => a.price - b.price)
  } else if (sortOption.value === 'expensive') {
    result.sort((a, b) => b.price - a.price)
  } else {
    result.sort((a, b) => b.id - a.id)
  }

  return result
})

const resetFilters = () => {
  selectedCategory.value = 'all'
  searchQuery.value = ''
  maxPrice.value = 5000000
}
</script>

<template>
  <div class="bg-stone-50 min-h-screen pt-32 pb-12">
    <div class="container mx-auto px-4 md:px-8">
      
      <!-- Header Section -->
      <div class="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <div class="text-center md:text-right">
          <h1 class="text-3xl md:text-4xl font-black text-stone-900 mb-2">فروشگاه</h1>
          <p class="text-stone-500 text-sm">
            <span v-if="productStore.loading">در حال بارگذاری...</span>
            <span v-else>نمایش {{ filteredProducts.length }} محصول</span>
          </p>
        </div>

        <button 
          @click="showMobileFilters = !showMobileFilters"
          class="md:hidden w-full flex items-center justify-center gap-2 bg-white border border-stone-200 py-3 rounded-xl font-bold text-stone-700 shadow-sm"
        >
          <Filter class="w-5 h-5" />
          فیلتر و جستجو
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        <!-- SIDEBAR FILTERS COMPONENT -->
        <ProductFilterSidebar 
          v-model:showMobile="showMobileFilters"
          v-model:searchQuery="searchQuery"
          v-model:selectedCategory="selectedCategory"
          v-model:maxPrice="maxPrice"
          :categories="categories"
          @reset="resetFilters"
        />

        <!-- PRODUCT GRID -->
        <main class="lg:col-span-3">
          
          <!-- Sort Bar -->
          <div class="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 mb-6 flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-2 text-stone-500 text-sm">
              <SlidersHorizontal class="w-4 h-4" />
              <span>مرتب‌سازی:</span>
            </div>
            
            <div class="flex gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
              <button @click="sortOption = 'newest'" class="px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap" :class="sortOption === 'newest' ? 'bg-stone-900 text-white' : 'bg-stone-50 text-stone-600 hover:bg-stone-100'">جدیدترین</button>
              <button @click="sortOption = 'cheapest'" class="px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap" :class="sortOption === 'cheapest' ? 'bg-stone-900 text-white' : 'bg-stone-50 text-stone-600 hover:bg-stone-100'">ارزان‌ترین</button>
              <button @click="sortOption = 'expensive'" class="px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap" :class="sortOption === 'expensive' ? 'bg-stone-900 text-white' : 'bg-stone-50 text-stone-600 hover:bg-stone-100'">گران‌ترین</button>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="productStore.loading" class="flex justify-center py-20">
            <Loader2 class="w-10 h-10 animate-spin text-stone-400" />
          </div>

          <!-- Products List -->
          <div v-else-if="filteredProducts.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <ProductCard 
              v-for="product in filteredProducts" 
              :key="product.id" 
              :product="product" 
            />
          </div>

          <!-- Empty State -->
          <div v-else class="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-stone-100 text-center">
            <div class="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mb-4">
              <Search class="w-8 h-8 text-stone-300" />
            </div>
            <h3 class="text-lg font-bold text-stone-800 mb-2">محصولی یافت نشد</h3>
            <button @click="resetFilters" class="mt-4 text-accent font-bold text-sm hover:underline">پاک کردن فیلترها</button>
          </div>

        </main>
      </div>
    </div>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>