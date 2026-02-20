<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
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
  ChevronLeft,
  X,
  Play,
  Headphones,
  Phone
} from 'lucide-vue-next'
import ProductComments from '@/components/product/ProductComments.vue'
import { useHead } from '@vueuse/head'

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

type RelatedProduct = Pick<Product, 'id' | 'slug' | 'title' | 'price' | 'image' | 'category'>

type MediaItem =
  | { type: 'image'; src: string; thumb: string }
  | { type: 'video'; src: string; thumb: string }

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const settingsStore = useSettingsStore()

const product = ref<Product | null>(null)
const relatedProducts = ref<RelatedProduct[]>([])
const loading = ref(false)

const selectedImage = ref('')
const quantity = ref(1)

/* ----------------------------- UI states ----------------------------- */
const activeTab = ref<'desc' | 'video' | 'comments'>('desc')

// lightbox
const lightboxOpen = ref(false)
const lightboxIndex = ref(0)

/* ----------------------------- Route param ---------------------------- */
const rawParam = computed(() => {
  const p = route.params.id
  return Array.isArray(p) ? (p[0] ?? '') : String(p ?? '')
})

const isNumericId = (value: string) => /^\d+$/.test(value)

/* ------------------------------ Computeds ----------------------------- */
const formattedPrice = computed(() => {
  const price = product.value?.price
  return typeof price === 'number' ? price.toLocaleString() : ''
})

const fullDescription = computed(() => product.value?.description?.trim() || 'توضیحات محصول به زودی اضافه می‌شود.')

const shortDescription = computed(() => {
  const txt = product.value?.description?.trim()
  if (!txt) return 'توضیحات محصول به زودی اضافه می‌شود.'
  return txt.length > 180 ? `${txt.slice(0, 180)}...` : txt
})

const stock = computed(() => product.value?.stock ?? 0)
const inStock = computed(() => stock.value > 0)
const maxQty = computed(() => (inStock.value ? stock.value : 1))

const canIncrement = computed(() => inStock.value && quantity.value < maxQty.value)
const canDecrement = computed(() => quantity.value > 1)

function clampQty() {
  if (quantity.value < 1) quantity.value = 1
  if (quantity.value > maxQty.value) quantity.value = maxQty.value
}

const imageList = computed(() => {
  const p = product.value
  if (!p) return []
  const imgs: string[] = []
  if (p.image) imgs.push(p.image)
  if (Array.isArray(p.gallery)) imgs.push(...p.gallery.filter(Boolean))
  return Array.from(new Set(imgs))
})

const mediaItems = computed<MediaItem[]>(() => {
  const p = product.value
  if (!p) return []

  const items: MediaItem[] = []

  // Images
  for (const img of imageList.value) {
    items.push({ type: 'image', src: img, thumb: img })
  }

  // Video as a "thumbnail" (uses poster = main image if available)
  if (p.video) {
    const poster = p.image || imageList.value[0] || ''
    items.unshift({ type: 'video', src: p.video, thumb: poster })
  }

  return items
})

const currentSelectedMediaIndex = computed(() => {
  // if video is active tab, selection is not image-based; keep simple:
  const idx = mediaItems.value.findIndex((m) => m.type === 'image' && m.src === selectedImage.value)
  return idx >= 0 ? idx : 0
})

/* ----------------------------- Settings ----------------------------- */
async function ensureSettingsLoaded() {
  if (!settingsStore.isLoaded) await settingsStore.fetchSettings()
}

function canonicalParamFor(p: Product): string {
  const urlType = settingsStore.settings?.product_url_type || 'id'
  if (urlType === 'slug' && p.slug) return p.slug
  return String(p.id)
}

function routeParamFor(p: { id: number; slug: string | null }): string {
  const urlType = settingsStore.settings?.product_url_type || 'id'
  if (urlType === 'slug' && p.slug) return p.slug
  return String(p.id)
}

/* ----------------------------- Supabase fetch ----------------------------- */
async function fetchProduct(param: string): Promise<Product | null> {
  let query = supabase
    .from('products')
    .select('id, slug, title, description, category, is_featured, price, image, gallery, video, stock')

  query = isNumericId(param) ? query.eq('id', Number(param)) : query.eq('slug', param)

  const { data, error } = await query.single<Product>()
  if (error) return null
  return data ?? null
}

