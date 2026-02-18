<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useCartStore } from '@/stores/cart'
import { useSettingsStore } from '@/stores/settings'
import { 
  ShoppingCart, 
  ArrowRight, 
  Truck, 
  ShieldCheck, 
  Heart, 
  Video, 
  Star, 
  Share2, 
  Minus, 
  Plus, 
  Home,
  ChevronLeft,
  Headphones
} from 'lucide-vue-next'
import ProductComments from '@/components/product/ProductComments.vue'
import ProductCard from '@/components/ProductCard.vue'
 
type Product = {
  id: number
  slug: string | null
  title: string
  description: string | null
  category: string | null
  is_featured: boolean | null
  price: number
  image: string | null
  gallery: string[] | null
  video: string | null
  stock: number
}
 
const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const settingsStore = useSettingsStore()
 
const product = ref<Product | null>(null)
const relatedProducts = ref<any[]>([])
const loading = ref(false)
const selectedImage = ref('')
const quantity = ref(1)
 
const rawParam = computed(() => {
  const p = route.params.id
  return Array.isArray(p) ? (p[0] ?? '') : String(p ?? '')
})
 
const isNumericId = (value: string) => /^\d+$/.test(value)
 
const galleryImages = computed(() => {
  const g = product.value?.gallery
  return Array.isArray(g) ? g : []
})
 
const formattedPrice = computed(() => {
  const price = product.value?.price
  return typeof price === 'number' ? price.toLocaleString() : ''
})
 
async function ensureSettingsLoaded() {
  if (!settingsStore.isLoaded) await settingsStore.fetchSettings()
}
 
function canonicalParamFor(product: Product): string {
  const urlType = settingsStore.settings?.product_url_type || 'id'
  if (urlType === 'slug' && product.slug) return product.slug
  return String(product.id)
}
 
async function fetchProduct(param: string): Promise<Product | null> {
  let query = supabase.from('products').select('*')
 
  if (isNumericId(param)) query = query.eq('id', Number(param))
  else query = query.eq('slug', param)
 
  const { data, error } = await query.single<Product>()
  if (error) return null
  return data ?? null
}
 
async function fetchRelatedProducts(category: string, currentId: number) {
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('category', category)
    .neq('id', currentId)
    .limit(4)
  
  if (data) relatedProducts.value = data
}
 
async function load() {
  const param = rawParam.value.trim()
  if (!param) {
    product.value = null
    selectedImage.value = ''
    return
  }
 
  loading.value = true
  try {
    await ensureSettingsLoaded()
 
    const data = await fetchProduct(param)
    if (!data) {
      product.value = null
      selectedImage.value = ''
      await router.replace({ name: 'products' })
      return
    }
 
    // Canonical redirect
    const canonical = canonicalParamFor(data)
    if (canonical !== param) {
      await router.replace({
        name: 'product-detail',
        params: { id: canonical },
        query: route.query,
        hash: route.hash,
      })
      return
    }
 
    product.value = data
    selectedImage.value = data.image || data.gallery?.[0] || ''
    quantity.value = 1
    
    // Fetch related
    if (data.category) {
      await fetchRelatedProducts(data.category, data.id)
    }
  } finally {
    loading.value = false
  }
}
 
watch(rawParam, () => void load(), { immediate: true })
 
function addToCart() {
  if (product.value) {
    // Add item multiple times based on quantity
    // Note: Ideally cart store should support adding with quantity directly
    // For now we loop, or update cart store to accept quantity
    for(let i=0; i<quantity.value; i++) {
      cartStore.addItem(product.value)
    }
  }
}
 
function incrementQty() {
  if (product.value && quantity.value < (product.value.stock || 99)) {
    quantity.value++
  }
}
 
function decrementQty() {
  if (quantity.value > 1) {
    quantity.value--
  }
}
</script>
 
