<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCommentStore } from '@/stores/comment'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { Star, User, MessageSquare, Send, Loader2, Quote } from 'lucide-vue-next'
 
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
  <div class="bg-white rounded-[2.5rem] p-8 md:p-12 border border-stone-100 shadow-sm mt-12">
    <div class="flex items-center justify-between mb-10">
      <h3 class="text-2xl font-black text-stone-900 flex items-center gap-3">
        <div class="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-700">
          <MessageSquare class="w-6 h-6" />
        </div>
        نظرات کاربران
      </h3>
      <span class="text-sm font-bold text-stone-500 bg-stone-50 px-4 py-2 rounded-full border border-stone-100">
        {{ commentStore.comments.length }} دیدگاه ثبت شده
      </span>
    </div>
 
    <div class="grid lg:grid-cols-12 gap-12">
      
      <!-- Comment Form (Left Side) -->
      <div class="lg:col-span-5 order-2 lg:order-1">
        <div class="bg-stone-900 p-8 rounded-[2rem] text-white relative overflow-hidden shadow-xl">
          <!-- Decorative Elements -->
          <div class="absolute top-0 right-0 w-32 h-32 bg-accent rounded-full blur-[80px] opacity-20"></div>
          <div class="absolute bottom-0 left-0 w-32 h-32 bg-blue-500 rounded-full blur-[80px] opacity-20"></div>
          
          <div class="relative z-10">
            <h4 class="font-black text-xl mb-2">دیدگاه خود را بنویسید</h4>
            <p class="text-stone-400 text-sm mb-8">نظر شما به انتخاب سایر کاربران کمک می‌کند.</p>
            
            <div v-if="authStore.isAuthenticated">
              <div class="mb-6">
                <label class="block text-xs font-bold text-stone-400 mb-3 uppercase tracking-wider">امتیاز شما</label>
                <div class="flex gap-2 bg-white/5 p-3 rounded-2xl w-fit backdrop-blur-sm border border-white/10">
                  <button 
                    v-for="i in 5" 
                    :key="i" 
                    @click="newRating = i"
                    class="transition hover:scale-110 focus:outline-none"
                  >
                    <Star 
                      class="w-8 h-8 transition-all duration-300" 
                      :class="i <= newRating ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 'text-stone-600'" 
                    />
                  </button>
                </div>
              </div>
 
              <div class="mb-6">
                <label class="block text-xs font-bold text-stone-400 mb-3 uppercase tracking-wider">متن نظر</label>
                <textarea 
                  v-model="newComment" 
                  rows="5" 
                  class="w-full p-4 rounded-2xl bg-white/10 border border-white/10 focus:border-accent focus:bg-white/20 outline-none transition text-white placeholder-stone-500 resize-none leading-relaxed"
                  placeholder="نظر خود را درباره نقاط قوت و ضعف این محصول بنویسید..."
                ></textarea>
              </div>
 
              <button 
                @click="submitComment" 
                :disabled="submitting"
                class="w-full bg-white text-stone-900 py-4 rounded-xl font-black hover:bg-accent hover:text-white transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg"
              >
                <Loader2 v-if="submitting" class="w-5 h-5 animate-spin" />
                <span v-else>ثبت دیدگاه</span>
                <Send v-if="!submitting" class="w-4 h-4" />
              </button>
            </div>
 
            <div v-else class="text-center py-12 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
              <User class="w-12 h-12 mx-auto text-stone-500 mb-4" />
              <p class="text-stone-300 mb-6 font-medium">برای ثبت نظر باید وارد حساب کاربری خود شوید.</p>
              <router-link to="/login" class="inline-block bg-white text-stone-900 px-8 py-3 rounded-xl font-bold hover:bg-stone-200 transition shadow-lg">
                ورود / ثبت نام
              </router-link>
            </div>
          </div>
        </div>
      </div>
 
      <!-- Comments List (Right Side) -->
      <div class="lg:col-span-7 order-1 lg:order-2">
        <div v-if="commentStore.loading" class="text-center py-20">
          <Loader2 class="w-10 h-10 animate-spin mx-auto text-stone-300" />
        </div>
 
        <div v-else-if="commentStore.comments.length === 0" class="text-center py-20 bg-stone-50 rounded-[2rem] border border-dashed border-stone-200 h-full flex flex-col items-center justify-center">
          <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 text-stone-300">
            <MessageSquare class="w-8 h-8" />
          </div>
          <p class="text-stone-500 font-bold text-lg">هنوز نظری ثبت نشده است</p>
          <p class="text-stone-400 text-sm mt-2">اولین نفری باشید که نظر می‌دهد!</p>
        </div>
 
        <div v-else class="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          <div v-for="comment in commentStore.comments" :key="comment.id" class="bg-stone-50 p-6 rounded-[2rem] border border-stone-100 hover:border-stone-200 transition-colors duration-300">
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-stone-500 shadow-sm border border-stone-100 font-bold text-lg">
                  {{ comment.profiles?.full_name ? comment.profiles.full_name.charAt(0) : 'U' }}
                </div>
                <div>
                  <div class="font-bold text-stone-800 text-base">{{ comment.profiles?.full_name || 'کاربر ناشناس' }}</div>
                  <div class="text-xs text-stone-400 mt-1 font-medium">{{ formatDate(comment.created_at) }}</div>
                </div>
              </div>
              <div class="flex gap-1 bg-white px-3 py-1.5 rounded-full border border-stone-100 shadow-sm">
                <Star 
                  v-for="i in 5" 
                  :key="i" 
                  class="w-3.5 h-3.5" 
                  :class="i <= comment.rating ? 'fill-yellow-400 text-yellow-400' : 'text-stone-200'" 
                />
              </div>
            </div>
            
            <div class="relative pl-8">
              <Quote class="w-8 h-8 text-stone-200 absolute -top-2 -right-2 transform -scale-x-100" />
              <p class="text-stone-600 leading-loose text-sm font-medium text-justify relative z-10">
                {{ comment.content }}
              </p>
            </div>
          </div>
        </div>
      </div>
 
    </div>
  </div>
</template>
 
<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #e7e5e4;
  border-radius: 20px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: #d6d3d1;
}
</style>