<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useToastStore } from '@/stores/toast'
import { useCategoryStore } from '@/stores/category'
import { useCurrencyStore } from '@/stores/currency'
import { Upload, X, Loader2, Image as ImageIcon, Video, ArrowRight, Plus, Calculator, Link } from 'lucide-vue-next'

type PricingMethod = 'fixed' | 'usd' | 'gold' | 'eur'

type ProductForm = {
  title: string
  slug: string
  price: string // تومان (برای input)
  category: string
  description: string
  is_featured: boolean
  min_order: number
  max_order: number | null
  image: string
  gallery: string[] // فقط URL های موجود (دیتابیس)
  video: string
  pricing_method: PricingMethod
  base_price: number
}

const route = useRoute()
const router = useRouter()
const toastStore = useToastStore()
const categoryStore = useCategoryStore()
const currencyStore = useCurrencyStore()

const loading = ref(false)
const submitting = ref(false)

const isEditing = computed(() => Boolean(route.params.id))
const editingId = computed<number | null>(() => {
  const raw = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
})

// Form (reactive => بدون جایگزینی کل آبجکت)
const form = reactive<ProductForm>({
  title: '',
  slug: '',
  price: '',
  category: '',
  description: '',
  is_featured: false,
  min_order: 1,
  max_order: null,
  image: '',
  gallery: [],
  video: '',
  pricing_method: 'fixed',
  base_price: 0,
})

/* ----------------------- v-model helper for null ---------------------- */
const maxOrderInput = computed<string | number>({
  get: () => (form.max_order ?? '') as any,
  set: (v) => {
    if (v === '' || v === null || v === undefined) {
      form.max_order = null
      return
    }
    const n = Number(v)
    form.max_order = Number.isFinite(n) && n > 0 ? n : null
  },
})

/* ------------------------ ObjectURL (memory leak) ---------------------- */
const blobUrls = new Set<string>()
function makeBlobUrl(file: File) {
  const url = URL.createObjectURL(file)
  blobUrls.add(url)
  return url
}
function revokeIfBlobUrl(url: string | null | undefined) {
  if (!url) return
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
    blobUrls.delete(url)
  }
}
onUnmounted(() => {
  blobUrls.forEach((u) => URL.revokeObjectURL(u))
  blobUrls.clear()
})

/* ------------------------------ Upload state --------------------------- */
const mainImageFile = ref<File | null>(null)
const mainImagePreview = ref<string | null>(null)

const galleryFiles = ref<File[]>([]) // فایل‌های جدید
const newGalleryPreviews = ref<string[]>([]) // preview های blob برای فایل‌های جدید
const galleryPreviews = computed(() => [...form.gallery, ...newGalleryPreviews.value])

const videoFile = ref<File | null>(null)
const videoPreview = ref<string | null>(null)

/* ---------------------------- Category modal --------------------------- */
const showCategoryModal = ref(false)
const creatingCategory = ref(false)
const newCategoryForm = reactive({ title: '' })
const newCategoryFile = ref<File | null>(null)
const newCategoryPreview = ref<string | null>(null)

/* ------------------------------ Pricing -------------------------------- */
const displayedRate = computed(() => currencyStore.getRate(form.pricing_method) ?? 0)

// با watchEffect نرخ‌ها هم اگر بعداً لود شوند، قیمت دوباره محاسبه می‌شود
watchEffect(() => {
  if (form.pricing_method === 'fixed') return
  if (form.base_price <= 0) return
  const rate = displayedRate.value
  if (!rate) return
  form.price = String(Math.round(form.base_price * rate))
})

