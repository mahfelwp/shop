<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCouponStore } from '@/stores/coupon'
import { useToastStore } from '@/stores/toast'
import { BadgePercent, Plus, Trash2, Loader2, Calendar, Hash, DollarSign, Percent } from 'lucide-vue-next'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
 
const couponStore = useCouponStore()
const toastStore = useToastStore()
 
const form = ref({
  code: '',
  discount_type: 'percent', // 'percent' | 'fixed'
  amount: '',
  min_order_amount: 0,
  expires_at: '',
  usage_limit: null as number | null
})
 
const submitting = ref(false)
const showDeleteModal = ref(false)
const itemToDelete = ref<number | null>(null)
const deleteLoading = ref(false)
 
onMounted(() => {
  couponStore.fetchCoupons()
})
 
const generateCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  form.value.code = result
}
 
const handleSubmit = async () => {
  if (!form.value.code || !form.value.amount) {
    toastStore.showToast('کد تخفیف و مقدار آن الزامی است', 'warning')
    return
  }
 
  submitting.value = true
  try {
    const error = await couponStore.createCoupon({
      code: form.value.code.toUpperCase(),
      discount_type: form.value.discount_type,
      amount: parseFloat(form.value.amount),
      min_order_amount: form.value.min_order_amount,
      expires_at: form.value.expires_at || null,
      usage_limit: form.value.usage_limit
    })
 
    if (!error) {
      toastStore.showToast('کد تخفیف با موفقیت ایجاد شد', 'success')
      // Reset Form
      form.value = {
        code: '',
        discount_type: 'percent',
        amount: '',
        min_order_amount: 0,
        expires_at: '',
        usage_limit: null
      }
    } else {
      if (error.code === '23505') {
        toastStore.showToast('این کد تخفیف تکراری است', 'error')
      } else {
        toastStore.showToast('خطا در ایجاد کد تخفیف', 'error')
      }
    }
  } catch (e) {
    console.error(e)
  } finally {
    submitting.value = false
  }
}
 
const confirmDelete = (id: number) => {
  itemToDelete.value = id
  showDeleteModal.value = true
}
 
const handleDelete = async () => {
  if (!itemToDelete.value) return
  
  deleteLoading.value = true
  const error = await couponStore.deleteCoupon(itemToDelete.value)
  
  if (!error) {
    toastStore.showToast('کد تخفیف حذف شد', 'success')
    showDeleteModal.value = false
  } else {
    toastStore.showToast('خطا در حذف', 'error')
  }
  deleteLoading.value = false
}
 
const formatDate = (dateString: string | null) => {
  if (!dateString) return 'نامحدود'
  return new Date(dateString).toLocaleDateString('fa-IR')
}
</script>
 
