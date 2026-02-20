<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useCartStore } from '@/stores/cart'
import { useSettingsStore } from '@/stores/settings'
import { useWishlistStore } from '@/stores/wishlist' // اضافه شد
import { useToastStore } from '@/stores/toast' // اضافه شد
import {
  ShoppingCart,
  ArrowRight,
  Truck,
  ShieldCheck,
  Heart,
  Share2,
  Minus,
  Plus,
  ChevronLeft,
  X,
  Play,
  Phone,
  Info
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
  min_order: number | null
  max_order: number | null
}

type RelatedProduct = Pick<Product, 'id' | 'slug' | 'title' | 'price' | 'image' | 'category'>

type MediaItem =
  | { type: 'image'; src: string; thumb: string }
  | { type: 'video'; src: string; thumb: string }

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const settingsStore = useSettingsStore()
const wishlistStore = useWishlistStore() // اضافه شد
const toastStore = useToastStore() // اضافه شد

const product = ref<Product | null>(null)
const relatedProducts = ref<RelatedProduct[]>([])
const loading = ref(false)

const selectedImage = ref('')
const quantity = ref(1)

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

const minQty = computed(() => product.value?.min_order ?? 1)
const maxQty = computed(() => {
  const s = inStock.value ? stock.value : 1
  const m = product.value?.max_order ?? 999999
  return Math.min(s, m)
})

const canIncrement = computed(() => inStock.value && quantity.value < maxQty.value)
const canDecrement = computed(() => quantity.value > minQty.value)

function clampQty() {
  if (quantity.value < minQty.value) quantity.value = minQty.value
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

  // Video
  if (p.video) {
    const poster = p.image || imageList.value[0] || ''
    items.unshift({ type: 'video', src: p.video, thumb: poster })
  }

  return items
})

