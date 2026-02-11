<script setup lang="ts">
import { useToastStore } from '@/stores/toast'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-vue-next'

const toastStore = useToastStore()

const getIcon = (type: string) => {
  switch (type) {
    case 'success': return CheckCircle2
    case 'error': return XCircle
    case 'warning': return AlertTriangle
    default: return Info
  }
}

const getClasses = (type: string) => {
  switch (type) {
    case 'success': return 'bg-white border-l-4 border-green-500 text-stone-800'
    case 'error': return 'bg-white border-l-4 border-red-500 text-stone-800'
    case 'warning': return 'bg-white border-l-4 border-yellow-500 text-stone-800'
    default: return 'bg-white border-l-4 border-blue-500 text-stone-800'
  }
}

const getIconColor = (type: string) => {
  switch (type) {
    case 'success': return 'text-green-500'
    case 'error': return 'text-red-500'
    case 'warning': return 'text-yellow-500'
    default: return 'text-blue-500'
  }
}
</script>

<template>
  <div class="fixed top-4 left-4 z-[100] flex flex-col gap-3 w-full max-w-sm pointer-events-none px-4 md:px-0">
    <TransitionGroup name="toast">
      <div 
        v-for="toast in toastStore.toasts" 
        :key="toast.id"
        class="pointer-events-auto shadow-lg rounded-lg p-4 flex items-start gap-3 transform transition-all duration-300 ease-out border border-stone-100"
        :class="getClasses(toast.type)"
      >
        <component :is="getIcon(toast.type)" class="w-6 h-6 shrink-0 mt-0.5" :class="getIconColor(toast.type)" />
        
        <div class="flex-grow text-sm font-medium leading-relaxed">
          {{ toast.message }}
        </div>

        <button @click="toastStore.removeToast(toast.id)" class="text-stone-400 hover:text-stone-600 transition">
          <X class="w-4 h-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.4s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
</style>