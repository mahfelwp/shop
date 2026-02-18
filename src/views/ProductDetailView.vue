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
  Headphones,
  Info
} from 'lucide-vue-next'
import ProductComments from '@/components/product/ProductComments.vue'
 
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
  <div class="bg-[#fafaf9] min-h-screen pt-24 pb-12 font-sans">
    <div class="container mx-auto px-4 md:px-8 max-w-7xl">
      
      <!-- Breadcrumbs -->
      <nav v-if="product" class="flex items-center gap-2 text-sm text-stone-500 mb-8 overflow-x-auto whitespace-nowrap pb-2">
        <router-link to="/" class="hover:text-stone-900 flex items-center gap-1 transition-colors"><Home class="w-3.5 h-3.5" /> خانه</router-link>
        <ChevronLeft class="w-3 h-3 text-stone-300" />
        <router-link to="/products" class="hover:text-stone-900 transition-colors">فروشگاه</router-link>
        <ChevronLeft class="w-3 h-3 text-stone-300" />
        <span class="hover:text-stone-900 cursor-pointer transition-colors">{{ product.category }}</span>
        <ChevronLeft class="w-3 h-3 text-stone-300" />
        <span class="text-stone-900 font-bold truncate">{{ product.title }}</span>
      </nav>
 
      <div v-if="loading" class="flex justify-center py-32">
        <div class="flex flex-col items-center gap-4">
          <div class="w-12 h-12 border-4 border-stone-200 border-t-stone-900 rounded-full animate-spin"></div>
          <span class="text-stone-400 text-sm animate-pulse font-medium">در حال بارگذاری محصول...</span>
        </div>
      </div>
 
      <div v-else-if="product" class="animate-fade-in">
        
        <!-- Main Product Section -->
        <div class="grid lg:grid-cols-12 gap-8 lg:gap-16 mb-20">
          
          <!-- Right Column: Gallery (Sticky) -->
          <div class="lg:col-span-7">
            <div class="lg:sticky lg:top-28 space-y-6">
              <!-- Main Image -->
              <div class="aspect-[4/3] lg:aspect-[16/12] rounded-[2rem] overflow-hidden bg-white border border-stone-100 shadow-sm relative group cursor-zoom-in">
                <img
                  v-if="selectedImage"
                  :src="selectedImage"
                  :alt="product.title"
                  class="w-full h-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div v-if="product.is_featured" class="absolute top-6 right-6 bg-stone-900 text-white text-xs font-bold px-4 py-2 rounded-full shadow-xl z-10 tracking-wide">
                  محصول ویژه
                </div>
              </div>
 
              <!-- Thumbnails -->
              <div class="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-1">
                <button
                  v-if="product.image"
                  @click="selectedImage = product.image"
                  class="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border-2 transition-all duration-300 flex-shrink-0 p-1 bg-white shadow-sm hover:shadow-md"
                  :class="selectedImage === product.image ? 'border-stone-900 scale-105' : 'border-transparent hover:border-stone-200'"
                >
                  <img :src="product.image" class="w-full h-full object-cover rounded-xl" />
                </button>
 
                <button
                  v-for="(img, idx) in galleryImages"
                  :key="idx"
                  @click="selectedImage = img"
                  class="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border-2 transition-all duration-300 flex-shrink-0 p-1 bg-white shadow-sm hover:shadow-md"
                  :class="selectedImage === img ? 'border-stone-900 scale-105' : 'border-transparent hover:border-stone-200'"
                >
                  <img :src="img" class="w-full h-full object-cover rounded-xl" />
                </button>
              </div>
            </div>
          </div>
 
          <!-- Left Column: Info & Actions -->
          <div class="lg:col-span-5 flex flex-col justify-center">
            <div class="bg-white rounded-[2.5rem] p-8 md:p-10 border border-stone-100 shadow-sm relative overflow-hidden">
              
              <!-- Background Pattern -->
              <div class="absolute top-0 right-0 w-full h-2 bg-gradient-to-r from-accent to-orange-300"></div>
 
              <!-- Header Info -->
              <div class="mb-8">
                <div class="flex items-center justify-between mb-4">
                  <span class="text-accent font-bold text-xs tracking-[0.15em] uppercase bg-accent/5 px-3 py-1 rounded-full">{{ product.category }}</span>
                  <div class="flex items-center gap-1.5 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-100">
                    <Star class="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span class="text-stone-800 font-bold text-sm pt-0.5">۴.۸</span>
                    <span class="text-stone-400 text-xs border-r border-stone-200 pr-2 mr-2">۱۲ نظر</span>
                  </div>
                </div>
                
                <h1 class="text-3xl md:text-4xl lg:text-5xl font-black text-stone-900 leading-[1.2] mb-6 tracking-tight">
                  {{ product.title }}
                </h1>
                
                <div class="flex items-baseline gap-3 mb-8">
                  <span class="text-4xl font-black text-stone-900 tracking-tight">{{ formattedPrice }}</span>
                  <span class="text-stone-500 text-lg font-medium">تومان</span>
                </div>
 
                <!-- Short Description -->
                <p class="text-stone-600 leading-loose text-justify text-sm md:text-base font-medium opacity-90 mb-8 border-r-2 border-stone-200 pr-4">
                  {{ product.description ? product.description.substring(0, 150) + '...' : 'توضیحات محصول به زودی اضافه می‌شود.' }}
                  <a href="#details" class="text-accent font-bold hover:underline mr-1">ادامه مطلب</a>
                </p>
              </div>
 
              <!-- Actions -->
              <div class="space-y-5 mb-10">
                <!-- Quantity & Add to Cart -->
                <div class="flex gap-4">
                  <div class="flex items-center bg-stone-50 rounded-2xl border border-stone-200 h-16 px-3 shadow-inner">
                    <button @click="incrementQty" class="w-10 h-full flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-white hover:shadow-sm rounded-xl transition-all"><Plus class="w-5 h-5" /></button>
                    <span class="w-10 text-center font-black text-xl text-stone-800">{{ quantity }}</span>
                    <button @click="decrementQty" class="w-10 h-full flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-white hover:shadow-sm rounded-xl transition-all"><Minus class="w-5 h-5" /></button>
                  </div>
                  
                  <button
                    @click="addToCart"
                    class="flex-1 bg-stone-900 text-white h-16 rounded-2xl font-bold text-lg hover:bg-accent transition-all duration-300 flex items-center justify-center gap-3 shadow-xl shadow-stone-900/20 hover:-translate-y-1 hover:shadow-accent/30"
                  >
                    <ShoppingCart class="w-6 h-6" />
                    افزودن به سبد خرید
                  </button>
                </div>
 
                <!-- Secondary Actions -->
                <div class="flex gap-4">
                  <button class="flex-1 h-12 border border-stone-200 rounded-xl flex items-center justify-center gap-2 text-stone-500 font-bold text-sm hover:bg-stone-50 hover:text-stone-900 hover:border-stone-300 transition-all">
                    <Heart class="w-4 h-4" /> افزودن به علاقه‌مندی
                  </button>
                  <button class="flex-1 h-12 border border-stone-200 rounded-xl flex items-center justify-center gap-2 text-stone-500 font-bold text-sm hover:bg-stone-50 hover:text-stone-900 hover:border-stone-300 transition-all">
                    <Share2 class="w-4 h-4" /> اشتراک‌گذاری
                  </button>
                </div>
              </div>
 
              <!-- Features Grid -->
              <div class="grid grid-cols-3 gap-3 text-center border-t border-stone-100 pt-8">
                <div class="flex flex-col items-center gap-3 group cursor-default">
                  <div class="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-400 group-hover:bg-green-50 group-hover:text-green-600 transition-colors duration-300">
                    <ShieldCheck class="w-6 h-6" />
                  </div>
                  <span class="text-xs font-bold text-stone-600">ضمانت اصالت</span>
                </div>
                <div class="flex flex-col items-center gap-3 group cursor-default">
                  <div class="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors duration-300">
                    <Truck class="w-6 h-6" />
                  </div>
                  <span class="text-xs font-bold text-stone-600">ارسال سریع</span>
                </div>
                <div class="flex flex-col items-center gap-3 group cursor-default">
                  <div class="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-400 group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors duration-300">
                    <Headphones class="w-6 h-6" />
                  </div>
                  <span class="text-xs font-bold text-stone-600">پشتیبانی</span>
                </div>
              </div>
 
            </div>
          </div>
        </div>
 
        <!-- Content Sections (Description, Video, Reviews) -->
        <div class="grid lg:grid-cols-12 gap-8 lg:gap-12" id="details">
          
          <!-- Left Content (Main) -->
          <div class="lg:col-span-8 space-y-12">
            
            <!-- Description -->
            <div class="bg-white rounded-[2.5rem] p-8 md:p-12 border border-stone-100 shadow-sm">
              <div class="flex items-center gap-4 mb-8">
                <div class="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent">
                  <Info class="w-6 h-6" />
                </div>
                <h3 class="text-2xl font-black text-stone-900">توضیحات و جزئیات</h3>
              </div>
              
              <div class="prose prose-stone prose-lg max-w-none leading-loose text-justify text-stone-600 font-medium">
                {{ product.description }}
              </div>
            </div>
 
            <!-- Video Section -->
            <div v-if="product.video" class="bg-stone-900 rounded-[2.5rem] p-2 shadow-2xl overflow-hidden">
              <div class="bg-stone-800 rounded-[2rem] overflow-hidden relative group">
                <div class="absolute top-6 right-6 z-10 bg-white/10 backdrop-blur-md text-white px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 border border-white/10">
                  <Video class="w-4 h-4" />
                  ویدیو معرفی محصول
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
            <div class="lg:sticky lg:top-28 space-y-8">
              
              <!-- Banner -->
              <div class="bg-stone-900 rounded-[2.5rem] p-8 text-white text-center relative overflow-hidden shadow-xl group">
                <div class="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/woven.png')] opacity-10"></div>
                <div class="absolute -bottom-10 -right-10 w-40 h-40 bg-accent rounded-full blur-[60px] opacity-20 group-hover:opacity-40 transition duration-700"></div>
                
                <div class="relative z-10">
                  <div class="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                    <Headphones class="w-8 h-8" />
                  </div>
                  <h3 class="text-2xl font-black mb-3">نیاز به مشاوره دارید؟</h3>
                  <p class="text-stone-400 text-sm mb-8 leading-relaxed">کارشناسان ما آماده پاسخگویی به سوالات شما درباره این محصول هستند.</p>
                  <button class="bg-white text-stone-900 px-8 py-4 rounded-xl font-bold text-sm hover:bg-accent hover:text-white transition-all duration-300 w-full shadow-lg">
                    تماس با پشتیبانی
                  </button>
                </div>
              </div>
 
              <!-- Related Products -->
              <div class="bg-white rounded-[2.5rem] p-8 border border-stone-100 shadow-sm">
                <h3 class="font-black text-xl mb-8 text-stone-900 flex items-center gap-2">
                  <span class="w-1.5 h-6 bg-accent rounded-full"></span>
                  محصولات مشابه
                </h3>
                <div v-if="relatedProducts.length > 0" class="space-y-6">
                  <div v-for="rel in relatedProducts" :key="rel.id" class="group flex gap-5 items-center cursor-pointer p-2 rounded-2xl hover:bg-stone-50 transition-colors duration-300" @click="router.push({ name: 'product-detail', params: { id: rel.slug || rel.id } })">
                    <div class="w-24 h-24 rounded-2xl bg-stone-100 overflow-hidden shrink-0 border border-stone-100 shadow-sm group-hover:shadow-md transition-all">
                      <img :src="rel.image" class="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                    </div>
                    <div>
                      <h4 class="font-bold text-stone-800 text-sm mb-2 group-hover:text-accent transition line-clamp-2 leading-relaxed">{{ rel.title }}</h4>
                      <div class="text-stone-900 font-black text-base">{{ rel.price.toLocaleString() }} <span class="text-xs font-normal text-stone-400">تومان</span></div>
                    </div>
                  </div>
                </div>
                <div v-else class="text-stone-400 text-sm text-center py-8 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                  محصول مشابهی یافت نشد.
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