const currentSelectedMediaIndex = computed(() => {
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
    .select('id, slug, title, description, category, is_featured, price, image, gallery, video, stock, min_order, max_order')

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
    quantity.value = data.min_order ?? 1
    clampQty()

    // pick initial media
    const imgs = imageList.value
    selectedImage.value = imgs.includes(selectedImage.value) ? selectedImage.value : (imgs[0] ?? '')

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
  // ارسال تعداد دقیق به استور
  cartStore.addItem(product.value, quantity.value)
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

// عملکرد اشتراک‌گذاری اصلاح شده
async function shareProduct() {
  const p = product.value
  if (!p) return
  const url = window.location.href
  const title = p.title
  const text = shortDescription.value

  if (navigator.share) {
    try {
      await navigator.share({ title, text, url })
      return
    } catch {
      // ignore
    }
  }

  try {
    await navigator.clipboard.writeText(url)
    toastStore.showToast('لینک محصول کپی شد', 'success')
  } catch {
    prompt('لینک را کپی کنید:', url)
  }
}

// عملکرد علاقه‌مندی
function toggleWishlist() {
  if (product.value) {
    wishlistStore.toggleWishlist(product.value.id)
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
  if (e.key === 'ArrowRight') prevLightbox()
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
  <div class="bg-white min-h-screen pt-24 pb-20 font-sans text-stone-800">
    <div class="container mx-auto px-4 md:px-8 max-w-[1280px]">
      
      <!-- Breadcrumbs -->
      <nav v-if="product" class="flex items-center gap-2 text-xs text-stone-400 mb-8 overflow-x-auto whitespace-nowrap pb-2">
        <router-link to="/" class="hover:text-stone-900 transition-colors">خانه</router-link>
        <span class="text-stone-300">/</span>
        <router-link to="/products" class="hover:text-stone-900 transition-colors">فروشگاه</router-link>
        <span class="text-stone-300">/</span>
        <span class="text-stone-500">{{ product.category }}</span>
        <span class="text-stone-300">/</span>
        <span class="text-stone-900 font-medium truncate">{{ product.title }}</span>
      </nav>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-32">
        <div class="flex flex-col items-center gap-4">
          <div class="w-10 h-10 border-2 border-stone-100 border-t-stone-800 rounded-full animate-spin"></div>
        </div>
      </div>

      <div v-else-if="product" class="animate-fade-in">
        
        <!-- 2-Column Layout (Gallery + Info) -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 mb-20">
          
          <!-- 1. GALLERY (Right Column) -->
          <div class="space-y-6">
            <div class="sticky top-28">
              <!-- Main Image -->
              <div class="aspect-[4/5] rounded-xl overflow-hidden bg-stone-50 relative group cursor-zoom-in" @click="openLightbox()">
                <img
                  v-if="selectedImage"
                  :src="selectedImage"
                  :alt="product.title"
                  class="w-full h-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div v-else class="w-full h-full bg-stone-100 flex items-center justify-center">
                   <span class="text-stone-400 text-sm">تصویری موجود نیست</span>
                </div>

                <div v-if="product.is_featured" class="absolute top-4 right-4 bg-white/90 backdrop-blur text-stone-900 text-[10px] font-bold px-3 py-1 rounded-full tracking-wide z-20 shadow-sm">
                  ویژه
                </div>
              </div>

              <!-- Thumbnails -->
              <div class="flex gap-4 overflow-x-auto pt-4 pb-2 scrollbar-hide">
                <button
                  v-for="(m, idx) in mediaItems"
                  :key="idx"
                  @click="m.type === 'video' ? openLightbox(idx) : (selectedImage = m.src)"
                  class="relative w-20 h-20 rounded-lg overflow-hidden border transition-all duration-300 flex-shrink-0"
                  :class="(m.type === 'image' && selectedImage === m.src) ? 'border-stone-900 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'"
                >
                  <img :src="m.thumb" class="w-full h-full object-cover" />
                  <div v-if="m.type === 'video'" class="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <Play class="w-6 h-6 text-white fill-white" />
                  </div>
                </button>
              </div>
            </div>
          </div>

          <!-- 2. PRODUCT INFO (Left Column) -->
          <div class="flex flex-col h-full">
            
            <div class="mb-auto">
              <div class="flex items-center gap-3 mb-4">
                <span class="text-stone-500 text-xs font-medium tracking-wider uppercase">{{ product.category }}</span>
                <span v-if="!inStock" class="text-red-500 text-xs font-bold bg-red-50 px-2 py-0.5 rounded">ناموجود</span>
              </div>

              <!-- اصلاح فونت: حذف font-serif -->
              <h1 class="text-3xl md:text-4xl font-black text-stone-900 leading-tight mb-6">{{ product.title }}</h1>

              <div class="flex items-baseline gap-2 mb-8 border-b border-stone-100 pb-8">
                <span class="text-3xl font-medium text-stone-900">{{ formattedPrice }}</span>
                <span class="text-stone-500 text-sm">تومان</span>
              </div>

              <div class="prose prose-stone prose-sm max-w-none text-stone-600 leading-loose mb-8 text-justify">
                {{ fullDescription }}
              </div>

              <!-- Actions -->
              <div class="space-y-6">
                <!-- Add to Cart Row -->
                <div class="flex flex-col sm:flex-row gap-4">
                  <!-- Quantity -->
                  <div class="flex items-center bg-stone-50 rounded-lg h-12 px-2 w-full sm:w-32 border border-stone-200">
                    <button @click="incrementQty" :disabled="!canIncrement" class="w-10 h-full flex items-center justify-center text-stone-600 hover:text-stone-900 disabled:opacity-30 transition"><Plus class="w-4 h-4" /></button>
                    <span class="flex-1 text-center font-medium text-stone-900">{{ quantity }}</span>
                    <button @click="decrementQty" :disabled="!canDecrement" class="w-10 h-full flex items-center justify-center text-stone-600 hover:text-stone-900 disabled:opacity-30 transition"><Minus class="w-4 h-4" /></button>
                  </div>
                  
                  <!-- Buy Button -->
                  <button 
                    @click="addToCart" 
                    :disabled="!inStock"
                    class="flex-1 bg-stone-900 text-white h-12 rounded-lg font-medium text-sm hover:bg-stone-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-stone-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    <ShoppingCart class="w-4 h-4" />
                    {{ inStock ? 'افزودن به سبد خرید' : 'موجود شد خبرم کن' }}
                  </button>
                </div>

                <!-- Secondary Actions & Consultation -->
                <div class="flex flex-wrap items-center justify-between gap-4 pt-4">
                   <div class="flex gap-4">
                      <!-- دکمه علاقه‌مندی فعال شده -->
                      <button 
                        @click="toggleWishlist" 
                        class="text-xs font-medium flex items-center gap-1.5 transition"
                        :class="wishlistStore.isInWishlist(product.id) ? 'text-red-500 hover:text-red-600' : 'text-stone-500 hover:text-stone-900'"
                      >
                        <Heart class="w-4 h-4" :class="wishlistStore.isInWishlist(product.id) ? 'fill-red-500' : ''" /> 
                        {{ wishlistStore.isInWishlist(product.id) ? 'حذف از علاقه‌مندی' : 'علاقه‌مندی' }}
                      </button>
                      
                      <!-- دکمه اشتراک‌گذاری فعال شده -->
                      <button @click="shareProduct" class="text-stone-500 hover:text-stone-900 text-xs font-medium flex items-center gap-1.5 transition">
                        <Share2 class="w-4 h-4" /> اشتراک‌گذاری
                      </button>
                   </div>
                   
                   <!-- Consultation Link (Functional) -->
                   <a href="tel:02188776655" class="text-stone-800 hover:text-accent text-xs font-bold flex items-center gap-2 transition border-b border-stone-200 pb-0.5 hover:border-accent">
                      <Phone class="w-3.5 h-3.5" />
                      نیاز به مشاوره دارید؟ تماس بگیرید
                   </a>
                </div>
              </div>
            </div>

            <!-- Features (Minimal) -->
            <div class="grid grid-cols-3 gap-4 py-8 mt-8 border-t border-stone-100">
              <div class="flex flex-col gap-2">
                <ShieldCheck class="w-5 h-5 text-stone-400" />
                <span class="text-xs text-stone-500">ضمانت اصالت کالا</span>
              </div>
              <div class="flex flex-col gap-2">
                <Truck class="w-5 h-5 text-stone-400" />
                <span class="text-xs text-stone-500">ارسال ایمن و سریع</span>
              </div>
              <div class="flex flex-col gap-2">
                <Info class="w-5 h-5 text-stone-400" />
                <span class="text-xs text-stone-500">دست‌ساز و طبیعی</span>
              </div>
            </div>

          </div>
        </div>

        <!-- COMMENTS SECTION -->
        <div class="border-t border-stone-100 pt-16 max-w-4xl mx-auto">
          <h3 class="text-xl font-bold text-stone-900 mb-8 text-center">نظرات خریداران</h3>
          <ProductComments :productId="product.id" />
        </div>

      </div>

      <!-- Empty State -->
      <div v-else class="py-24 text-center text-stone-500">
        محصولی یافت نشد.
      </div>

      <!-- Lightbox -->
      <div v-if="lightboxOpen" class="fixed inset-0 z-[60] bg-white/95 backdrop-blur-sm flex items-center justify-center" @click.self="closeLightbox">
        <button @click="closeLightbox" class="absolute top-6 right-6 text-stone-500 hover:text-stone-900 transition"><X class="w-8 h-8" /></button>
        <div class="w-full max-w-5xl px-4 h-full flex items-center justify-center">
          <img v-if="mediaItems[lightboxIndex]?.type === 'image'" :src="mediaItems[lightboxIndex]?.src" class="max-h-[85vh] max-w-full object-contain shadow-2xl" />
          <video v-else controls autoplay class="max-h-[85vh] max-w-full shadow-2xl">
             <source :src="mediaItems[lightboxIndex]?.src" type="video/mp4" />
          </video>
          
          <div class="absolute bottom-8 left-0 right-0 flex justify-center gap-4">
            <button @click="prevLightbox" class="p-3 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 transition"><ChevronLeft class="w-6 h-6 rotate-180" /></button>
            <button @click="nextLightbox" class="p-3 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 transition"><ChevronLeft class="w-6 h-6" /></button>
          </div>
        </div>
      </div>

      <!-- Mobile Sticky Bar -->
      <div class="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-stone-100 p-3 px-4 flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div>
          <div class="font-bold text-lg text-stone-900">{{ formattedPrice }} <span class="text-xs font-normal text-stone-500">تومان</span></div>
        </div>
        <button @click="addToCart" :disabled="!inStock" class="bg-stone-900 text-white px-8 py-3 rounded-lg font-medium text-sm shadow-lg shadow-stone-200 disabled:opacity-50">
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