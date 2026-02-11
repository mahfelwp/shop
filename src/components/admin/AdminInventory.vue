<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useToastStore } from '@/stores/toast'
import { Search, Save, AlertTriangle, CheckCircle2, PackageX, Loader2 } from 'lucide-vue-next'

const products = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const searchQuery = ref('')
const toastStore = useToastStore()

// دریافت محصولات واقعی به همراه موجودی از دیتابیس
const fetchProducts = async () => {
  loading.value = true
  const { data, error } = await supabase
    .from('products')
    .select('id, title, price, image, stock')
    .order('created_at', { ascending: false })
  
  if (data) {
    // اگر مقدار stock نال بود، صفر در نظر می‌گیریم
    products.value = data.map(p => ({
      ...p,
      stock: p.stock ?? 0
    }))
  }
  loading.value = false
}

const filteredProducts = computed(() => {
  return products.value.filter(p => p.title.toLowerCase().includes(searchQuery.value.toLowerCase()))
})

const getStockStatus = (count: number) => {
  if (count === 0) return { label: 'ناموجود', color: 'bg-red-50 text-red-600', icon: PackageX }
  if (count < 10) return { label: 'کمبود موجودی', color: 'bg-orange-50 text-orange-600', icon: AlertTriangle }
  return { label: 'موجود', color: 'bg-green-50 text-green-600', icon: CheckCircle2 }
}

const updateLocalStock = (id: number, change: number) => {
  const product = products.value.find(p => p.id === id)
  if (product) {
    const newStock = product.stock + change
    if (newStock >= 0) {
      product.stock = newStock
    }
  }
}

const saveChanges = async () => {
  saving.value = true
  try {
    // ایجاد آرایه‌ای از پرامیس‌ها برای آپدیت همزمان
    const updates = products.value.map(p => 
      supabase
        .from('products')
        .update({ stock: p.stock })
        .eq('id', p.id)
    )

    await Promise.all(updates)
    toastStore.showToast('تغییرات موجودی با موفقیت در دیتابیس ذخیره شد', 'success')
  } catch (error) {
    console.error(error)
    toastStore.showToast('خطا در ذخیره تغییرات', 'error')
  } finally {
    saving.value = false
  }
}

onMounted(fetchProducts)
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">مدیریت موجودی انبار</h2>
        <p class="text-gray-500 text-sm mt-1">کنترل تعداد محصولات و وضعیت انبار (داده‌های واقعی)</p>
      </div>
      <div class="flex gap-3">
        <div class="relative">
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="جستجوی محصول..." 
            class="pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none w-64 transition bg-white"
          />
          <Search class="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
        </div>
        <button 
          @click="saveChanges" 
          :disabled="saving"
          class="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition flex items-center gap-2 shadow-lg shadow-indigo-200 disabled:opacity-70"
        >
          <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
          <Save v-else class="w-4 h-4" />
          ذخیره تغییرات
        </button>
      </div>
    </div>

    <!-- Inventory Table -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      
      <div v-if="loading" class="p-12 text-center text-gray-400 flex flex-col items-center">
        <Loader2 class="w-8 h-8 animate-spin mb-2" />
        در حال دریافت اطلاعات انبار...
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-right">
          <thead class="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
            <tr>
              <th class="p-5">محصول</th>
              <th class="p-5">قیمت واحد</th>
              <th class="p-5">وضعیت</th>
              <th class="p-5 text-center">تعداد موجودی</th>
              <th class="p-5 text-center">ارزش کل موجودی</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="product in filteredProducts" :key="product.id" class="hover:bg-gray-50/50 transition group">
              <td class="p-5">
                <div class="flex items-center gap-4">
                  <img :src="product.image" class="w-12 h-12 rounded-xl object-cover border border-gray-100 shadow-sm" />
                  <div>
                    <div class="font-bold text-gray-800">{{ product.title }}</div>
                    <div class="text-xs text-gray-400 mt-0.5">کد: {{ product.id }}</div>
                  </div>
                </div>
              </td>
              <td class="p-5 text-gray-600 font-medium">
                {{ product.price.toLocaleString() }} <span class="text-xs text-gray-400">تومان</span>
              </td>
              <td class="p-5">
                <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg w-fit text-xs font-bold" :class="getStockStatus(product.stock).color">
                  <component :is="getStockStatus(product.stock).icon" class="w-3.5 h-3.5" />
                  {{ getStockStatus(product.stock).label }}
                </div>
              </td>
              <td class="p-5">
                <div class="flex items-center justify-center gap-3">
                  <button @click="updateLocalStock(product.id, -1)" class="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-100 text-gray-600 transition">-</button>
                  <input 
                    type="number" 
                    v-model="product.stock" 
                    class="w-16 text-center font-bold text-gray-800 bg-transparent outline-none border-b border-gray-200 focus:border-indigo-500 py-1"
                  />
                  <button @click="updateLocalStock(product.id, 1)" class="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-100 text-gray-600 transition">+</button>
                </div>
              </td>
              <td class="p-5 text-center font-bold text-gray-800">
                {{ (product.price * product.stock).toLocaleString() }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div v-if="!loading && filteredProducts.length === 0" class="p-12 text-center text-gray-400">
        محصولی یافت نشد.
      </div>
    </div>
  </div>
</template>