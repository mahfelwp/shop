<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useToastStore } from '@/stores/toast'
import { Plus, Edit, Trash2, Loader2 } from 'lucide-vue-next'
import ConfirmModal from '@/components/common/ConfirmModal.vue'

const products = ref<any[]>([])
const loading = ref(true)
const toastStore = useToastStore()

// Modal State
const showDeleteModal = ref(false)
const itemToDelete = ref<number | null>(null)
const deleteLoading = ref(false)

const fetchProducts = async () => {
  loading.value = true
  const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
  products.value = data || []
  loading.value = false
}

const confirmDelete = (id: number) => {
  itemToDelete.value = id
  showDeleteModal.value = true
}

const handleDelete = async () => {
  if (!itemToDelete.value) return
  
  deleteLoading.value = true
  const { error } = await supabase.from('products').delete().eq('id', itemToDelete.value)
  
  if (!error) {
    products.value = products.value.filter(p => p.id !== itemToDelete.value)
    toastStore.showToast('محصول با موفقیت حذف شد', 'success')
    showDeleteModal.value = false
  } else {
    toastStore.showToast('خطا در حذف محصول', 'error')
  }
  deleteLoading.value = false
}

onMounted(fetchProducts)
</script>

<template>
  <div class="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden animate-fade-in">
    <div class="p-6 border-b border-stone-100 flex justify-between items-center">
      <span class="font-bold text-lg">لیست محصولات</span>
      <router-link :to="{ name: 'admin-product-create' }" class="bg-stone-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-accent transition text-sm font-bold">
        <Plus class="w-4 h-4" /> افزودن محصول جدید
      </router-link>
    </div>
    
    <div v-if="loading" class="p-12 text-center text-stone-400">
      <Loader2 class="w-8 h-8 animate-spin mx-auto mb-2" />
      در حال بارگذاری...
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-right">
        <thead class="bg-stone-50 text-stone-500 text-sm">
          <tr>
            <th class="p-4">تصویر</th>
            <th class="p-4">نام محصول</th>
            <th class="p-4">دسته‌بندی</th>
            <th class="p-4">قیمت</th>
            <th class="p-4">عملیات</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-stone-100">
          <tr v-for="product in products" :key="product.id" class="hover:bg-stone-50 transition">
            <td class="p-4"><img :src="product.image" class="w-12 h-12 rounded-lg object-cover bg-stone-200 border border-stone-100" /></td>
            <td class="p-4 font-medium text-stone-800">{{ product.title }}</td>
            <td class="p-4 text-stone-500">
              <span class="bg-stone-100 px-2 py-1 rounded text-xs">{{ product.category }}</span>
            </td>
            <td class="p-4 font-bold">{{ product.price.toLocaleString() }}</td>
            <td class="p-4 flex items-center gap-3">
              <router-link :to="{ name: 'admin-product-edit', params: { id: product.id } }" class="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition flex items-center gap-1 text-sm font-bold">
                <Edit class="w-4 h-4" /> ویرایش
              </router-link>
              <button @click="confirmDelete(product.id)" class="text-red-500 hover:bg-red-50 p-2 rounded-lg transition flex items-center gap-1 text-sm font-bold">
                <Trash2 class="w-4 h-4" /> حذف
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Custom Confirm Modal -->
    <ConfirmModal 
      v-if="showDeleteModal"
      title="حذف محصول"
      message="آیا از حذف این محصول اطمینان دارید؟ این عملیات غیرقابل بازگشت است."
      confirmText="بله، حذف شود"
      type="danger"
      :loading="deleteLoading"
      @confirm="handleDelete"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>