<template>
  <div class="bg-[#fafaf9] min-h-screen pt-24 pb-12">
    <div class="container mx-auto px-4 md:px-8 max-w-7xl">
      
      <!-- Breadcrumbs -->
      <nav v-if="product" class="flex items-center gap-2 text-sm text-stone-500 mb-8 overflow-x-auto whitespace-nowrap pb-2">
        <router-link to="/" class="hover:text-stone-900 flex items-center gap-1"><Home class="w-3.5 h-3.5" /> خانه</router-link>
        <ChevronLeft class="w-3 h-3 text-stone-300" />
        <router-link to="/products" class="hover:text-stone-900">فروشگاه</router-link>
        <ChevronLeft class="w-3 h-3 text-stone-300" />
        <span class="hover:text-stone-900 cursor-pointer">{{ product.category }}</span>
        <ChevronLeft class="w-3 h-3 text-stone-300" />
        <span class="text-stone-900 font-bold truncate">{{ product.title }}</span>
      </nav>
 
      <div v-if="loading" class="flex justify-center py-32">
        <div class="flex flex-col items-center gap-4">
          <div class="w-12 h-12 border-4 border-stone-200 border-t-stone-900 rounded-full animate-spin"></div>
          <span class="text-stone-400 text-sm animate-pulse">در حال بارگذاری محصول...</span>
        </div>
      </div>
 
      <div v-else-if="product" class="animate-fade-in">
        
        <!-- Main Product Section -->
        <div class="grid lg:grid-cols-12 gap-8 lg:gap-12 mb-16">
          
          <!-- Right Column: Gallery (Sticky) -->
          <div class="lg:col-span-7">
            <div class="lg:sticky lg:top-28 space-y-4">
              <!-- Main Image -->
              <div class="aspect-[4/3] lg:aspect-[16/11] rounded-3xl overflow-hidden bg-white border border-stone-100 shadow-sm relative group cursor-zoom-in">
                <img
                  v-if="selectedImage"
                  :src="selectedImage"
                  :alt="product.title"
                  class="w-full h-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div v-if="product.is_featured" class="absolute top-4 right-4 bg-stone-900 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg z-10">
                  محصول ویژه
                </div>
              </div>
 
              <!-- Thumbnails -->
              <div class="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                <button
                  v-if="product.image"
                  @click="selectedImage = product.image"
                  class="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border-2 transition flex-shrink-0 p-1 bg-white"
                  :class="selectedImage === product.image ? 'border-stone-900' : 'border-transparent hover:border-stone-200'"
                >
                  <img :src="product.image" class="w-full h-full object-cover rounded-xl" />
                </button>
 
                <button
                  v-for="(img, idx) in galleryImages"
                  :key="idx"
                  @click="selectedImage = img"
                  class="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border-2 transition flex-shrink-0 p-1 bg-white"
                  :class="selectedImage === img ? 'border-stone-900' : 'border-transparent hover:border-stone-200'"
                >
                  <img :src="img" class="w-full h-full object-cover rounded-xl" />
                </button>
              </div>
            </div>
          </div>
 
          <!-- Left Column: Info & Actions -->
          <div class="lg:col-span-5">
            <div class="bg-white rounded-3xl p-6 md:p-8 border border-stone-100 shadow-sm h-full">
              
              <!-- Header Info -->
              <div class="border-b border-stone-100 pb-6 mb-6">
                <div class="flex items-center justify-between mb-3">
                  <span class="text-accent font-bold text-sm tracking-wider uppercase">{{ product.category }}</span>
                  <div class="flex items-center gap-1 text-yellow-400">
                    <Star class="w-4 h-4 fill-current" />
                    <span class="text-stone-700 font-bold text-sm pt-0.5">۴.۸</span>
                    <span class="text-stone-400 text-xs">(۱۲ نظر)</span>
                  </div>
                </div>
                <h1 class="text-2xl md:text-3xl lg:text-4xl font-black text-stone-900 leading-tight mb-4">{{ product.title }}</h1>
                <div class="flex items-end gap-2">
                  <span class="text-3xl font-black text-stone-900">{{ formattedPrice }}</span>
                  <span class="text-stone-500 font-medium mb-1.5">تومان</span>
                </div>
              </div>
 
              <!-- Short Description -->
              <div class="mb-8">
                <p class="text-stone-600 leading-relaxed text-justify line-clamp-4">
                  {{ product.description || 'توضیحات محصول به زودی اضافه می‌شود.' }}
                </p>
                <a href="#details" class="text-sm font-bold text-stone-900 border-b border-stone-900 mt-2 inline-block hover:text-accent hover:border-accent transition">مشاهده توضیحات کامل</a>
              </div>
 
              <!-- Actions -->
              <div class="space-y-4 mb-8">
                <!-- Quantity & Add to Cart -->
                <div class="flex gap-3">
                  <div class="flex items-center bg-stone-50 rounded-xl border border-stone-200 h-14 px-2">
                    <button @click="incrementQty" class="w-10 h-full flex items-center justify-center text-stone-600 hover:text-stone-900 transition"><Plus class="w-4 h-4" /></button>
                    <span class="w-8 text-center font-bold text-lg">{{ quantity }}</span>
                    <button @click="decrementQty" class="w-10 h-full flex items-center justify-center text-stone-600 hover:text-stone-900 transition"><Minus class="w-4 h-4" /></button>
                  </div>
                  
                  <button
                    @click="addToCart"
                    class="flex-1 bg-stone-900 text-white h-14 rounded-xl font-bold text-lg hover:bg-accent transition flex items-center justify-center gap-2 shadow-lg shadow-stone-900/20 hover:-translate-y-1"
                  >
                    <ShoppingCart class="w-5 h-5" />
                    افزودن به سبد خرید
                  </button>
                </div>
 
                <!-- Secondary Actions -->
                <div class="flex gap-3">
                  <button class="flex-1 h-12 border border-stone-200 rounded-xl flex items-center justify-center gap-2 text-stone-600 font-bold text-sm hover:bg-stone-50 transition">
                    <Heart class="w-4 h-4" /> افزودن به علاقه‌مندی
                  </button>
                  <button class="flex-1 h-12 border border-stone-200 rounded-xl flex items-center justify-center gap-2 text-stone-600 font-bold text-sm hover:bg-stone-50 transition">
                    <Share2 class="w-4 h-4" /> اشتراک‌گذاری
                  </button>
                </div>
              </div>
 
              <!-- Features Grid -->
              <div class="grid grid-cols-3 gap-2 text-center">
                <div class="bg-stone-50 p-3 rounded-2xl flex flex-col items-center gap-2">
                  <div class="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-stone-700"><ShieldCheck class="w-4 h-4" /></div>
                  <span class="text-[10px] font-bold text-stone-600">ضمانت اصالت</span>
                </div>
                <div class="bg-stone-50 p-3 rounded-2xl flex flex-col items-center gap-2">
                  <div class="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-stone-700"><Truck class="w-4 h-4" /></div>
                  <span class="text-[10px] font-bold text-stone-600">ارسال سریع</span>
                </div>
                <div class="bg-stone-50 p-3 rounded-2xl flex flex-col items-center gap-2">
                  <div class="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-stone-700"><Headphones class="w-4 h-4" /></div>
                  <span class="text-[10px] font-bold text-stone-600">پشتیبانی</span>
                </div>
              </div>
 
            </div>
          </div>
        </div>
 
        <!-- Content Sections (Description, Video, Reviews) -->
        <div class="grid lg:grid-cols-12 gap-8" id="details">
          
          <!-- Left Content -->
          <div class="lg:col-span-8 space-y-8">
            
            <!-- Description -->
            <div class="bg-white rounded-3xl p-8 border border-stone-100 shadow-sm">
              <h3 class="text-xl font-black text-stone-900 mb-6 flex items-center gap-2">
                <span class="w-2 h-8 bg-accent rounded-full"></span>
                توضیحات محصول
              </h3>
              <div class="prose prose-stone max-w-none leading-loose text-justify text-stone-600">
                {{ product.description }}
              </div>
            </div>
 
            <!-- Video Section -->
            <div v-if="product.video" class="bg-stone-900 rounded-3xl p-1 overflow-hidden shadow-xl">
              <div class="bg-stone-800 rounded-[20px] overflow-hidden relative">
                <div class="absolute top-4 right-4 z-10 bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                  <Video class="w-4 h-4" />
                  ویدیو معرفی
                </div>
                <video controls class="w-full aspect-video object-cover" :poster="product.image || ''">
                  <source :src="product.video" type="video/mp4">
                  مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
                </video>
              </div>
            </div>
 
            <!-- Comments -->
            <ProductComments :productId="product.id" />
          </div>
 
          <!-- Right Sidebar (Sticky) -->
          <div class="lg:col-span-4">
            <div class="lg:sticky lg:top-28 space-y-6">
              <!-- Related Products -->
              <div class="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm">
                <h3 class="font-bold text-lg mb-6">محصولات مشابه</h3>
                <div v-if="relatedProducts.length > 0" class="space-y-6">
                  <div v-for="rel in relatedProducts" :key="rel.id" class="group flex gap-4 items-center cursor-pointer" @click="router.push({ name: 'product-detail', params: { id: rel.slug || rel.id } })">
                    <div class="w-20 h-20 rounded-xl bg-stone-100 overflow-hidden shrink-0 border border-stone-100">
                      <img :src="rel.image" class="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                    </div>
                    <div>
                      <h4 class="font-bold text-stone-800 text-sm mb-1 group-hover:text-accent transition line-clamp-2">{{ rel.title }}</h4>
                      <div class="text-stone-900 font-bold text-sm">{{ rel.price.toLocaleString() }} <span class="text-xs font-normal text-stone-400">تومان</span></div>
                    </div>
                  </div>
                </div>
                <div v-else class="text-stone-400 text-sm text-center py-4">
                  محصول مشابهی یافت نشد.
                </div>
              </div>
 
              <!-- Banner -->
              <div class="bg-accent rounded-3xl p-8 text-white text-center relative overflow-hidden">
                <div class="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/woven.png')] opacity-10"></div>
                <div class="relative z-10">
                  <h3 class="text-2xl font-black mb-2">نیاز به راهنمایی دارید؟</h3>
                  <p class="text-white/90 text-sm mb-6">کارشناسان ما آماده پاسخگویی به سوالات شما هستند.</p>
                  <button class="bg-white text-accent px-6 py-3 rounded-xl font-bold text-sm hover:bg-stone-100 transition w-full">تماس با پشتیبانی</button>
                </div>
              </div>
            </div>
          </div>
 
        </div>
 
      </div>
    </div>
  </div>
</template>
 
<style scoped>
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>