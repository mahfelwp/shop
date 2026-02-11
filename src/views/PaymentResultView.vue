<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { CheckCircle2, XCircle, ArrowRight, Home, Clock } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const isSuccess = route.query.status === 'success'
const orderId = route.query.orderId
const method = route.query.method // 'online' or 'card_to_card'
</script>

<template>
  <div class="min-h-[70vh] flex items-center justify-center px-4">
    <div class="bg-white w-full max-w-md p-8 rounded-3xl shadow-xl border text-center" :class="isSuccess ? 'border-green-100' : 'border-red-100'">
      
      <div v-if="isSuccess">
        <!-- Online Success -->
        <div v-if="method === 'online'">
          <div class="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 class="w-10 h-10" />
          </div>
          <h1 class="text-2xl font-bold text-gray-800 mb-2">پرداخت موفقیت‌آمیز بود</h1>
          <p class="text-gray-500 mb-6">سفارش شما با شماره <span class="font-mono font-bold text-gray-800">#{{ orderId }}</span> ثبت شد و به زودی پردازش می‌شود.</p>
        </div>

        <!-- Card to Card Success (Pending Approval) -->
        <div v-else>
          <div class="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock class="w-10 h-10" />
          </div>
          <h1 class="text-2xl font-bold text-gray-800 mb-2">سفارش ثبت شد</h1>
          <p class="text-gray-500 mb-6">سفارش <span class="font-mono font-bold text-gray-800">#{{ orderId }}</span> با موفقیت ثبت شد. پس از تایید فیش واریزی توسط کارشناسان، وضعیت سفارش به "پرداخت شده" تغییر خواهد کرد.</p>
        </div>
        
        <div class="bg-gray-50 p-4 rounded-xl text-sm text-gray-600 mb-8">
          از خرید شما سپاسگزاریم. می‌توانید وضعیت سفارش را از پنل کاربری پیگیری کنید.
        </div>
      </div>

      <!-- Failure -->
      <div v-else>
        <div class="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle class="w-10 h-10" />
        </div>
        <h1 class="text-2xl font-bold text-gray-800 mb-2">پرداخت ناموفق بود</h1>
        <p class="text-gray-500 mb-6">متاسفانه عملیات پرداخت با خطا مواجه شد یا توسط شما لغو گردید.</p>
        
        <div class="bg-gray-50 p-4 rounded-xl text-sm text-gray-600 mb-8">
          چنانچه مبلغی از حساب شما کسر شده است، طی ۷۲ ساعت آینده به حساب شما بازخواهد گشت.
        </div>
      </div>

      <div class="space-y-3">
        <button 
          v-if="!isSuccess"
          @click="router.push('/checkout')"
          class="w-full bg-primary-600 text-white py-3 rounded-xl font-medium hover:bg-primary-700 transition"
        >
          تلاش مجدد برای پرداخت
        </button>
        
        <router-link 
          to="/profile"
          class="w-full block bg-stone-900 text-white py-3 rounded-xl font-medium hover:bg-stone-800 transition flex items-center justify-center gap-2"
        >
          پیگیری سفارش در پروفایل
        </router-link>

        <router-link 
          to="/"
          class="w-full block bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2"
        >
          <Home class="w-4 h-4" />
          بازگشت به صفحه اصلی
        </router-link>
      </div>

    </div>
  </div>
</template>