<template>
  <div class="grid lg:grid-cols-3 gap-8 animate-fade-in">
    
    <!-- Form Section -->
    <div class="lg:col-span-1">
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 sticky top-24">
        <h3 class="font-bold text-lg mb-6 flex items-center gap-2">
          <Plus class="w-5 h-5 text-indigo-600" />
          ایجاد کد تخفیف جدید
        </h3>
        
        <div class="space-y-4">
          <!-- Code Input -->
          <div>
            <label class="block text-sm font-bold text-stone-700 mb-2">کد تخفیف</label>
            <div class="relative">
              <input 
                v-model="form.code" 
                type="text" 
                class="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 focus:border-indigo-600 outline-none font-mono uppercase placeholder:normal-case" 
                placeholder="مثلا: SUMMER20" 
              />
              <button 
                @click="generateCode"
                class="absolute left-2 top-2 p-1.5 bg-stone-100 hover:bg-stone-200 rounded-lg text-xs font-bold text-stone-600 transition"
                title="تولید کد تصادفی"
              >
                <Hash class="w-4 h-4" />
              </button>
            </div>
          </div>
 
          <!-- Type & Amount -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-bold text-stone-700 mb-2">نوع تخفیف</label>
              <select v-model="form.discount_type" class="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-indigo-600 outline-none bg-white">
                <option value="percent">درصدی (%)</option>
                <option value="fixed">مبلغ ثابت (تومان)</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-bold text-stone-700 mb-2">مقدار</label>
              <div class="relative">
                <input 
                  v-model="form.amount" 
                  type="number" 
                  class="w-full pl-8 pr-4 py-3 rounded-xl border border-stone-200 focus:border-indigo-600 outline-none" 
                  placeholder="0"
                />
                <Percent v-if="form.discount_type === 'percent'" class="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
                <DollarSign v-else class="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
              </div>
            </div>
          </div>
 
          <!-- Conditions -->
          <div>
            <label class="block text-sm font-bold text-stone-700 mb-2">حداقل خرید (تومان)</label>
            <input 
              v-model="form.min_order_amount" 
              type="number" 
              class="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-indigo-600 outline-none" 
              placeholder="0 برای بدون محدودیت"
            />
          </div>
 
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-bold text-stone-700 mb-2">تعداد مجاز</label>
              <input 
                v-model="form.usage_limit" 
                type="number" 
                class="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-indigo-600 outline-none" 
                placeholder="نامحدود"
              />
            </div>
            <div>
              <label class="block text-sm font-bold text-stone-700 mb-2">تاریخ انقضا</label>
              <div class="relative">
                <input 
                  v-model="form.expires_at" 
                  type="date" 
                  class="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-indigo-600 outline-none text-sm" 
                />
              </div>
            </div>
          </div>
 
          <button 
            @click="handleSubmit" 
            :disabled="submitting"
            class="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg shadow-indigo-200"
          >
            <Loader2 v-if="submitting" class="w-5 h-5 animate-spin" />
            <span v-else>ایجاد کد تخفیف</span>
          </button>
        </div>
      </div>
    </div>
 
    <!-- List Section -->
    <div class="lg:col-span-2">
      <div class="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
        <div class="p-6 border-b border-stone-100 flex justify-between items-center">
          <span class="font-bold text-lg flex items-center gap-2">
            <BadgePercent class="w-5 h-5 text-stone-400" />
            لیست کدهای فعال
          </span>
          <button @click="couponStore.fetchCoupons" class="text-sm text-indigo-600 hover:underline">بروزرسانی</button>
        </div>
        
        <div v-if="couponStore.loading" class="p-12 text-center text-stone-400">
          <Loader2 class="w-8 h-8 animate-spin mx-auto mb-2" />
          در حال دریافت...
        </div>
 
        <div v-else-if="couponStore.coupons.length === 0" class="p-12 text-center text-stone-400">
          هیچ کد تخفیفی تعریف نشده است.
        </div>
 
        <div v-else class="overflow-x-auto">
          <table class="w-full text-right">
            <thead class="bg-stone-50 text-stone-500 text-xs uppercase font-bold">
              <tr>
                <th class="p-4">کد تخفیف</th>
                <th class="p-4">مقدار</th>
                <th class="p-4">شرایط</th>
                <th class="p-4">انقضا</th>
                <th class="p-4">استفاده</th>
                <th class="p-4">عملیات</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-100">
              <tr v-for="coupon in couponStore.coupons" :key="coupon.id" class="hover:bg-stone-50 transition">
                <td class="p-4">
                  <div class="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded w-fit tracking-wider border border-indigo-100">
                    {{ coupon.code }}
                  </div>
                </td>
                <td class="p-4 font-bold text-stone-800">
                  <span v-if="coupon.discount_type === 'percent'">{{ coupon.amount }}%</span>
                  <span v-else>{{ coupon.amount.toLocaleString() }} ت</span>
                </td>
                <td class="p-4 text-xs text-stone-500">
                  <div v-if="coupon.min_order_amount > 0">حداقل خرید: {{ coupon.min_order_amount.toLocaleString() }}</div>
                  <div v-else>بدون محدودیت خرید</div>
                </td>
                <td class="p-4 text-sm">
                  <div class="flex items-center gap-1" :class="coupon.expires_at && new Date(coupon.expires_at) < new Date() ? 'text-red-500 font-bold' : 'text-stone-600'">
                    <Calendar class="w-3 h-3" />
                    {{ formatDate(coupon.expires_at) }}
                  </div>
                </td>
                <td class="p-4 text-sm text-stone-600">
                  {{ coupon.used_count }} / {{ coupon.usage_limit || '∞' }}
                </td>
                <td class="p-4">
                  <button 
                    @click="confirmDelete(coupon.id)" 
                    class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                    title="حذف"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
 
    <!-- Custom Confirm Modal -->
    <ConfirmModal 
      v-if="showDeleteModal"
      title="حذف کد تخفیف"
      message="آیا از حذف این کد تخفیف اطمینان دارید؟"
      confirmText="بله، حذف شود"
      type="danger"
      :loading="deleteLoading"
      @confirm="handleDelete"
      @cancel="showDeleteModal = false"
    />
 
  </div>
</template>