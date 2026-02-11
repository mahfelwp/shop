<script setup lang="ts">
import { useCartStore } from '@/stores/cart'
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const cartStore = useCartStore()
const router = useRouter()
</script>

<template>
  <div class="container mx-auto px-4 py-12 min-h-[60vh]">
    <h1 class="text-3xl font-black text-stone-900 mb-8 flex items-center gap-3">
      <ShoppingBag class="w-8 h-8" />
      سبد خرید شما
      <span v-if="cartStore.totalItems > 0" class="text-sm font-medium text-white bg-accent px-3 py-1 rounded-full shadow-md">{{ cartStore.totalItems }} کالا</span>
    </h1>

    <!-- Empty State -->
    <div v-if="cartStore.items.length === 0" class="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-stone-200">
      <div class="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center mb-6 text-stone-400">
        <ShoppingBag class="w-10 h-10" />
      </div>
      <h2 class="text-xl font-bold text-stone-800 mb-2">سبد خرید شما خالی است</h2>
      <p class="text-stone-500 mb-8">به نظر می‌رسد هنوز محصولی انتخاب نکرده‌اید.</p>
      <router-link to="/products" class="bg-stone-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-accent transition duration-300 flex items-center gap-2 shadow-lg">
        مشاهده محصولات
        <ArrowLeft class="w-4 h-4" />
      </router-link>
    </div>

    <!-- Cart Content -->
    <div v-else class="grid lg:grid-cols-12 gap-8">
      
      <!-- Cart Items List -->
      <div class="lg:col-span-8 space-y-4">
        <div v-for="item in cartStore.items" :key="item.id" class="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row gap-6 items-center">
          
          <!-- Image -->
          <div class="w-full sm:w-32 h-32 bg-stone-100 rounded-xl overflow-hidden flex-shrink-0 border border-stone-200">
            <img :src="item.image" :alt="item.title" class="w-full h-full object-cover" />
          </div>
          
          <!-- Details -->
          <div class="flex-grow text-center sm:text-right w-full">
            <h3 class="font-bold text-stone-900 text-lg mb-1">{{ item.title }}</h3>
            <div class="text-sm text-stone-500 mb-3">{{ item.category }}</div>
            <div class="text-stone-900 font-black text-xl">
              {{ item.price.toLocaleString() }} <span class="text-xs font-normal text-stone-500">تومان</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-row sm:flex-col items-center gap-4 w-full sm:w-auto justify-between sm:justify-center">
            
            <!-- Quantity Control -->
            <div class="flex items-center bg-stone-50 rounded-lg border border-stone-200 overflow-hidden">
              <button @click="cartStore.addItem(item)" class="p-2 hover:bg-stone-200 text-stone-700 transition">
                <Plus class="w-4 h-4" />
              </button>
              <span class="w-10 text-center font-bold text-stone-800">{{ item.quantity }}</span>
              <button @click="cartStore.decreaseItem(item.id)" class="p-2 hover:bg-stone-200 text-stone-700 transition">
                <Minus class="w-4 h-4" />
              </button>
            </div>

            <!-- Remove Button -->
            <button @click="cartStore.removeItem(item.id)" class="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition flex items-center gap-1 text-sm">
              <Trash2 class="w-4 h-4" />
              <span class="sm:hidden">حذف</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Summary Sidebar -->
      <div class="lg:col-span-4">
        <div class="bg-white p-6 rounded-3xl border border-stone-100 shadow-lg sticky top-28">
          <h2 class="font-black text-xl mb-6 text-stone-900 border-b border-stone-100 pb-4">خلاصه سفارش</h2>
          
          <div class="space-y-4 mb-8">
            <div class="flex justify-between text-stone-600">
              <span>قیمت کالاها ({{ cartStore.totalItems }})</span>
              <span class="font-medium">{{ cartStore.totalPrice.toLocaleString() }} تومان</span>
            </div>
            <div class="flex justify-between text-stone-600">
              <span>هزینه ارسال</span>
              <span class="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded">رایگان</span>
            </div>
            <div class="flex justify-between text-stone-600">
              <span>تخفیف</span>
              <span class="text-stone-400">۰ تومان</span>
            </div>
            
            <div class="border-t-2 border-dashed border-stone-200 my-4"></div>
            
            <div class="flex justify-between items-center">
              <span class="font-bold text-stone-800">مبلغ قابل پرداخت</span>
              <span class="font-black text-2xl text-accent">{{ cartStore.totalPrice.toLocaleString() }} <span class="text-xs font-normal text-stone-500">تومان</span></span>
            </div>
          </div>

          <button 
            @click="router.push('/checkout')"
            class="w-full bg-stone-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-accent hover:shadow-xl hover:shadow-accent/20 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 group"
          >
            ادامه جهت تسویه حساب
            <ArrowLeft class="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          
          <div class="mt-4 flex items-center justify-center gap-2 text-xs text-stone-400">
            <span class="w-2 h-2 bg-green-500 rounded-full"></span>
            تضمین امنیت پرداخت و اصالت کالا
          </div>
        </div>
      </div>
    </div>
  </div>
</template>