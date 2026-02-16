<script setup lang="ts">
import { ShoppingCart, Heart, Eye } from 'lucide-vue-next'
import { useCartStore } from '@/stores/cart'
import { useSettingsStore } from '@/stores/settings'
import { useRouter } from 'vue-router'
import { onMounted } from 'vue'

const props = defineProps<{
  product: {
    id: number
    title: string
    price: number
    image: string
    category: string
    isNew?: boolean
    discount?: number
    slug?: string
  }
}>()

const cartStore = useCartStore()
const settingsStore = useSettingsStore()
const router = useRouter()

onMounted(() => {
  // اطمینان از لود شدن تنظیمات
  if (!settingsStore.settings.product_url_type) {
    settingsStore.fetchSettings()
  }
})

const addToCart = (e: Event) => {
  e.stopPropagation()
  e.preventDefault()
  cartStore.addItem(props.product)
}

const goToDetail = () => {
  const urlType = settingsStore.settings.product_url_type || 'id'
  const param = (urlType === 'slug' && props.product.slug) ? props.product.slug : props.product.id
  router.push({ name: 'product-detail', params: { id: param } })
}
</script>

<template>
  <div class="group relative cursor-pointer" @click="goToDetail">
    <!-- Image Container -->
    <div class="relative aspect-[3/4] overflow-hidden rounded-[32px] bg-stone-100 mb-5 shadow-sm group-hover:shadow-xl transition-all duration-500">
      <img :src="props.product.image" :alt="props.product.title" class="w-full h-full object-cover transition duration-700 group-hover:scale-110" />
      
      <!-- Overlay on Hover -->
      <div class="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition duration-500"></div>

      <!-- Badges -->
      <div class="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <span v-if="props.product.isNew" class="bg-stone-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-full tracking-wider shadow-lg">NEW</span>
        <span v-if="props.product.discount" class="bg-accent text-white text-[10px] font-bold px-3 py-1.5 rounded-full tracking-wider shadow-lg">-{{ props.product.discount }}%</span>
      </div>

      <!-- Hover Actions (Floating) -->
      <div class="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 opacity-0 translate-y-8 group-hover:opacity-100 group-hover:translate-y-0 transition duration-500 delay-100 w-max">
        <button @click="addToCart" class="w-12 h-12 bg-white text-stone-900 rounded-full flex items-center justify-center hover:bg-stone-900 hover:text-white transition-all duration-300 shadow-xl hover:scale-110" title="افزودن به سبد">
          <ShoppingCart class="w-5 h-5" />
        </button>
        <button class="w-12 h-12 bg-white text-stone-900 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all duration-300 shadow-xl hover:scale-110" title="علاقمندی">
          <Heart class="w-5 h-5" />
        </button>
        <button class="w-12 h-12 bg-white text-stone-900 rounded-full flex items-center justify-center hover:bg-accent hover:text-white transition-all duration-300 shadow-xl hover:scale-110" title="مشاهده سریع">
          <Eye class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Info -->
    <div class="px-2">
      <div class="flex justify-between items-start mb-1">
        <h3 class="font-bold text-stone-900 text-lg group-hover:text-accent transition duration-300 line-clamp-1">{{ props.product.title }}</h3>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-sm text-stone-500 font-medium">{{ props.product.category }}</span>
        <div class="flex flex-col items-end">
           <span v-if="props.product.discount" class="text-xs text-stone-400 line-through decoration-red-400 mb-0.5">
            {{ (props.product.price * (1 + props.product.discount/100)).toLocaleString() }}
          </span>
          <span class="font-black text-stone-800 text-lg">{{ props.product.price.toLocaleString() }} <span class="text-xs font-normal text-stone-500">تومان</span></span>
        </div>
      </div>
    </div>
  </div>
</template>