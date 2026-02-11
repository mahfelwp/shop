<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  initialData: { full_name: string, phone: string }
}>()

const emit = defineEmits(['close', 'save'])

const form = ref({ ...props.initialData })

const submit = () => {
  emit('save', form.value)
}
</script>

<template>
  <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white w-full max-w-md rounded-2xl p-6 animate-scale-in">
      <h3 class="font-bold text-lg mb-6">ویرایش مشخصات</h3>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-bold text-stone-700 mb-2">نام و نام خانوادگی</label>
          <input v-model="form.full_name" type="text" class="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-stone-900 outline-none" />
        </div>
        <div>
          <label class="block text-sm font-bold text-stone-700 mb-2">شماره موبایل</label>
          <input v-model="form.phone" type="text" class="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-stone-900 outline-none bg-stone-50" readonly />
        </div>
        <div class="flex gap-3 pt-4">
          <button @click="submit" class="flex-1 bg-stone-900 text-white py-3 rounded-xl font-bold hover:bg-accent transition">ذخیره</button>
          <button @click="emit('close')" class="flex-1 bg-stone-100 text-stone-700 py-3 rounded-xl font-bold hover:bg-stone-200 transition">انصراف</button>
        </div>
      </div>
    </div>
  </div>
</template>