<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCommentStore } from '@/stores/comment'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { Star, User, MessageSquare, Send, Loader2 } from 'lucide-vue-next'

const props = defineProps<{
  productId: number
}>()

const commentStore = useCommentStore()
const authStore = useAuthStore()
const toastStore = useToastStore()

const newComment = ref('')
const newRating = ref(5)
const submitting = ref(false)

onMounted(() => {
  commentStore.fetchProductComments(props.productId)
})

const submitComment = async () => {
  if (!newComment.value.trim()) {
    toastStore.showToast('لطفا متن نظر را وارد کنید', 'warning')
    return
  }

  submitting.value = true
  const { error } = await commentStore.addComment(props.productId, newComment.value, newRating.value)
  
  if (!error) {
    toastStore.showToast('نظر شما ثبت شد و پس از تایید نمایش داده می‌شود', 'success')
    newComment.value = ''
    newRating.value = 5
  } else {
    toastStore.showToast('خطا در ثبت نظر', 'error')
  }
  submitting.value = false
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('fa-IR')
}
</script>

<template>
  <div class="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-stone-100 mt-8">
    <h3 class="text-2xl font-bold text-stone-800 mb-8 flex items-center gap-2">
      <MessageSquare class="w-6 h-6 text-accent" />
      نظرات کاربران
    </h3>

    <div class="grid lg:grid-cols-12 gap-10">
      
      <!-- Comment Form -->
      <div class="lg:col-span-4">
        <div class="bg-stone-50 p-6 rounded-2xl border border-stone-100 sticky top-24">
          <h4 class="font-bold text-lg mb-4">دیدگاه خود را بنویسید</h4>
          
          <div v-if="authStore.isAuthenticated">
            <div class="mb-4">
              <label class="block text-sm font-bold text-stone-600 mb-2">امتیاز شما</label>
              <div class="flex gap-1">
                <button 
                  v-for="i in 5" 
                  :key="i" 
                  @click="newRating = i"
                  class="transition hover:scale-110"
                >
                  <Star 
                    class="w-6 h-6" 
                    :class="i <= newRating ? 'fill-yellow-400 text-yellow-400' : 'text-stone-300'" 
                  />
                </button>
              </div>
            </div>

            <div class="mb-4">
              <label class="block text-sm font-bold text-stone-600 mb-2">متن نظر</label>
              <textarea 
                v-model="newComment" 
                rows="4" 
                class="w-full p-3 rounded-xl border border-stone-200 focus:border-stone-900 outline-none transition"
                placeholder="نظر خود را درباره این محصول بنویسید..."
              ></textarea>
            </div>

            <button 
              @click="submitComment" 
              :disabled="submitting"
              class="w-full bg-stone-900 text-white py-3 rounded-xl font-bold hover:bg-accent transition flex items-center justify-center gap-2 disabled:opacity-70"
            >
              <Loader2 v-if="submitting" class="w-5 h-5 animate-spin" />
              <span v-else>ثبت دیدگاه</span>
              <Send v-if="!submitting" class="w-4 h-4" />
            </button>
          </div>

          <div v-else class="text-center py-8">
            <p class="text-stone-500 mb-4">برای ثبت نظر باید وارد حساب کاربری خود شوید.</p>
            <router-link to="/login" class="inline-block bg-white border border-stone-300 text-stone-700 px-6 py-2 rounded-xl font-bold hover:bg-stone-100 transition">
              ورود / ثبت نام
            </router-link>
          </div>
        </div>
      </div>

      <!-- Comments List -->
      <div class="lg:col-span-8">
        <div v-if="commentStore.loading" class="text-center py-12">
          <Loader2 class="w-8 h-8 animate-spin mx-auto text-stone-400" />
        </div>

        <div v-else-if="commentStore.comments.length === 0" class="text-center py-12 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
          <p class="text-stone-500">هنوز نظری برای این محصول ثبت نشده است.</p>
        </div>

        <div v-else class="space-y-6">
          <div v-for="comment in commentStore.comments" :key="comment.id" class="border-b border-stone-100 pb-6 last:border-0">
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-500">
                  <User class="w-5 h-5" />
                </div>
                <div>
                  <div class="font-bold text-stone-800">{{ comment.profiles?.full_name || 'کاربر ناشناس' }}</div>
                  <div class="text-xs text-stone-400">{{ formatDate(comment.created_at) }}</div>
                </div>
              </div>
              <div class="flex gap-0.5">
                <Star 
                  v-for="i in 5" 
                  :key="i" 
                  class="w-4 h-4" 
                  :class="i <= comment.rating ? 'fill-yellow-400 text-yellow-400' : 'text-stone-200'" 
                />
              </div>
            </div>
            <p class="text-stone-600 leading-relaxed text-sm">{{ comment.content }}</p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>