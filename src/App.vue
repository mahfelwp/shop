<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
import ToastNotification from '@/components/ToastNotification.vue'
import { Instagram, Send, Phone, Mail, MapPin, Heart } from 'lucide-vue-next'
import { useRoute } from 'vue-router'
import { useHead } from '@vueuse/head'

const route = useRoute()

// تنظیمات سئو کلی و الگوی عنوان
useHead({
  titleTemplate: (title) => title ? `${title} | فروشگاه حصیرباف` : 'فروشگاه صنایع دستی حصیرباف',
  meta: [
    { property: 'og:site_name', content: 'فروشگاه حصیرباف' },
    { property: 'og:locale', content: 'fa_IR' },
  ],
})
</script>

<template>
  <div class="min-h-screen flex flex-col font-sans">
    <!-- نمایش هدر فقط اگر در صفحه ادمین نباشیم -->
    <AppHeader v-if="!route.meta.hideLayout" />
    
    <ToastNotification />
    
    <main class="flex-grow">
      <router-view />
    </main>

    <!-- نمایش فوتر فقط اگر در صفحه ادمین نباشیم -->
    <footer v-if="!route.meta.hideLayout" class="bg-stone-900 text-stone-300 pt-16 pb-8 mt-auto border-t border-stone-800">
      <div class="container mx-auto px-4 md:px-8">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          <!-- ستون اول: درباره ما -->
          <div class="space-y-6">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 bg-white text-stone-900 rounded-full flex items-center justify-center text-lg font-serif font-bold">H</div>
              <span class="text-2xl font-black text-white tracking-tight">HASIR<span class="text-accent">BAF</span></span>
            </div>
            <p class="text-sm leading-7 opacity-80 text-justify">
              حصیرباف، پلی است میان دستان هنرمند بافندگان جنوب و خانه مدرن شما. ما متعهد به ارائه اصیل‌ترین صنایع دستی با مواد اولیه کاملاً طبیعی و پایدار هستیم.
            </p>
            <div class="flex gap-4">
              <a href="#" class="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center hover:bg-accent hover:text-white transition duration-300">
                <Instagram class="w-5 h-5" />
              </a>
              <a href="#" class="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center hover:bg-blue-500 hover:text-white transition duration-300">
                <Send class="w-5 h-5" />
              </a>
              <a href="#" class="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center hover:bg-red-600 hover:text-white transition duration-300">
                <Mail class="w-5 h-5" />
              </a>
            </div>
          </div>

          <!-- ستون دوم: دسترسی سریع -->
          <div>
            <h3 class="text-white font-bold text-lg mb-6 relative inline-block after:content-[''] after:absolute after:-bottom-2 after:right-0 after:w-8 after:h-1 after:bg-accent after:rounded-full">دسترسی سریع</h3>
            <ul class="space-y-3 text-sm">
              <li><router-link to="/products" class="hover:text-accent transition flex items-center gap-2"><span class="w-1 h-1 bg-stone-600 rounded-full"></span>فروشگاه</router-link></li>
              <li><a href="#" class="hover:text-accent transition flex items-center gap-2"><span class="w-1 h-1 bg-stone-600 rounded-full"></span>درباره ما</a></li>
              <li><a href="#" class="hover:text-accent transition flex items-center gap-2"><span class="w-1 h-1 bg-stone-600 rounded-full"></span>تماس با ما</a></li>
              <li><a href="#" class="hover:text-accent transition flex items-center gap-2"><span class="w-1 h-1 bg-stone-600 rounded-full"></span>وبلاگ آموزشی</a></li>
            </ul>
          </div>

          <!-- ستون سوم: خدمات مشتریان -->
          <div>
            <h3 class="text-white font-bold text-lg mb-6 relative inline-block after:content-[''] after:absolute after:-bottom-2 after:right-0 after:w-8 after:h-1 after:bg-accent after:rounded-full">خدمات مشتریان</h3>
            <ul class="space-y-3 text-sm">
              <li><a href="#" class="hover:text-accent transition flex items-center gap-2"><span class="w-1 h-1 bg-stone-600 rounded-full"></span>پیگیری سفارش</a></li>
              <li><a href="#" class="hover:text-accent transition flex items-center gap-2"><span class="w-1 h-1 bg-stone-600 rounded-full"></span>رویه بازگرداندن کالا</a></li>
              <li><a href="#" class="hover:text-accent transition flex items-center gap-2"><span class="w-1 h-1 bg-stone-600 rounded-full"></span>پرسش‌های متداول</a></li>
              <li><a href="#" class="hover:text-accent transition flex items-center gap-2"><span class="w-1 h-1 bg-stone-600 rounded-full"></span>حریم خصوصی</a></li>
            </ul>
          </div>

          <!-- ستون چهارم: تماس و نماد -->
          <div>
            <h3 class="text-white font-bold text-lg mb-6 relative inline-block after:content-[''] after:absolute after:-bottom-2 after:right-0 after:w-8 after:h-1 after:bg-accent after:rounded-full">اطلاعات تماس</h3>
            <ul class="space-y-4 text-sm mb-6">
              <li class="flex items-start gap-3">
                <MapPin class="w-5 h-5 text-accent shrink-0" />
                <span>تهران، خیابان ولیعصر، بالاتر از پارک ساعی، کوچه گل‌ها، پلاک ۱۲</span>
              </li>
              <li class="flex items-center gap-3">
                <Phone class="w-5 h-5 text-accent shrink-0" />
                <span dir="ltr">021 - 88 77 66 55</span>
              </li>
            </ul>
            <div class="flex gap-4">
              <div class="bg-white/5 border border-white/10 w-20 h-20 rounded-lg flex flex-col items-center justify-center hover:bg-white/10 transition cursor-pointer">
                <span class="text-[10px] text-stone-400">نماد اعتماد</span>
                <span class="font-bold text-white">E-Namad</span>
              </div>
              <div class="bg-white/5 border border-white/10 w-20 h-20 rounded-lg flex flex-col items-center justify-center hover:bg-white/10 transition cursor-pointer">
                <span class="text-[10px] text-stone-400">ساماندهی</span>
                <span class="font-bold text-white">Samandehi</span>
              </div>
            </div>
          </div>
        </div>

        <!-- کپی رایت -->
        <div class="border-t border-stone-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>تمامی حقوق مادی و معنوی این وبسایت متعلق به فروشگاه حصیرباف می‌باشد.</p>
          <div class="flex items-center gap-1">
            طراحی شده با <Heart class="w-3 h-3 text-red-500 fill-red-500" /> توسط تیم فنی
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>