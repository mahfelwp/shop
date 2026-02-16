import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

export interface Comment {
  id: number
  created_at: string
  user_id: string
  product_id: number
  content: string
  rating: number
  status: 'pending' | 'approved' | 'rejected'
  profiles?: {
    full_name: string
  }
  products?: {
    title: string
    image: string
  }
}

export const useCommentStore = defineStore('comment', () => {
  const comments = ref<Comment[]>([])
  const loading = ref(false)
  const authStore = useAuthStore()

  // دریافت نظرات تایید شده برای یک محصول (Public)
  const fetchProductComments = async (productId: number) => {
    loading.value = true
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles (full_name)
      `)
      .eq('product_id', productId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
    
    if (data) {
      comments.value = data
    }
    loading.value = false
    return error
  }

  // ثبت نظر جدید (User)
  const addComment = async (productId: number, content: string, rating: number) => {
    if (!authStore.user) return { error: 'User not logged in' }
    
    const { data, error } = await supabase
      .from('comments')
      .insert({
        user_id: authStore.user.id,
        product_id: productId,
        content,
        rating,
        status: 'pending' // پیش‌فرض
      })
      .select()
      .single()
      
    return { data, error }
  }

  // دریافت همه نظرات برای ادمین (Admin)
  const fetchAllComments = async () => {
    loading.value = true
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles (full_name),
        products (title, image)
      `)
      .order('created_at', { ascending: false })
    
    if (data) {
      comments.value = data
    }
    loading.value = false
    return error
  }

  // تغییر وضعیت نظر (Admin)
  const updateStatus = async (id: number, status: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('comments')
      .update({ status })
      .eq('id', id)
    
    if (!error) {
      const index = comments.value.findIndex(c => c.id === id)
      if (index !== -1) {
        comments.value[index].status = status
      }
    }
    return error
  }

  // حذف نظر (Admin)
  const deleteComment = async (id: number) => {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id)
    
    if (!error) {
      comments.value = comments.value.filter(c => c.id !== id)
    }
    return error
  }

  return { 
    comments, 
    loading, 
    fetchProductComments, 
    addComment, 
    fetchAllComments, 
    updateStatus, 
    deleteComment 
  }
})