<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useProductStore } from '@/stores/product'
import { SlidersHorizontal, Filter, Loader2, Search } from 'lucide-vue-next'
import ProductCard from '@/components/ProductCard.vue'
import ProductFilterSidebar from '@/components/product/ProductFilterSidebar.vue'
import { useHead } from '@vueuse/head'

type SortOption = 'newest' | 'cheapest' | 'expensive'

const productStore = useProductStore()

// Filters
const searchQuery = ref('')
const selectedCategory = ref('all')
const maxPrice = ref(5_000_000)
const sortOption = ref<SortOption>('newest')
const showMobileFilters = ref(false)

const normalizedSearch = computed(() => searchQuery.value.trim().toLowerCase())

const categories = computed(() => {
  const cats = new Set<string>()
  for (const p of productStore.products) {
    if (p.category) cats.add(p.category)
  }
  return ['all', ...Array.from(cats)]
})

const filteredProducts = computed(() => {
  const q = normalizedSearch.value
  const cat = selectedCategory.value
  const cap = maxPrice.value

  const result = productStore.products.filter((p) => {
    const title = (p.title ?? '').toLowerCase()
    const matchSearch = !q || title.includes(q)
    const matchCategory = cat === 'all' || p.category === cat
    const matchPrice = (p.price ?? 0) <= cap
    return matchSearch && matchCategory && matchPrice
  })

  // avoid mutating original array ordering (sort on copy)
  return result.slice().sort((a, b) => {
    if (sortOption.value === 'cheapest') return (a.price ?? 0) - (b.price ?? 0)
    if (sortOption.value === 'expensive') return (b.price ?? 0) - (a.price ?? 0)
    return (b.id ?? 0) - (a.id ?? 0)
  })
})

const activeCategoryLabel = computed(() =>
  selectedCategory.value !== 'all' ? selectedCategory.value : null,
)

useHead({
  title: computed(() => (activeCategoryLabel.value ? `خرید ${activeCategoryLabel.value}` : 'فروشگاه محصولات')),
  meta: [
    {
      name: 'description',
      content: computed(() => {
        const suffix = activeCategoryLabel.value ? ` دسته‌بندی ${activeCategoryLabel.value}` : ''
        return `لیست کامل محصولات حصیری${suffix}. خرید آنلاین با بهترین قیمت و کیفیت تضمینی.`
      }),
    },
  ],
})

onMounted(() => {
  // اگر قبلاً لود شده، بی‌خودی دوباره نزن
  if (!productStore.products.length) productStore.fetchProducts()
})

function resetFilters() {
  selectedCategory.value = 'all'
  searchQuery.value = ''
  maxPrice.value = 5_000_000
  sortOption.value = 'newest'
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
          type="button"
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
              <button
                type="button"
                @click="sortOption = 'newest'"
                class="px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap"
                :class="sortOption === 'newest' ? 'bg-stone-900 text-white' : 'bg-stone-50 text-stone-600 hover:bg-stone-100'"
              >
                جدیدترین
              </button>
              <button
                type="button"
                @click="sortOption = 'cheapest'"
                class="px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap"
                :class="sortOption === 'cheapest' ? 'bg-stone-900 text-white' : 'bg-stone-50 text-stone-600 hover:bg-stone-100'"
              >
                ارزان‌ترین
              </button>
              <button
                type="button"
                @click="sortOption = 'expensive'"
                class="px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap"
                :class="sortOption === 'expensive' ? 'bg-stone-900 text-white' : 'bg-stone-50 text-stone-600 hover:bg-stone-100'"
              >
                گران‌ترین
              </button>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="productStore.loading" class="flex justify-center py-20">
            <Loader2 class="w-10 h-10 animate-spin text-stone-400" />
          </div>

          <!-- Products List -->
          <div v-else-if="filteredProducts.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <ProductCard v-for="product in filteredProducts" :key="product.id" :product="product" />
          </div>

          <!-- Empty State -->
          <div v-else class="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-stone-100 text-center">
            <div class="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mb-4">
              <Search class="w-8 h-8 text-stone-300" />
            </div>
            <h3 class="text-lg font-bold text-stone-800 mb-2">محصولی یافت نشد</h3>
            <button type="button" @click="resetFilters" class="mt-4 text-accent font-bold text-sm hover:underline">
              پاک کردن فیلترها
            </button>
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