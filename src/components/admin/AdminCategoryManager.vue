<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCategoryStore } from '@/stores/category'
import { useToastStore } from '@/stores/toast'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, Upload, Loader2, Image as ImageIcon, Edit, X } from 'lucide-vue-next'
import ConfirmModal from '@/components/common/ConfirmModal.vue'

const categoryStore = useCategoryStore()
const toastStore = useToastStore()

// Form State
const form = ref({ title: '', image: '' })
const imageFile = ref<File | null>(null)
const imagePreview = ref<string | null>(null)
const submitting = ref(false)

// Edit Mode State
const isEditing = ref(false)
const editingId = ref<number | null>(null)

// Delete Modal State
const showDeleteModal = ref(false)
const itemToDelete = ref<number | null>(null)
const deleteLoading = ref(false)

onMounted(() => {
  categoryStore.fetchCategories()
})

const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    imageFile.value = target.files[0]
    imagePreview.value = URL.createObjectURL(target.files[0])
  }
}

const resetForm = () => {
  form.value = { title: '', image: '' }
  imageFile.value = null
  imagePreview.value = null
  isEditing.value = false
  editingId.value = null
}

const startEdit = (category: any) => {
  isEditing.value = true
  editingId.value = category.id
  form.value.title = category.title
  form.value.image = category.image
  imagePreview.value = category.image
  imageFile.value = null
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleSubmit = async () => {
  if (!form.value.title) {
    toastStore.showToast('عنوان دسته‌بندی الزامی است', 'warning')
    return
  }

  submitting.value = true
  try {
    let imageUrl = form.value.image

    if (imageFile.value) {
      const fileName = `cat_${Date.now()}_${imageFile.value.name.replace(/[^a-zA-Z0-9.]/g, '')}`
      const { error: uploadError } = await supabase.storage.from('products').upload(fileName, imageFile.value)
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('products').getPublicUrl(fileName)
      imageUrl = data.publicUrl
    }

    let error
    if (isEditing.value && editingId.value) {
      error = await categoryStore.updateCategory(editingId.value, {
        title: form.value.title,
        image: imageUrl
      })
    } else {
      error = await categoryStore.addCategory({
        title: form.value.title,
        image: imageUrl
      })
    }

    if (!error) {
      toastStore.showToast(isEditing.value ? 'دسته‌بندی ویرایش شد' : 'دسته‌بندی اضافه شد', 'success')
      resetForm()
    } else {
      throw error
    }
  } catch (e: any) {
    toastStore.showToast('خطا: ' + e.message, 'error')
  } finally {
    submitting.value = false
  }
}

const confirmDelete = (id: number) => {
  itemToDelete.value = id
  showDeleteModal.value = true
}

const handleDelete = async () => {
  if (!itemToDelete.value) return
  
  deleteLoading.value = true
  const error = await categoryStore.deleteCategory(itemToDelete.value)
  
  if (!error) {
    toastStore.showToast('دسته‌بندی حذف شد', 'success')
    if (editingId.value === itemToDelete.value) resetForm()
    showDeleteModal.value = false
  } else {
    toastStore.showToast('خطا در حذف', 'error')
  }
  deleteLoading.value = false
}
</script>

<template>
  <div class="grid lg:grid-cols-3 gap-8 animate-fade-in">
    
    <!-- Form Section -->
    <div class="lg:col-span-1">
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 sticky top-24">
        <div class="flex justify-between items-center mb-6">
          <h3 class="font-bold text-lg">{{ isEditing ? 'ویرایش دسته‌بندی' : 'افزودن دسته‌بندی جدید' }}</h3>
          <button v-if="isEditing" @click="resetForm" class="text-xs text-red-500 bg-red-50 px-2 py-1 rounded hover:bg-red-100 transition flex items-center gap-1">
            <X class="w-3 h-3" /> انصراف
          </button>
        </div>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-bold text-stone-700 mb-2">تصویر شاخص</label>
            <div class="border-2 border-dashed border-stone-300 rounded-xl p-4 text-center hover:bg-stone-50 transition relative h-40 flex items-center justify-center cursor-pointer overflow-hidden group">
              <input type="file" accept="image/*" @change="handleImageUpload" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <img v-if="imagePreview" :src="imagePreview" class="w-full h-full object-cover" />
              <div v-else class="flex flex-col items-center gap-2 text-stone-400">
                <Upload class="w-6 h-6" />
                <span class="text-xs">آپلود تصویر</span>
              </div>
              <div v-if="imagePreview" class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-0">
                <span class="text-white text-xs font-bold">تغییر تصویر</span>
              </div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-bold text-stone-700 mb-2">عنوان دسته‌بندی</label>
            <input 
              v-model="form.title" 
              type="text" 
              class="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-stone-900 outline-none" 
              placeholder="مثلا: سبد حصیری" 
              @keyup.enter="handleSubmit"
            />
          </div>

          <button 
            @click="handleSubmit" 
            :disabled="submitting"
            class="w-full text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 disabled:opacity-70"
            :class="isEditing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-stone-900 hover:bg-accent'"
          >
            <Loader2 v-if="submitting" class="w-5 h-5 animate-spin" />
            <span v-else>{{ isEditing ? 'ذخیره تغییرات' : 'افزودن دسته‌بندی' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- List Section -->
    <div class="lg:col-span-2">
      <div class="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
        <div class="p-6 border-b border-stone-100">
          <span class="font-bold text-lg">لیست دسته‌بندی‌ها</span>
        </div>
        
        <div v-if="categoryStore.loading" class="p-8 text-center text-stone-400">
          <Loader2 class="w-8 h-8 animate-spin mx-auto mb-2" />
          در حال دریافت...
        </div>

        <div v-else-if="categoryStore.categories.length === 0" class="p-8 text-center text-stone-400">
          هیچ دسته‌بندی یافت نشد.
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
          <div 
            v-for="cat in categoryStore.categories" 
            :key="cat.id" 
            class="flex items-center gap-4 p-4 border rounded-xl transition bg-stone-50 group relative"
            :class="editingId === cat.id ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50' : 'border-stone-100 hover:border-stone-300'"
          >
            <div class="w-16 h-16 rounded-lg bg-white border border-stone-200 overflow-hidden flex-shrink-0">
              <img v-if="cat.image" :src="cat.image" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full flex items-center justify-center text-stone-300">
                <ImageIcon class="w-6 h-6" />
              </div>
            </div>
            <div class="flex-grow">
              <h4 class="font-bold text-stone-800">{{ cat.title }}</h4>
              <span class="text-xs text-stone-400">ID: {{ cat.id }}</span>
            </div>
            
            <!-- Actions -->
            <div class="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity absolute left-4 top-1/2 -translate-y-1/2">
              <button 
                @click="startEdit(cat)" 
                class="p-2 text-blue-500 bg-white shadow-sm hover:bg-blue-50 rounded-lg transition"
                title="ویرایش"
              >
                <Edit class="w-4 h-4" />
              </button>
              <button 
                @click="confirmDelete(cat.id)" 
                class="p-2 text-red-500 bg-white shadow-sm hover:bg-red-50 rounded-lg transition"
                title="حذف"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
            
            <!-- Mobile Actions (Always Visible) -->
            <div class="flex flex-col gap-2 lg:hidden absolute left-4 top-1/2 -translate-y-1/2">
               <button @click="startEdit(cat)" class="p-2 text-blue-500"><Edit class="w-4 h-4" /></button>
               <button @click="confirmDelete(cat.id)" class="p-2 text-red-500"><Trash2 class="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Custom Confirm Modal -->
    <ConfirmModal 
      v-if="showDeleteModal"
      title="حذف دسته‌بندی"
      message="آیا از حذف این دسته‌بندی اطمینان دارید؟"
      confirmText="بله، حذف شود"
      type="danger"
      :loading="deleteLoading"
      @confirm="handleDelete"
      @cancel="showDeleteModal = false"
    />

  </div>
</template>