<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCommentStore } from '@/stores/comment'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { Star, User, Send, Loader2, MessageSquare } from 'lucide-vue-next'
 
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
  return new Date(date).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })
}
</script>
 
<template>
  <div class="grid md:grid-cols-12 gap-10">
    
    <!-- Form Section (Left/Top) -->
    <div class="md:col-span-5 order-1">
      <div class="bg-stone-50 rounded-xl p-6 border border-stone-100 sticky top-32">
        <h4 class="font-bold text-stone-800 mb-4 text-sm">دیدگاه خود را بنویسید</h4>
        
        <div v-if="authStore.isAuthenticated">
          <div class="mb-4">
            <label class="block text-xs font-medium text-stone-500 mb-2">امتیاز شما</label>
            <div class="flex gap-1">
              <button 
                v-for="i in 5" 
                :key="i" 
                @click="newRating = i"
                class="focus:outline-none transition-transform hover:scale-110"
              >
                <Star 
                  class="w-5 h-5 transition-colors" 
                  :class="i <= newRating ? 'fill-yellow-400 text-yellow-400' : 'text-stone-300'" 
                />
              </button>
            </div>
          </div>

          <div class="mb-4">
            <label class="block text-xs font-medium text-stone-500 mb-2">متن نظر</label>
            <textarea 
              v-model="newComment" 
              rows="4" 
              class="w-full p-3 rounded-lg bg-white border border-stone-200 focus:border-stone-400 outline-none transition text-stone-700 placeholder-stone-400 resize-none text-sm"
              placeholder="نظر خود را درباره این محصول بنویسید..."
            ></textarea>
          </div>

          <button 
            @click="submitComment" 
            :disabled="submitting"
            class="w-full bg-stone-900 text-white py-3 rounded-lg font-medium text-sm hover:bg-stone-800 transition flex items-center justify-center gap-2 disabled:opacity-70"
          >
            <Loader2 v-if="submitting" class="w-4 h-4 animate-spin" />
            <span v-else>ثبت دیدگاه</span>
          </button>
        </div>

        <div v-else class="text-center py-8">
          <p class="text-stone-500 text-sm mb-4">برای ثبت نظر ابتدا وارد شوید</p>
          <router-link to="/login" class="inline-block border border-stone-300 text-stone-700 px-6 py-2 rounded-lg text-sm font-medium hover:bg-stone-100 transition">
            ورود / ثبت نام
          </router-link>
        </div>
      </div>
    </div>

    <!-- List Section (Right/Bottom) -->
    <div class="md:col-span-7 order-2">
      <div v-if="commentStore.loading" class="text-center py-8">
        <Loader2 class="w-6 h-6 animate-spin mx-auto text-stone-300" />
      </div>

      <div v-else-if="commentStore.comments.length === 0" class="text-center py-12 border border-dashed border-stone-200 rounded-xl">
        <MessageSquare class="w-8 h-8 mx-auto text-stone-300 mb-2" />
        <p class="text-stone-500 text-sm">هنوز نظری برای این محصول ثبت نشده است.</p>
      </div>

      <div v-else class="space-y-6">
        <div v-for="comment in commentStore.comments" :key="comment.id" class="border-b border-stone-100 pb-6 last:border-0">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center text-stone-500 font-bold text-xs">
                {{ comment.profiles?.full_name ? comment.profiles.full_name.charAt(0) : 'U' }}
              </div>
              <div>
                <div class="font-bold text-stone-800 text-sm">{{ comment.profiles?.full_name || 'کاربر ناشناس' }}</div>
                <div class="text-[10px] text-stone-400">{{ formatDate(comment.created_at) }}</div>
              </div>
            </div>
            <div class="flex gap-0.5">
              <Star 
                v-for="i in 5" 
                :key="i" 
                class="w-3 h-3" 
                :class="i <= comment.rating ? 'fill-yellow-400 text-yellow-400' : 'text-stone-200'" 
              />
            </div>
          </div>
          
          <p class="text-stone-600 text-sm leading-relaxed text-justify">
            {{ comment.content }}
          </p>
        </div>
      </div>
    </div>

  </div>
</template>