async function fetchRelatedProducts(category: string, currentId: number) {
  const { data } = await supabase
    .from('products')
    .select('id, slug, title, price, image, category')
    .eq('category', category)
    .neq('id', currentId)
    .order('id', { ascending: false })
    .limit(4)

  relatedProducts.value = (data ?? []) as RelatedProduct[]
}

/* ----------------------------- Load orchestration ----------------------------- */
let loadSeq = 0

async function load() {
  const seq = ++loadSeq
  const param = rawParam.value.trim()

  if (!param) {
    product.value = null
    relatedProducts.value = []
    selectedImage.value = ''
    quantity.value = 1
    activeTab.value = 'desc'
    return
  }

  loading.value = true
  relatedProducts.value = []

  try {
    await ensureSettingsLoaded()

    const data = await fetchProduct(param)
    if (seq !== loadSeq) return

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
    quantity.value = 1
    clampQty()

    // pick initial media
    const imgs = imageList.value
    selectedImage.value = imgs.includes(selectedImage.value) ? selectedImage.value : (imgs[0] ?? '')

    // default tab: if there is a video, keep desc; user can switch
    activeTab.value = 'desc'

    if (data.category) void fetchRelatedProducts(data.category, data.id)
  } finally {
    if (seq === loadSeq) loading.value = false
  }
}

watch(rawParam, () => void load(), { immediate: true })
watch(stock, clampQty)

/* ----------------------------- Actions ----------------------------- */
function addToCart() {
  if (!product.value) return
  if (!inStock.value) return
  clampQty()
  for (let i = 0; i < quantity.value; i++) cartStore.addItem(product.value)
}

function incrementQty() {
  if (canIncrement.value) quantity.value++
}

function decrementQty() {
  if (canDecrement.value) quantity.value--
}

function goToRelated(rel: RelatedProduct) {
  router.push({ name: 'product-detail', params: { id: routeParamFor(rel) } })
}

async function shareProduct() {
  const p = product.value
  if (!p) return
  const url = window.location.href
  const title = p.title
  const text = shortDescription.value

  // Web Share API (mobile-friendly)
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url })
      return
    } catch {
      // ignore cancel
    }
  }

  // fallback: copy link
  try {
    await navigator.clipboard.writeText(url)
    alert('لینک محصول کپی شد.')
  } catch {
    prompt('لینک را کپی کنید:', url)
  }
}

/* ----------------------------- Lightbox ----------------------------- */
function openLightbox(index?: number) {
  const items = mediaItems.value
  if (!items.length) return
  lightboxIndex.value = typeof index === 'number' ? index : currentSelectedMediaIndex.value
  lightboxOpen.value = true
}

function closeLightbox() {
  lightboxOpen.value = false
}

function nextLightbox() {
  const items = mediaItems.value
  if (!items.length) return
  lightboxIndex.value = (lightboxIndex.value + 1) % items.length
}

function prevLightbox() {
  const items = mediaItems.value
  if (!items.length) return
  lightboxIndex.value = (lightboxIndex.value - 1 + items.length) % items.length
}

function onKeydown(e: KeyboardEvent) {
  if (!lightboxOpen.value) return
  if (e.key === 'Escape') closeLightbox()
  if (e.key === 'ArrowRight') prevLightbox() // RTL-friendly
  if (e.key === 'ArrowLeft') nextLightbox()
}

window.addEventListener('keydown', onKeydown)
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

/* -------------------------------- SEO -------------------------------- */
useHead({
  title: computed(() => (product.value ? `${product.value.title} | فروشگاه` : 'محصول | فروشگاه')),
  meta: [
    {
      name: 'description',
      content: computed(() => {
        if (!product.value) return 'مشاهده جزئیات محصول و خرید آنلاین.'
        const cat = product.value.category ? ` در دسته‌بندی ${product.value.category}` : ''
        return `${shortDescription.value}${cat}`
      }),
    },
    { property: 'og:type', content: 'product' },
    { property: 'og:title', content: computed(() => (product.value ? product.value.title : 'محصول')) },
    { property: 'og:description', content: computed(() => shortDescription.value) },
    { property: 'og:image', content: computed(() => product.value?.image || product.value?.gallery?.[0] || '') },
  ],
})
</script>