/* -------------------------------- Slug -------------------------------- */
function generateSlug() {
  if (!form.title) return
  form.slug = form.title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\u0600-\u06FF-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/* ---------------------------- Fetch product ---------------------------- */
async function fetchProduct(id: number) {
  loading.value = true
  try {
    const { data, error } = await supabase.from('products').select('*').eq('id', id).single()
    if (error) throw error
    if (!data) throw new Error('Product not found')

    // reset upload state + revoke blobs
    revokeIfBlobUrl(mainImagePreview.value)
    revokeIfBlobUrl(videoPreview.value)
    newGalleryPreviews.value.forEach(revokeIfBlobUrl)

    mainImageFile.value = null
    videoFile.value = null
    galleryFiles.value = []
    newGalleryPreviews.value = []
    videoPreview.value = null

    Object.assign(form, {
      title: data.title ?? '',
      slug: data.slug ?? '',
      price: String(data.price ?? ''),
      category: data.category ?? '',
      description: data.description ?? '',
      is_featured: Boolean(data.is_featured),
      min_order: data.min_order ?? 1,
      max_order: data.max_order ?? null,
      image: data.image ?? '',
      gallery: Array.isArray(data.gallery) ? data.gallery : [],
      video: data.video ?? '',
      pricing_method: (data.pricing_method ?? 'fixed') as PricingMethod,
      base_price: Number(data.base_price ?? 0),
    } satisfies ProductForm)

    mainImagePreview.value = form.image || null
  } catch (e) {
    console.error(e)
    toastStore.showToast('خطا در دریافت محصول', 'error')
    router.replace({ name: 'admin-products' })
  } finally {
    loading.value = false
  }
}

/* --------------------------- File handlers ----------------------------- */
function handleMainImage(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  mainImageFile.value = file
  revokeIfBlobUrl(mainImagePreview.value)
  mainImagePreview.value = makeBlobUrl(file)

  target.value = ''
}

function handleGallery(event: Event) {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files ?? [])
  if (!files.length) return

  for (const file of files) {
    galleryFiles.value.push(file)
    newGalleryPreviews.value.push(makeBlobUrl(file))
  }

  target.value = ''
}

function removeGalleryItem(index: number) {
  const existingCount = form.gallery.length

  if (index < existingCount) {
    // حذف از URL های دیتابیس
    form.gallery.splice(index, 1)
    return
  }

  // حذف از فایل‌های جدید
  const newIndex = index - existingCount
  const preview = newGalleryPreviews.value[newIndex]
  revokeIfBlobUrl(preview)

  newGalleryPreviews.value.splice(newIndex, 1)
  galleryFiles.value.splice(newIndex, 1)
}

function handleVideo(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  videoFile.value = file
  revokeIfBlobUrl(videoPreview.value)
  videoPreview.value = makeBlobUrl(file)

  target.value = ''
}

function handleNewCategoryImage(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  newCategoryFile.value = file
  revokeIfBlobUrl(newCategoryPreview.value)
  newCategoryPreview.value = makeBlobUrl(file)

  target.value = ''
}

/* ------------------------------ Upload -------------------------------- */
function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9.]/g, '')
}

async function uploadFile(file: File, folder = 'products') {
  const safe = sanitizeFileName(file.name)
  const path = `${folder}/${Date.now()}_${Math.random().toString(16).slice(2)}_${safe}`
  const { error } = await supabase.storage.from('products').upload(path, file)
  if (error) throw error
  const { data } = supabase.storage.from('products').getPublicUrl(path)
  return data.publicUrl
}

/* -------------------------- Create category --------------------------- */
async function saveNewCategory() {
  if (!newCategoryForm.title.trim()) {
    toastStore.showToast('عنوان دسته‌بندی الزامی است', 'warning')
    return
  }

  creatingCategory.value = true
  try {
    let imageUrl = ''
    if (newCategoryFile.value) {
      imageUrl = await uploadFile(newCategoryFile.value, 'categories')
    }

    const err = await categoryStore.addCategory({
      title: newCategoryForm.title.trim(),
      image: imageUrl,
    })

    if (err) throw err

    toastStore.showToast('دسته‌بندی جدید اضافه شد', 'success')
    form.category = newCategoryForm.title.trim()

    newCategoryForm.title = ''
    newCategoryFile.value = null
    revokeIfBlobUrl(newCategoryPreview.value)
    newCategoryPreview.value = null
    showCategoryModal.value = false
  } catch (e: any) {
    toastStore.showToast('خطا: ' + (e?.message ?? 'نامشخص'), 'error')
  } finally {
    creatingCategory.value = false
  }
}

