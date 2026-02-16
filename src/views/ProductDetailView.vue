<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useCartStore } from '@/stores/cart'
import { ShoppingCart, ArrowRight, Star, Truck, ShieldCheck, Heart } from 'lucide-vue-next'
import ProductComments from '@/components/product/ProductComments.vue'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()

const product = ref<any>(null)
const loading = ref(true)
const selectedImage = ref('')

onMounted(async () => {
  const id = route.params.id
  if (!id) return

  loading.value = true
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (data) {
    product.value = data
    selectedImage.value = data.image
  } else {
    router.push('/products')
  }
  loading.value = false
})

const addToCart = () => {
  if (product.value) {
    cartStore.addItem(product.value)
  }
}
</script>

<template>
  <div class="bg-stone-50 min-h-screen pt-32 pb-12">
    <div class="container mx-auto px-4 md:px-8">
      
      <button @click="router.back()" class="flex items-center gap-2 text-stone-500 hover:text-stone-900 mb-8 transition font-bold text-sm">
        <ArrowRight class="w-4 h-4" /> بازگشت
      </button>

      <div v-if="loading" class="flex justify-center py-20">
        <div class="w-10 h-10 border-4 border-stone-200 border-t-stone-900 rounded-full animate-spin"></div>
      </div>

      <div v-else-if="product" class="animate-fade-in">
        <div class="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-stone-100 grid lg:grid-cols-2 gap-12">
          
          <!-- Gallery -->
          <div class="space-y-4">
            <div class="aspect-square rounded-2xl overflow-hidden bg-stone-100 border border-stone-200">
              <img :src="selectedImage" class="w-full h-full object-cover" />
            </div>
            <div class="flex gap-4 overflow-x-auto pb-2">
              <button 
                @click="selectedImage = product.image"
                class="w-20 h-20 rounded-xl overflow-hidden border-2 transition flex-shrink-0"
                :class="selectedImage === product.image ? 'border-stone-900' : 'border-transparent hover:border-stone-300'"
              >
                <img :src="product.image" class="w-full h-full object-cover" />
              </button>
              <button 
                v-for="(img, idx) in product.gallery" 
                :key="idx"
                @click="selectedImage = img"
                class="w-20 h-20 rounded-xl overflow-hidden border-2 transition flex-shrink-0"
                :class="selectedImage === img ? 'border-stone-900' : 'border-transparent hover:border-stone-300'"
              >
                <img :src="img" class="w-full h-full object-cover" />
              </button>
            </div>
          </div>

          <!-- Info -->
          <div>
            <div class="flex items-center gap-2 mb-4">
              <span class="bg-stone-100 text-stone-600 px-3 py-1 rounded-full text-xs font-bold">{{ product.category }}</span>
              <span v-if="product.is_featured" class="bg-accent text-white px-3 py-1 rounded-full text-xs font-bold">ویژه</span>
            </div>

            <h1 class="text-3xl md:text-4xl font-black text-stone-900 mb-4">{{ product.title }}</h1>
            
            <div class="flex items-center gap-4 mb-8">
              <div class="text-3xl font-black text-stone-900">
                {{ product.price.toLocaleString() }} <span class="text-sm font-normal text-stone-500">تومان</span>
              </div>
            </div>

            <p class="text-stone-600 leading-relaxed mb-8 text-lg">
              {{ product.description || 'توضیحات محصول به زودی اضافه می‌شود.' }}
            </p>

            <div class="flex gap-4 mb-8">
              <button 
                @click="addToCart"
                class="flex-1 bg-stone-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-accent transition flex items-center justify-center gap-2 shadow-lg shadow-stone-900/20"
              >
                <ShoppingCart class="w-5 h-5" /> افزودن به سبد خرید
              </button>
              <button class="w-14 h-14 border border-stone-200 rounded-xl flex items-center justify-center hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition">
                <Heart class="w-6 h-6" />
              </button>
            </div>

            <div class="grid grid-cols-2 gap-4 text-sm text-stone-600">
              <div class="flex items-center gap-3 bg-stone-50 p-3 rounded-xl">
                <Truck class="w-5 h-5 text-stone-400" />
                <span>ارسال سریع به سراسر کشور</span>
              </div>
              <div class="flex items-center gap-3 bg-stone-50 p-3 rounded-xl">
                <ShieldCheck class="w-5 h-5 text-stone-400" />
                <span>ضمانت اصالت و سلامت کالا</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Comments Section -->
        <ProductComments :productId="product.id" />
      </div>
    </div>
  </div>
</template>