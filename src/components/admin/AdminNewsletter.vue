<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useToastStore } from '@/stores/toast'
import { Mail, Trash2, Copy, Calendar, Loader2, Users } from 'lucide-vue-next'
import ConfirmModal from '@/components/common/ConfirmModal.vue'

const subscribers = ref<any[]>([])
const loading = ref(true)
const toastStore = useToastStore()

// Delete Modal State
const showDeleteModal = ref(false)
const itemToDelete = ref<number | null>(null)
const deleteLoading = ref(false)

const fetchSubscribers = async () => {
  loading.value = true
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (data) {
    subscribers.value = data
  }
  loading.value = false
}

const copyAllEmails = () => {
  if (subscribers.value.length === 0) return
  
  const emails = subscribers.value.map(s => s.email).join(', ')
  navigator.clipboard.writeText(emails)
  toastStore.showToast(`${subscribers.value.length} ایمیل کپی شد`, 'success')
}

const confirmDelete = (id: number) => {
  itemToDelete.value = id
  showDeleteModal.value = true
}

const handleDelete = async () => {
  if (!itemToDelete.value) return
  
  deleteLoading.value = true
  const { error } = await supabase
    .from('newsletter_subscribers')
    .delete()
    .eq('id', itemToDelete.value)
  
  if (!error) {
    subscribers.value = subscribers.value.filter(s => s.id !== itemToDelete.value)
    toastStore.showToast('عضو با موفقیت حذف شد', 'success')
    showDeleteModal.value = false
  } else {
    toastStore.showToast('خطا در حذف', 'error')
  }
  deleteLoading.value = false
}

const formatDate = (date: string) => new Date(date).toLocaleDateString('fa-IR')

onMounted(fetchSubscribers)
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">مدیریت خبرنامه</h2>
        <p class="text-gray-500 text-sm mt-1">لیست ایمیل‌های جمع‌آوری شده برای بازاریابی</p>
      </div>
      
      <button 
        @click="copyAllEmails" 
        :disabled="subscribers.length === 0"
        class="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition flex items-center gap-2 shadow-lg shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        <Copy class="w-4 h-4" />
        کپی همه ایمیل‌ها
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
        <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
          <Users class="w-6 h-6" />
        </div>
        <div>
          <div class="text-gray-500 text-sm">تعداد اعضا</div>
          <div class="text-2xl font-bold">{{ subscribers.length }}</div>
        </div>
      </div>
    </div>

    <!-- List -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div v-if="loading" class="p-12 text-center text-gray-400">
        <Loader2 class="w-8 h-8 animate-spin mx-auto mb-2" />
        در حال دریافت لیست...
      </div>

      <div v-else-if="subscribers.length === 0" class="p-12 text-center text-gray-400">
        هنوز کسی در خبرنامه عضو نشده است.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-right">
          <thead class="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
            <tr>
              <th class="p-5">ایمیل</th>
              <th class="p-5">تاریخ عضویت</th>
              <th class="p-5">عملیات</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="sub in subscribers" :key="sub.id" class="hover:bg-gray-50/50 transition">
              <td class="p-5">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                    <Mail class="w-4 h-4" />
                  </div>
                  <span class="font-mono text-gray-700 font-medium">{{ sub.email }}</span>
                </div>
              </td>
              <td class="p-5 text-gray-600 text-sm">
                <div class="flex items-center gap-2">
                  <Calendar class="w-4 h-4 text-gray-400" />
                  {{ formatDate(sub.created_at) }}
                </div>
              </td>
              <td class="p-5">
                <button 
                  @click="confirmDelete(sub.id)" 
                  class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                  title="حذف از لیست"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Confirm Modal -->
    <ConfirmModal 
      v-if="showDeleteModal"
      title="حذف عضو"
      message="آیا از حذف این ایمیل از لیست خبرنامه اطمینان دارید؟"
      confirmText="بله، حذف شود"
      type="danger"
      :loading="deleteLoading"
      @confirm="handleDelete"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>