/* -------------------------------- Save -------------------------------- */
async function saveProduct() {
  if (!form.title.trim() || !String(form.price).trim() || !form.category.trim()) {
    toastStore.showToast('لطفا فیلدهای اجباری را پر کنید', 'warning')
    return
  }

  if (!form.slug.trim()) generateSlug()

  const finalPrice = Number.parseInt(String(form.price), 10)
  if (!Number.isFinite(finalPrice) || finalPrice <= 0) {
    toastStore.showToast('قیمت نهایی معتبر نیست', 'warning')
    return
  }

  submitting.value = true
  try {
    let mainImageUrl = form.image
    if (mainImageFile.value) mainImageUrl = await uploadFile(mainImageFile.value, 'products')

    const uploadedGallery = await Promise.all(
      galleryFiles.value.map((f) => uploadFile(f, 'products/gallery')),
    )
    const finalGallery = [...form.gallery, ...uploadedGallery]

    let videoUrl = form.video
    if (videoFile.value) videoUrl = await uploadFile(videoFile.value, 'products/video')

    const productData = {
      title: form.title.trim(),
      slug: form.slug.trim() || null,
      price: finalPrice,
      category: form.category.trim(),
      description: form.description,
      is_featured: form.is_featured,
      min_order: Math.max(1, Number(form.min_order) || 1),
      max_order: form.max_order,
      image: mainImageUrl,
      gallery: finalGallery,
      video: videoUrl,
      pricing_method: form.pricing_method,
      base_price: Number(form.base_price) || 0,
    }

    if (isEditing.value) {
      if (!editingId.value) throw new Error('Invalid product id')
      const { error } = await supabase.from('products').update(productData).eq('id', editingId.value)
      if (error) throw error
      toastStore.showToast('محصول با موفقیت ویرایش شد', 'success')
    } else {
      const { error } = await supabase.from('products').insert([productData])
      if (error) throw error
      toastStore.showToast('محصول جدید ایجاد شد', 'success')
    }

    router.push({ name: 'admin-products' })
  } catch (e: any) {
    console.error(e)
    if (e?.code === '23505') {
      toastStore.showToast('این نامک (Slug) قبلاً استفاده شده است. لطفاً تغییر دهید.', 'error')
    } else {
      toastStore.showToast('خطا: ' + (e?.message ?? 'نامشخص'), 'error')
    }
  } finally {
    submitting.value = false
  }
}

/* -------------------------------- Init -------------------------------- */
onMounted(async () => {
  await Promise.all([categoryStore.fetchCategories(), currencyStore.fetchRates()])
  if (editingId.value) await fetchProduct(editingId.value)
})

watch(editingId, async (id, prev) => {
  if (id && id !== prev) await fetchProduct(id)
})
</script>

