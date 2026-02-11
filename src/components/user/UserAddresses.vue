<script setup lang="ts">
import { MapPin, Plus, Home, Briefcase, Trash2 } from 'lucide-vue-next'

defineProps<{
  addresses: any[]
}>()

const emit = defineEmits(['add', 'delete'])
</script>

<template>
  <div class="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 min-h-[400px]">
    <div class="flex justify-between items-center mb-6 border-b border-stone-100 pb-4">
      <h3 class="font-bold text-lg flex items-center gap-2">
        <MapPin class="w-5 h-5 text-accent" />
        مدیریت آدرس‌ها
      </h3>
      <button @click="emit('add')" class="bg-stone-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-accent transition flex items-center gap-2">
        <Plus class="w-4 h-4" /> افزودن آدرس
      </button>
    </div>

    <div v-if="addresses.length === 0" class="text-center py-12 text-stone-400 bg-stone-50 rounded-xl border border-dashed border-stone-200">
      هنوز آدرسی ثبت نکرده‌اید.
    </div>

    <div v-else class="grid md:grid-cols-2 gap-4">
      <div v-for="addr in addresses" :key="addr.id" class="border border-stone-200 rounded-xl p-5 hover:border-stone-400 transition bg-white relative group">
        <div class="flex items-center gap-2 mb-3">
          <span class="bg-stone-100 text-stone-700 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
            <Home v-if="addr.title === 'منزل'" class="w-3 h-3" />
            <Briefcase v-else-if="addr.title === 'محل کار'" class="w-3 h-3" />
            <MapPin v-else class="w-3 h-3" />
            {{ addr.title }}
          </span>
        </div>
        <p class="text-stone-600 text-sm leading-relaxed mb-4 h-14 line-clamp-2">{{ addr.address }}</p>
        <div class="flex justify-between items-center text-xs text-stone-500 border-t border-stone-50 pt-3">
          <span>کد پستی: {{ addr.postal_code || '---' }}</span>
          <span>{{ addr.phone }}</span>
        </div>
        <button @click="emit('delete', addr.id)" class="absolute top-4 left-4 text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition opacity-0 group-hover:opacity-100">
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>