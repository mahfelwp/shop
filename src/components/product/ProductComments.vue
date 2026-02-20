<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCommentStore } from '@/stores/comment'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { Star, User, Send, Loader2, MessageSquare, Quote } from 'lucide-vue-next'
 
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
  <div class="grid lg:grid-cols-12 gap-12">
    
    <!-- List Section (Right) -->
    <div class="lg:col-span-7 order-2 lg:order-1">
      <div class="flex items-center justify-between mb-8">
        <h3 class="font-bold text-xl text-stone-800 flex items-center gap-2">
          <MessageSquare class="w-5 h-5" />
          نظرات کاربران
        </h3>
        <span class="text-xs bg-stone-100 px-3 py-1 rounded-full text-stone-500 font-bold">{{ commentStore.comments.length }} دیدگاه ثبت شده</span>
      </div>

      <div v-if="commentStore.loading" class="text-center py-12">
        <Loader2 class="w-8 h-8 animate-spin mx-auto text-stone-300" />
      </div>

      <div v-else-if="commentStore.comments.length === 0" class="text-center py-12 bg-stone-50 rounded-3xl border border-dashed border-stone-200">
        <p class="text-stone-500 font-bold text-sm">هنوز نظری برای این محصول ثبت نشده است.</p>
        <p class="text-stone-400 text-xs mt-1">اولین نفری باشید که نظر می‌دهد!</p>
      </div>

      <div v-else class="space-y-4">
        <div v-for="comment in commentStore.comments" :key="comment.id" class="bg-stone-50 p-6 rounded-3xl border border-stone-100 relative group hover:bg-white hover:shadow-sm transition duration-300">
          <Quote class="absolute top-6 left-6 w-8 h-8 text-stone-200 rotate-180" />
          
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 bg-white border border-stone-200 rounded-full flex items-center justify-center text-stone-500 font-bold text-sm shadow-sm">
              {{ comment.profiles?.full_name ? comment.profiles.full_name.charAt(0) : 'U' }}
            </div>
            <div>
              <div class="font-bold text-stone-800 text-sm">{{ comment.profiles?.full_name || 'کاربر ناشناس' }}</div>
              <div class="text-[10px] text-stone-400 mt-0.5">{{ formatDate(comment.created_at) }}</div>
            </div>
            <div class="mr-auto flex gap-0.5 bg-white px-2 py-1 rounded-lg border border-stone-100">
              <Star 
                v-for="i in 5" 
                :key="i" 
                class="w-3 h-3" 
                :class="i <= comment.rating ? 'fill-yellow-400 text-yellow-400' : 'text-stone-200'" 
              />
            </div>
          </div>
          
          <p class="text-stone-600 text-sm leading-7 text-justify relative z-10">
            {{ comment.content }}
          </p>
        </div>
      </div>
    </div>

    <!-- Form Section (Left - Dark Card) -->
    <div class="lg:col-span-5 order-1 lg:order-2">
      <div class="bg-stone-900 rounded-[32px] p-8 text-white sticky top-32 shadow-2xl shadow-stone-900/20">
        <h4 class="font-bold text-xl mb-2">دیدگاه خود را بنویسید</h4>
        <p class="text-stone-400 text-xs mb-8 leading-relaxed">نظر شما به انتخاب سایر کاربران کمک می‌کند.</p>
        
        <div v-if="authStore.isAuthenticated">
          <div class="mb-6 text-center">
            <label class="block text-xs font-bold text-stone-400 mb-3">امتیاز شما</label>
            <div class="flex justify-center gap-2">
              <button 
                v-for="i in 5" 
                :key="i" 
                @click="newRating = i"
                class="transition hover:scale-110 focus:outline-none p-1"
              >
                <Star 
                  class="w-8 h-8 transition-colors" 
                  :class="i <= newRating ? 'fill-yellow-400 text-yellow-400' : 'text-stone-700 fill-stone-700'" 
                />
              </button>
            </div>
          </div>

          <div class="mb-6">
            <label class="block text-xs font-bold text-stone-400 mb-3">متن نظر</label>
            <textarea 
              v-model="newComment" 
              rows="4" 
              class="w-full p-4 rounded-2xl bg-white/5 border border-white/10 focus:border-white/30 outline-none transition text-white placeholder-stone-600 resize-none text-sm leading-relaxed"
              placeholder="نظر خود را درباره نقاط قوت و ضعف این محصول بنویسید..."
            ></textarea>
          </div>

          <button 
            @click="submitComment" 
            :disabled="submitting"
            class="w-full bg-white text-stone-900 py-4 rounded-xl font-bold hover:bg-stone-200 transition flex items-center justify-center gap-2 disabled:opacity-70"
          >
            <Loader2 v-if="submitting" class="w-4 h-4 animate-spin" />
            <span v-else class="flex items-center gap-2">ثبت دیدگاه <Send class="w-4 h-4 rotate-180" /></span>
          </button>
        </div>

        <div v-else class="text-center py-10 bg-white/5 rounded-2xl border border-white/10">
          <User class="w-12 h-12 mx-auto text-stone-500 mb-4" />
          <p class="text-stone-300 mb-6 text-sm font-bold">برای ثبت نظر ابتدا وارد شوید</p>
          <router-link to="/login" class="inline-block bg-white text-stone-900 px-8 py-3 rounded-xl text-sm font-bold hover:bg-stone-200 transition">
            ورود / ثبت نام
          </router-link>
        </div>
      </div>
    </div>

  </div>
</template>