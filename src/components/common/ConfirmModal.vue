<script setup lang="ts">
import { AlertTriangle, X } from 'lucide-vue-next'

defineProps<{
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
  loading?: boolean
}>()

const emit = defineEmits(['confirm', 'cancel'])
</script>

<template>
  <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
    <div class="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
      
      <!-- Header -->
      <div class="p-6 text-center">
        <div class="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4" v-if="type === 'danger' || !type">
          <AlertTriangle class="w-8 h-8" />
        </div>
        <div class="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4" v-else>
          <AlertTriangle class="w-8 h-8" />
        </div>

        <h3 class="text-xl font-bold text-stone-800 mb-2">{{ title }}</h3>
        <p class="text-stone-500 text-sm leading-relaxed">{{ message }}</p>
      </div>

      <!-- Actions -->
      <div class="bg-stone-50 p-4 flex gap-3 border-t border-stone-100">
        <button 
          @click="emit('cancel')" 
          class="flex-1 py-3 rounded-xl font-bold text-stone-600 hover:bg-stone-200 transition"
        >
          {{ cancelText || 'انصراف' }}
        </button>
        
        <button 
          @click="emit('confirm')" 
          :disabled="loading"
          class="flex-1 py-3 rounded-xl font-bold text-white transition flex items-center justify-center gap-2 disabled:opacity-70"
          :class="type === 'info' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-500 hover:bg-red-600'"
        >
          <span v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          <span v-else>{{ confirmText || 'تایید حذف' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>