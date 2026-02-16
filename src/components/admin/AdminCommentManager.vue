<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useCommentStore } from '@/stores/comment'
import { useToastStore } from '@/stores/toast'
import { MessageSquare, Check, X, Trash2, Star, Loader2, Filter } from 'lucide-vue-next'
import ConfirmModal from '@/components/common/ConfirmModal.vue'

const commentStore = useCommentStore()
const toastStore = useToastStore()

const filterStatus = ref<'all' | 'pending'>('pending')
const showDeleteModal = ref(false)
const commentToDelete = ref<number | null>(null)
const processingId = ref<number | null>(null)

onMounted(() => {
  commentStore.fetchAllComments()
})

const filteredComments = computed(() => {
  if (filterStatus.value === 'all') return commentStore.comments
  return commentStore.comments.filter(c => c.status === 'pending')
})

const handleStatusUpdate = async (id: number, status: 'approved' | 'rejected') => {
  processingId.value = id
  const error = await commentStore.updateStatus(id, status)
  if (!error) {
    toastStore.showToast(status === 'approved' ? 'نظر تایید شد' : 'نظر رد شد', 'success')
  } else {
    toastStore.showToast('خطا در تغییر وضعیت', 'error')
  }
  processingId.value = null
}

const confirmDelete = (id: number) => {
  commentToDelete.value = id
  showDeleteModal.value = true
}

const handleDelete = async () => {
  if (!commentToDelete.value) return
  const error = await commentStore.deleteComment(commentToDelete.value)
  if (!error) {
    toastStore.showToast('نظر حذف شد', 'success')
    showDeleteModal.value = false
  } else {
    toastStore.showToast('خطا در حذف', 'error')
  }
}

const formatDate = (date: string) => new Date(date).toLocaleDateString('fa-IR')
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">مدیریت نظرات</h2>
        <p class="text-gray-500 text-sm mt-1">بررسی و تایید دیدگاه‌های کاربران</p>
      </div>
      
      <div class="flex bg-white p-1 rounded-xl border border-gray-200">
        <button 
          @click="filterStatus = 'pending'"
          class="px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2"
          :class="filterStatus === 'pending' ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:bg-gray-50'"
        >
          <Loader2 class="w-4 h-4" /> در انتظار ({{ commentStore.comments.filter(c => c.status === 'pending').length }})
        </button>
        <button 
          @click="filterStatus = 'all'"
          class="px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2"
          :class="filterStatus === 'all' ? 'bg-gray-100 text-gray-800' : 'text-gray-500 hover:bg-gray-50'"
        >
          <Filter class="w-4 h-4" /> همه نظرات
        </button>
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div v-if="commentStore.loading" class="p-12 text-center text-gray-400">
        <Loader2 class="w-8 h-8 animate-spin mx-auto mb-2" />
        در حال دریافت نظرات...
      </div>

      <div v-else-if="filteredComments.length === 0" class="p-12 text-center text-gray-400">
        هیچ نظری یافت نشد.
      </div>

      <div v-else class="divide-y divide-gray-100">
        <div v-for="comment in filteredComments" :key="comment.id" class="p-6 hover:bg-gray-50 transition">
          <div class="flex justify-between items-start mb-4">
            <div class="flex items-center gap-4">
              <img v-if="comment.products?.image" :src="comment.products.image" class="w-12 h-12 rounded-lg object-cover border border-gray-200" />
              <div>
                <div class="font-bold text-gray-800 text-sm">{{ comment.products?.title }}</div>
                <div class="text-xs text-gray-500 mt-1">توسط: {{ comment.profiles?.full_name || 'ناشناس' }} | {{ formatDate(comment.created_at) }}</div>
              </div>
            </div>
            <div class="flex items-center gap-1">
              <Star v-for="i in 5" :key="i" class="w-3 h-3" :class="i <= comment.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'" />
            </div>
          </div>

          <p class="text-gray-600 text-sm bg-gray-50 p-4 rounded-xl mb-4 border border-gray-100">
            {{ comment.content }}
          </p>

          <div class="flex justify-between items-center">
            <span class="text-xs font-bold px-2 py-1 rounded" :class="{
              'bg-orange-100 text-orange-600': comment.status === 'pending',
              'bg-green-100 text-green-600': comment.status === 'approved',
              'bg-red-100 text-red-600': comment.status === 'rejected'
            }">
              {{ comment.status === 'pending' ? 'در انتظار تایید' : (comment.status === 'approved' ? 'تایید شده' : 'رد شده') }}
            </span>

            <div class="flex gap-2">
              <button 
                v-if="comment.status !== 'approved'"
                @click="handleStatusUpdate(comment.id, 'approved')" 
                :disabled="processingId === comment.id"
                class="bg-green-50 text-green-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-100 transition flex items-center gap-1"
              >
                <Check class="w-3 h-3" /> تایید
              </button>
              
              <button 
                v-if="comment.status !== 'rejected'"
                @click="handleStatusUpdate(comment.id, 'rejected')" 
                :disabled="processingId === comment.id"
                class="bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-orange-100 transition flex items-center gap-1"
              >
                <X class="w-3 h-3" /> رد کردن
              </button>

              <button 
                @click="confirmDelete(comment.id)" 
                class="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 transition flex items-center gap-1"
              >
                <Trash2 class="w-3 h-3" /> حذف
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ConfirmModal 
      v-if="showDeleteModal"
      title="حذف نظر"
      message="آیا از حذف این نظر اطمینان دارید؟"
      confirmText="بله، حذف شود"
      type="danger"
      @confirm="handleDelete"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>