<template>
  <div class="animate-fade-in pb-12">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-4">
        <button @click="router.back()" class="p-2 hover:bg-white rounded-xl transition text-stone-500">
          <ArrowRight class="w-5 h-5" />
        </button>
        <h2 class="text-2xl font-bold text-stone-800">{{ isEditing ? 'ویرایش محصول' : 'افزودن محصول جدید' }}</h2>
      </div>
      <div class="flex gap-3">
        <button @click="router.back()" class="px-6 py-2.5 rounded-xl border border-stone-300 text-stone-600 font-bold hover:bg-stone-50 transition">
          انصراف
        </button>
        <button @click="saveProduct" :disabled="submitting" class="px-8 py-2.5 rounded-xl bg-stone-900 text-white font-bold hover:bg-accent transition flex items-center gap-2 disabled:opacity-70">
          <Loader2 v-if="submitting" class="w-5 h-5 animate-spin" />
          <span v-else>ذخیره محصول</span>
        </button>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <Loader2 class="w-10 h-10 animate-spin text-stone-400" />
    </div>

    <div v-else class="grid lg:grid-cols-3 gap-8">
      <!-- Left Column: Inputs -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Basic Info -->
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
          <h3 class="font-bold text-lg mb-6 border-b border-stone-50 pb-4">اطلاعات پایه</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-bold text-stone-700 mb-2">نام محصول <span class="text-red-500">*</span></label>
              <input
                v-model="form.title"
                type="text"
                class="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-stone-900 outline-none transition"
                placeholder="مثلا: سبد حصیری مدل آوا"
                @input="!isEditing && !form.slug ? generateSlug() : null"
              />
            </div>

            <!-- Slug Field -->
            <div>
              <label class="block text-sm font-bold text-stone-700 mb-2 flex items-center justify-between">
                <span>نامک (Slug) - برای آدرس‌دهی سئو</span>
                <button @click="generateSlug" type="button" class="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                  <Link class="w-3 h-3" /> تولید خودکار
                </button>
              </label>
              <div class="relative">
                <input v-model="form.slug" type="text" class="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-stone-900 outline-none transition dir-ltr text-left font-mono text-sm" placeholder="my-product-slug" />
              </div>
              <p class="text-xs text-stone-400 mt-1 dir-ltr text-left">example.com/products/{{ form.slug || '...' }}</p>
            </div>

            <!-- Pricing Section -->
            <div class="bg-stone-50 p-4 rounded-xl border border-stone-200">
              <label class="block text-sm font-bold text-stone-700 mb-3">روش قیمت‌گذاری</label>
              <div class="flex gap-2 mb-4">
                <button
                  type="button"
                  @click="form.pricing_method = 'fixed'"
                  class="flex-1 py-2 rounded-lg text-sm font-bold border transition"
                  :class="form.pricing_method === 'fixed' ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-600 border-stone-200'"
                >
                  قیمت ثابت (تومان)
                </button>
                <button
                  type="button"
                  @click="form.pricing_method = 'usd'"
                  class="flex-1 py-2 rounded-lg text-sm font-bold border transition"
                  :class="form.pricing_method === 'usd' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-stone-600 border-stone-200'"
                >
                  دلاری
                </button>
                <button
                  type="button"
                  @click="form.pricing_method = 'gold'"
                  class="flex-1 py-2 rounded-lg text-sm font-bold border transition"
                  :class="form.pricing_method === 'gold' ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-white text-stone-600 border-stone-200'"
                >
                  طلا (گرمی)
                </button>
              </div>

              <div class="grid md:grid-cols-2 gap-4">
                <div v-if="form.pricing_method !== 'fixed'">
                  <label class="block text-sm font-bold text-stone-700 mb-2">
                    {{ form.pricing_method === 'usd' ? 'قیمت ارزی (دلار)' : 'وزن طلا (گرم)' }}
                  </label>
                  <input
                    v-model.number="form.base_price"
                    type="number"
                    step="0.01"
                    class="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-stone-900 outline-none transition bg-white"
                  />
                </div>

                <div>
                  <label class="block text-sm font-bold text-stone-700 mb-2">قیمت نهایی (تومان) <span class="text-red-500">*</span></label>
                  <div class="relative">
                    <input
                      v-model="form.price"
                      type="number"
                      class="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-stone-900 outline-none transition"
                      :class="form.pricing_method !== 'fixed' ? 'bg-gray-100 text-gray-500' : 'bg-white'"
                      :readonly="form.pricing_method !== 'fixed'"
                    />
                    <Calculator v-if="form.pricing_method !== 'fixed'" class="absolute left-3 top-3.5 w-5 h-5 text-stone-400" />
                  </div>
                  <p v-if="form.pricing_method !== 'fixed'" class="text-xs text-stone-500 mt-1">
                    محاسبه شده با نرخ: {{ displayedRate.toLocaleString() }} تومان
                  </p>
                </div>
              </div>
            </div>

            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-bold text-stone-700 mb-2">دسته‌بندی <span class="text-red-500">*</span></label>
                <div class="flex gap-2">
                  <select v-model="form.category" class="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-stone-900 outline-none bg-white transition">
                    <option value="" disabled>انتخاب کنید</option>
                    <option v-for="cat in categoryStore.categories" :key="cat.id" :value="cat.title">{{ cat.title }}</option>
                  </select>
                  <button
                    type="button"
                    @click="showCategoryModal = true"
                    class="bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 rounded-xl transition flex items-center justify-center border border-stone-200"
                    title="افزودن دسته‌بندی جدید"
                  >
                    <Plus class="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-bold text-stone-700 mb-2">توضیحات کامل</label>
              <textarea v-model="form.description" rows="6" class="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-stone-900 outline-none transition" placeholder="توضیحات محصول را اینجا بنویسید..."></textarea>
            </div>
          </div>
        </div>

        <!-- Media Gallery -->
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
          <h3 class="font-bold text-lg mb-6 border-b border-stone-50 pb-4 flex items-center gap-2">
            <ImageIcon class="w-5 h-5" />
            آلبوم تصاویر
          </h3>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div v-for="(src, index) in galleryPreviews" :key="src + index" class="relative aspect-square rounded-xl overflow-hidden border border-stone-200 group">
              <img :src="src" class="w-full h-full object-cover" />
              <button type="button" @click="removeGalleryItem(index)" class="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition">
                <X class="w-4 h-4" />
              </button>
            </div>

            <label class="aspect-square rounded-xl border-2 border-dashed border-stone-300 hover:bg-stone-50 transition flex flex-col items-center justify-center cursor-pointer text-stone-400 hover:text-stone-600">
              <input type="file" multiple accept="image/*" @change="handleGallery" class="hidden" />
              <Plus class="w-8 h-8 mb-2" />
              <span class="text-xs font-bold">افزودن تصویر</span>
            </label>
          </div>
        </div>

        <!-- Video -->
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
          <h3 class="font-bold text-lg mb-6 border-b border-stone-50 pb-4 flex items-center gap-2">
            <Video class="w-5 h-5" />
            ویدیو محصول
          </h3>

          <div class="border-2 border-dashed border-stone-300 rounded-xl p-6 text-center hover:bg-stone-50 transition relative">
            <input type="file" accept="video/*" @change="handleVideo" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
            <div v-if="videoPreview || form.video" class="text-green-600 font-bold flex items-center justify-center gap-2">
              <Video class="w-6 h-6" />
              ویدیو انتخاب شده است (برای تغییر کلیک کنید)
            </div>
            <div v-else class="flex flex-col items-center gap-2 text-stone-400">
              <Upload class="w-8 h-8" />
              <span class="text-sm">آپلود ویدیو معرفی محصول</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column -->
      <div class="lg:col-span-1 space-y-6">
        <!-- Main Image -->
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
          <h3 class="font-bold text-lg mb-4">تصویر اصلی</h3>
          <div class="aspect-[3/4] rounded-xl border-2 border-dashed border-stone-300 overflow-hidden relative hover:bg-stone-50 transition group bg-stone-50">
            <input type="file" accept="image/*" @change="handleMainImage" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
            <img v-if="mainImagePreview" :src="mainImagePreview" class="w-full h-full object-cover" />
            <div v-else class="absolute inset-0 flex flex-col items-center justify-center text-stone-400">
              <ImageIcon class="w-10 h-10 mb-2" />
              <span class="text-sm">انتخاب تصویر</span>
            </div>
            <div class="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition z-10 pointer-events-none">
              <span class="text-sm font-bold">تغییر تصویر</span>
            </div>
          </div>
        </div>

        <!-- Order Limits -->
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
          <h3 class="font-bold text-lg mb-4">محدودیت سفارش</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-bold text-stone-700 mb-2">حداقل تعداد سفارش</label>
              <input v-model.number="form.min_order" type="number" min="1" class="w-full px-4 py-2 rounded-xl border border-stone-200 focus:border-stone-900 outline-none transition text-center" />
            </div>
            <div>
              <label class="block text-sm font-bold text-stone-700 mb-2">حداکثر تعداد سفارش</label>
              <input v-model="maxOrderInput" type="number" min="1" placeholder="نامحدود" class="w-full px-4 py-2 rounded-xl border border-stone-200 focus:border-stone-900 outline-none transition text-center" />
              <p class="text-xs text-stone-400 mt-1 text-center">برای نامحدود خالی بگذارید</p>
            </div>
          </div>
        </div>

        <!-- Settings -->
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
          <h3 class="font-bold text-lg mb-4">تنظیمات نمایش</h3>
          <label class="flex items-center gap-3 p-3 border border-stone-200 rounded-xl cursor-pointer hover:bg-stone-50 transition">
            <input type="checkbox" v-model="form.is_featured" class="w-5 h-5 accent-stone-900" />
            <span class="text-sm font-bold text-stone-700">نمایش در محصولات ویژه</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Quick Add Category Modal -->
    <div v-if="showCategoryModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white w-full max-w-md rounded-2xl p-6 animate-scale-in shadow-2xl">
        <div class="flex justify-between items-center mb-6">
          <h3 class="font-bold text-lg">افزودن دسته‌بندی جدید</h3>
          <button type="button" @click="showCategoryModal = false" class="text-stone-400 hover:text-stone-600"><X class="w-5 h-5" /></button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-bold text-stone-700 mb-2">تصویر دسته‌بندی</label>
            <div class="border-2 border-dashed border-stone-300 rounded-xl h-32 relative flex items-center justify-center hover:bg-stone-50 transition cursor-pointer overflow-hidden">
              <input type="file" accept="image/*" @change="handleNewCategoryImage" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <img v-if="newCategoryPreview" :src="newCategoryPreview" class="w-full h-full object-cover" />
              <div v-else class="flex flex-col items-center gap-2 text-stone-400">
                <Upload class="w-5 h-5" />
                <span class="text-xs">انتخاب تصویر</span>
              </div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-bold text-stone-700 mb-2">عنوان دسته‌بندی</label>
            <input
              v-model="newCategoryForm.title"
              type="text"
              class="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-stone-900 outline-none"
              placeholder="مثلا: کیف حصیری"
              @keyup.enter="saveNewCategory"
            />
          </div>

          <div class="flex gap-3 pt-2">
            <button
              type="button"
              @click="saveNewCategory"
              :disabled="creatingCategory"
              class="flex-1 bg-stone-900 text-white py-3 rounded-xl font-bold hover:bg-accent transition flex items-center justify-center gap-2 disabled:opacity-70"
            >
              <Loader2 v-if="creatingCategory" class="w-4 h-4 animate-spin" />
              <span v-else>افزودن</span>
            </button>
            <button type="button" @click="showCategoryModal = false" class="flex-1 bg-stone-100 text-stone-700 py-3 rounded-xl font-bold hover:bg-stone-200 transition">
              انصراف
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>