<template>
  <!-- Main Container -->
  <div class="bg-[#f9f9f9] min-h-screen pt-24 pb-28 md:pb-20 font-sans text-stone-800">
    <div class="container mx-auto px-4 md:px-8 max-w-[1400px]">
      
      <!-- Breadcrumbs -->
      <nav v-if="product" class="flex items-center gap-2 text-xs md:text-sm text-stone-500 mb-6 overflow-x-auto whitespace-nowrap pb-2">
        <router-link to="/" class="hover:text-stone-900 transition-colors">خانه</router-link>
        <ChevronLeft class="w-3 h-3 text-stone-300" />
        <router-link to="/products" class="hover:text-stone-900 transition-colors">فروشگاه</router-link>
        <ChevronLeft class="w-3 h-3 text-stone-300" />
        <span class="text-stone-400">{{ product.category }}</span>
        <ChevronLeft class="w-3 h-3 text-stone-300" />
        <span class="text-stone-900 font-bold truncate">{{ product.title }}</span>
      </nav>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-32">
        <div class="flex flex-col items-center gap-4">
          <div class="w-10 h-10 border-2 border-stone-200 border-t-stone-800 rounded-full animate-spin"></div>
          <span class="text-stone-400 text-sm">در حال بارگذاری...</span>
        </div>
      </div>

      <div v-else-if="product" class="animate-fade-in">
        
        <!-- 3-Column Layout for Desktop -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mb-12">
          
          <!-- 1. GALLERY (Right Column - 5 cols) -->
          <div class="lg:col-span-5">
            <div class="sticky top-28 space-y-4">
              <!-- Main Image -->
              <div class="aspect-[4/3] lg:aspect-square rounded-3xl overflow-hidden bg-white shadow-sm border border-stone-100 relative group">
                <button v-if="activeTab !== 'video'" type="button" class="absolute inset-0 z-10 cursor-zoom-in" @click="openLightbox()" aria-label="بزرگنمایی"></button>
                
                <img
                  v-if="activeTab !== 'video' && selectedImage"
                  :src="selectedImage"
                  :alt="product.title"
                  class="w-full h-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div v-else class="w-full h-full bg-black flex items-center justify-center">
                  <video v-if="product.video" controls class="w-full h-full object-contain" :poster="product.image || ''">
                    <source :src="product.video" type="video/mp4" />
                  </video>
                </div>

                <div v-if="product.is_featured" class="absolute top-4 right-4 bg-stone-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-full tracking-wide z-20 shadow-lg">
                  ویژه
                </div>
              </div>

              <!-- Thumbnails -->
              <div class="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                <button
                  v-for="(m, idx) in mediaItems"
                  :key="idx"
                  @click="m.type === 'video' ? (activeTab = 'video') : (selectedImage = m.src)"
                  class="relative w-20 h-20 rounded-2xl overflow-hidden border-2 bg-white flex-shrink-0 transition-all duration-300"
                  :class="(m.type === 'video' && activeTab === 'video') || (m.type === 'image' && selectedImage === m.src) ? 'border-stone-900 scale-95' : 'border-transparent hover:border-stone-200'"
                >
                  <img :src="m.thumb" class="w-full h-full object-cover" />
                  <div v-if="m.type === 'video'" class="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Play class="w-6 h-6 text-white fill-white" />
                  </div>
                </button>
              </div>
            </div>
          </div>

          <!-- 2. PRODUCT INFO (Center Column - 4 cols) -->
          <div class="lg:col-span-4">
            <div class="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-stone-100 h-full">
              <!-- Header -->
              <div class="flex items-center justify-between mb-4">
                <span class="text-accent font-bold text-xs bg-accent/10 px-3 py-1 rounded-full">{{ product.category }}</span>
                <div class="flex items-center gap-1 text-yellow-400">
                  <Star class="w-4 h-4 fill-current" />
                  <span class="text-stone-700 text-sm font-bold">۴.۸</span>
                </div>
              </div>

              <h1 class="text-2xl md:text-3xl font-black text-stone-900 leading-tight mb-6">{{ product.title }}</h1>

              <!-- Price & Stock -->
              <div class="flex items-end gap-2 mb-8">
                <span class="text-4xl font-black text-stone-900">{{ formattedPrice }}</span>
                <span class="text-stone-500 text-lg mb-1">تومان</span>
              </div>

              <!-- Actions -->
              <div class="space-y-4 mb-8">
                <!-- Quantity & Add -->
                <div class="flex gap-3">
                  <div class="flex items-center bg-stone-50 rounded-2xl border border-stone-200 h-14 px-2 w-32">
                    <button @click="incrementQty" :disabled="!canIncrement" class="w-full h-full flex items-center justify-center text-stone-600 hover:text-stone-900 disabled:opacity-30"><Plus class="w-5 h-5" /></button>
                    <span class="font-black text-lg text-stone-900">{{ quantity }}</span>
                    <button @click="decrementQty" :disabled="!canDecrement" class="w-full h-full flex items-center justify-center text-stone-600 hover:text-stone-900 disabled:opacity-30"><Minus class="w-5 h-5" /></button>
                  </div>
                  
                  <button 
                    @click="addToCart" 
                    :disabled="!inStock"
                    class="flex-1 bg-stone-900 text-white h-14 rounded-2xl font-bold text-lg hover:bg-stone-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-stone-900/20 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart class="w-5 h-5" />
                    {{ inStock ? 'افزودن به سبد خرید' : 'ناموجود' }}
                  </button>
                </div>

                <!-- Wishlist & Share -->
                <div class="flex gap-3">
                  <button class="flex-1 py-3 rounded-xl border border-stone-200 text-stone-600 font-bold text-sm hover:bg-stone-50 transition flex items-center justify-center gap-2">
                    <Heart class="w-4 h-4" /> افزودن به علاقه‌مندی
                  </button>
                  <button @click="shareProduct" class="flex-1 py-3 rounded-xl border border-stone-200 text-stone-600 font-bold text-sm hover:bg-stone-50 transition flex items-center justify-center gap-2">
                    <Share2 class="w-4 h-4" /> اشتراک‌گذاری
                  </button>
                </div>
              </div>

              <!-- Features -->
              <div class="grid grid-cols-3 gap-2 py-6 border-t border-stone-100">
                <div class="flex flex-col items-center text-center gap-2">
                  <div class="w-10 h-10 bg-stone-50 rounded-full flex items-center justify-center text-stone-600"><ShieldCheck class="w-5 h-5" /></div>
                  <span class="text-[10px] font-bold text-stone-600">ضمانت اصالت</span>
                </div>
                <div class="flex flex-col items-center text-center gap-2">
                  <div class="w-10 h-10 bg-stone-50 rounded-full flex items-center justify-center text-stone-600"><Truck class="w-5 h-5" /></div>
                  <span class="text-[10px] font-bold text-stone-600">ارسال سریع</span>
                </div>
                <div class="flex flex-col items-center text-center gap-2">
                  <div class="w-10 h-10 bg-stone-50 rounded-full flex items-center justify-center text-stone-600"><Headphones class="w-5 h-5" /></div>
                  <span class="text-[10px] font-bold text-stone-600">پشتیبانی</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 3. SIDEBAR (Left Column - 3 cols) -->
          <div class="lg:col-span-3 space-y-6">
            
            <!-- Consultation Box -->
            <div class="bg-stone-900 rounded-3xl p-6 text-center text-white relative overflow-hidden group">
              <div class="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-white/10 transition"></div>
              
              <div class="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <Headphones class="w-7 h-7" />
              </div>
              
              <h3 class="font-bold text-lg mb-2">نیاز به مشاوره دارید؟</h3>
              <p class="text-stone-400 text-xs mb-6 leading-relaxed">کارشناسان ما آماده پاسخگویی به سوالات شما درباره این محصول هستند.</p>
              
              <button class="w-full bg-white text-stone-900 py-3 rounded-xl font-bold text-sm hover:bg-stone-200 transition flex items-center justify-center gap-2">
                <Phone class="w-4 h-4" />
                تماس با پشتیبانی
              </button>
            </div>

            <!-- Related Products (Sidebar Style) -->
            <div v-if="relatedProducts.length > 0" class="bg-white rounded-3xl p-5 border border-stone-100 shadow-sm">
              <div class="flex items-center gap-2 mb-4">
                <div class="w-1 h-5 bg-accent rounded-full"></div>
                <h3 class="font-bold text-stone-800">محصولات مشابه</h3>
              </div>
              
              <div class="space-y-4">
                <div 
                  v-for="rel in relatedProducts.slice(0, 3)" 
                  :key="rel.id" 
                  @click="goToRelated(rel)"
                  class="flex gap-3 group cursor-pointer hover:bg-stone-50 p-2 rounded-xl transition"
                >
                  <div class="w-16 h-16 rounded-xl bg-stone-100 overflow-hidden shrink-0 border border-stone-100">
                    <img :src="rel.image || ''" class="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                  </div>
                  <div class="flex flex-col justify-center">
                    <h4 class="text-xs font-bold text-stone-800 line-clamp-2 mb-1 group-hover:text-accent transition">{{ rel.title }}</h4>
                    <span class="text-xs text-stone-500">{{ rel.price.toLocaleString() }} تومان</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- TABS SECTION (Description & Comments) -->
        <div class="bg-white rounded-[40px] shadow-sm border border-stone-100 overflow-hidden mb-12">
          <!-- Tab Headers -->
          <div class="flex border-b border-stone-100 bg-stone-50/50 px-4 md:px-8 pt-4">
            <button 
              @click="activeTab = 'desc'"
              class="px-6 md:px-10 py-4 font-bold text-sm md:text-base transition relative"
              :class="activeTab === 'desc' ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600'"
            >
              توضیحات و جزئیات
              <div v-if="activeTab === 'desc'" class="absolute bottom-0 left-0 right-0 h-1 bg-stone-900 rounded-t-full"></div>
            </button>
            <button 
              @click="activeTab = 'comments'"
              class="px-6 md:px-10 py-4 font-bold text-sm md:text-base transition relative"
              :class="activeTab === 'comments' ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600'"
            >
              نظرات کاربران
              <div v-if="activeTab === 'comments'" class="absolute bottom-0 left-0 right-0 h-1 bg-stone-900 rounded-t-full"></div>
            </button>
          </div>

          <!-- Tab Content -->
          <div class="p-6 md:p-12 min-h-[300px]">
            <div v-if="activeTab === 'desc'" class="animate-fade-in">
              <div class="prose prose-stone prose-lg max-w-none leading-loose text-justify text-stone-600">
                {{ fullDescription }}
              </div>
            </div>
            
            <div v-else class="animate-fade-in">
              <ProductComments :productId="product.id" />
            </div>
          </div>
        </div>

      </div>

      <!-- Empty State -->
      <div v-else class="py-24 text-center text-stone-500">
        محصولی برای نمایش وجود ندارد.
      </div>

      <!-- Lightbox -->
      <div v-if="lightboxOpen" class="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center" @click.self="closeLightbox">
        <button @click="closeLightbox" class="absolute top-6 right-6 text-white/50 hover:text-white transition"><X class="w-8 h-8" /></button>
        <div class="w-full max-w-5xl px-4">
          <img :src="mediaItems[lightboxIndex]?.src" class="max-h-[85vh] mx-auto rounded-lg shadow-2xl" />
          <div class="flex justify-center gap-4 mt-6">
            <button @click="prevLightbox" class="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition"><ChevronLeft class="w-6 h-6 rotate-180" /></button>
            <button @click="nextLightbox" class="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition"><ChevronLeft class="w-6 h-6" /></button>
          </div>
        </div>
      </div>

      <!-- Mobile Sticky Bar -->
      <div class="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-stone-200 p-3 px-4 flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div>
          <div class="text-[10px] text-stone-400">قیمت نهایی</div>
          <div class="font-black text-lg text-stone-900">{{ formattedPrice }} <span class="text-xs font-normal text-stone-500">تومان</span></div>
        </div>
        <button @click="addToCart" :disabled="!inStock" class="bg-stone-900 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-stone-900/20 disabled:opacity-50">
          {{ inStock ? 'افزودن' : 'ناموجود' }}
        </button>
      </div>

    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>