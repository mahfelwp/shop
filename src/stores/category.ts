import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export interface Category {
  id: number
  title: string
  image: string
  slug?: string
  created_at?: string
}

export const useCategoryStore = defineStore('category', () => {
  const categories = ref<Category[]>([])
  const loading = ref(false)

  const fetchCategories = async () => {
    loading.value = true
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) {
      categories.value = data
    }
    loading.value = false
  }

  const addCategory = async (category: { title: string, image: string }) => {
    const { data, error } = await supabase
      .from('categories')
      .insert([category])
      .select()
      .single()
    
    if (data) {
      categories.value.unshift(data)
      return null
    }
    return error
  }

  const updateCategory = async (id: number, updates: { title: string, image?: string }) => {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (data) {
      const index = categories.value.findIndex(c => c.id === id)
      if (index !== -1) {
        categories.value[index] = data
      }
      return null
    }
    return error
  }

  const deleteCategory = async (id: number) => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
    
    if (!error) {
      categories.value = categories.value.filter(c => c.id !== id)
    }
    return error
  }

  return { categories, loading, fetchCategories, addCategory, updateCategory, deleteCategory }
})