<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useToastStore } from '@/stores/toast'
import { Truck, Plus, Trash2, Edit2, Save, X, Check } from 'lucide-vue-next'

const settingsStore = useSettingsStore()
const toastStore = useToastStore()

const showForm = ref(false)
const editingId = ref<number | null>(null)

const form = ref({
  title: '',
  cost: 0,
  type: 'post' as 'post' | 'courier',
  tracking_url_template: '',
  is_active: true
})

onMounted(() => {
  settingsStore.fetchShippingMethods()
})

const resetForm = () => {
  form.value = {
    title: '',
    cost: 0,
    type: 'post',
    tracking_url_template: '',
    is_active: true
  }
  editingId.value = null
  showForm.value = false
}

const startEdit = (method: any) => {
  form.value = { ...method }
  editingId.value = method.id
  showForm.value = true
}

const handleSubmit = async () => {
  if (!form.value.title) {
    toastStore.showToast('عنوان روش ارسال الزامی است', 'warning')
    return
  }

  let error
  if (editingId.value) {
    error = await settingsStore.updateShippingMethod(editingId.value, form.value)
  } else {
    error = await settingsStore.addShippingMethod(form.value)
  }

  if (!error) {
    toastStore.showToast('روش ارسال ذخیره شد', 'success')
    resetForm()
  } else {
    toastStore.showToast('خطا در ذخیره', 'error')
  }
}

const handleDelete = async (id: number) => {
  if (!confirm('آیا از حذف این روش اطمینان دارید؟')) return
  const error = await settingsStore.deleteShippingMethod(id)
  if (!error) {
    toastStore.showToast('حذف شد', 'success')
  }
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <div class="flex justify-between items-center">
      <div>
        <h3 class="font-bold text-lg text-stone-800 mb-1">روش‌های ارسال</h3>
        <p class="text-sm text-stone-500">تعریف روش‌های حمل‌ونقل و لینک‌های رهگیری</p>
      </div>
      <button 
        v-if="!showForm"
        @click="showForm = true" 
        class="bg-stone-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-accent transition flex items-center gap-2"
      >
        <Plus class="w-4 h-4" /> افزودن روش جدید
      </button>
    </div>

    <!-- Form -->
    <div v-if="showForm" class="bg-stone-50 p-6 rounded-2xl border border-stone-200 animate-scale-in">
      <h4 class="font-bold text-stone-800 mb-4">{{ editingId ? 'ویرایش روش ارسال' : 'افزودن روش جدید' }}</h4>
      
      <div class="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-xs font-bold text-stone-600 mb-2">عنوان روش</label>
          <input v-model="form.title" type="text" placeholder="مثلا: پست پیشتاز" class="w-full px-4 py-2 rounded-xl border border-stone-300 focus:border-stone-900 outline-none" />
        </div>
        <div>
          <label class="block text-xs font-bold text-stone-600 mb-2">هزینه ارسال (تومان)</label>
          <input v-model="form.cost" type="number" class="w-full px-4 py-2 rounded-xl border border-stone-300 focus:border-stone-900 outline-none" />
        </div>
        <div>
          <label class="block text-xs font-bold text-stone-600 mb-2">نوع ارسال</label>
          <select v-model="form.type" class="w-full px-4 py-2 rounded-xl border border-stone-300 focus:border-stone-900 outline-none bg-white">
            <option value="post">پستی (دارای کد رهگیری)</option>
            <option value="courier">پیک / باربری (شماره راننده)</option>
          </select>
        </div>
        <div v-if="form.type === 'post'">
          <label class="block text-xs font-bold text-stone-600 mb-2">الگوی لینک رهگیری</label>
          <input v-model="form.tracking_url_template" type="text" placeholder="https://tracking.post.ir/?id={CODE}" class="w-full px-4 py-2 rounded-xl border border-stone-300 focus:border-stone-900 outline-none dir-ltr text-left" />
          <p class="text-[10px] text-stone-400 mt-1">از {CODE} به عنوان جایگزین کد رهگیری استفاده کنید.</p>
        </div>
      </div>

      <div class="flex items-center gap-2 mb-6">
        <input type="checkbox" v-model="form.is_active" id="active" class="w-4 h-4 accent-stone-900" />
        <label for="active" class="text-sm font-bold text-stone-700">فعال باشد</label>
      </div>

      <div class="flex gap-3">
        <button @click="handleSubmit" class="bg-stone-900 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-accent transition flex items-center gap-2">
          <Save class="w-4 h-4" /> ذخیره
        </button>
        <button @click="resetForm" class="bg-white border border-stone-300 text-stone-600 px-6 py-2 rounded-xl text-sm font-bold hover:bg-stone-50 transition">
          انصراف
        </button>
      </div>
    </div>

    <!-- List -->
    <div class="grid gap-4">
      <div v-for="method in settingsStore.shippingMethods" :key="method.id" class="bg-white p-4 rounded-xl border border-stone-100 flex items-center justify-between group hover:border-stone-300 transition">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center text-stone-500">
            <Truck class="w-5 h-5" />
          </div>
          <div>
            <div class="font-bold text-stone-800 flex items-center gap-2">
              {{ method.title }}
              <span v-if="!method.is_active" class="text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded">غیرفعال</span>
            </div>
            <div class="text-xs text-stone-500 mt-1">
              هزینه: {{ method.cost === 0 ? 'رایگان / پس‌کرایه' : method.cost.toLocaleString() + ' تومان' }} | 
              نوع: {{ method.type === 'post' ? 'پستی' : 'پیک/راننده' }}
            </div>
          </div>
        </div>
        
        <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition">
          <button @click="startEdit(method)" class="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"><Edit2 class="w-4 h-4" /></button>
          <button @click="handleDelete(method.id)" class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 class="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  </div>
</template>