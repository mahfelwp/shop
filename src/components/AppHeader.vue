<script setup lang="ts">
import { ShoppingBag, User, Menu, Search, X } from 'lucide-vue-next'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { ref, onMounted, onUnmounted } from 'vue'

const cartStore = useCartStore()
const authStore = useAuthStore()
const router = useRouter()
const isScrolled = ref(false)
const mobileMenuOpen = ref(false)

const handleScroll = () => {
  isScrolled.value = window.scrollY > 20
}

onMounted(() => window.addEventListener('scroll', handleScroll))
onUnmounted(() => window.removeEventListener('scroll', handleScroll))
</script>

<template>
  <!-- هدر شناور و مدرن -->
  <header 
    class="fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-4 md:px-8"
    :class="isScrolled ? 'py-2' : 'py-6'"
  >
    <div 
      class="max-w-7xl mx-auto flex items-center justify-between transition-all duration-500 rounded-full px-6"
      :class="isScrolled ? 'bg-white/80 backdrop-blur-xl shadow-lg border border-white/20 py-3' : 'bg-transparent py-2'"
    >
      
      <!-- Logo -->
      <router-link to="/" class="text-2xl font-black tracking-tighter flex items-center gap-2 z-50 relative group">
        <div class="w-10 h-10 bg-stone-900 text-white rounded-full flex items-center justify-center text-lg font-serif group-hover:rotate-12 transition duration-300">H</div>
        <span class="text-stone-900 tracking-tight">HASIR<span class="text-accent">BAF</span></span>
      </router-link>

      <!-- Desktop Nav (Centered & Minimal) -->
      <nav class="hidden md:flex items-center gap-8">
        <router-link to="/" class="text-stone-600 hover:text-stone-900 font-bold text-sm tracking-wide transition relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-accent after:transition-all hover:after:w-full">خانه</router-link>
        <router-link to="/products" class="text-stone-600 hover:text-stone-900 font-bold text-sm tracking-wide transition relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-accent after:transition-all hover:after:w-full">کلکسیون‌ها</router-link>
        <a href="#" class="text-stone-600 hover:text-stone-900 font-bold text-sm tracking-wide transition relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-accent after:transition-all hover:after:w-full">داستان ما</a>
        <a href="#" class="text-stone-600 hover:text-stone-900 font-bold text-sm tracking-wide transition relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-accent after:transition-all hover:after:w-full">تماس</a>
      </nav>

      <!-- Actions -->
      <div class="flex items-center gap-3 z-50">
        <button class="w-10 h-10 rounded-full hover:bg-stone-100 flex items-center justify-center transition text-stone-700">
          <Search class="w-5 h-5" />
        </button>
        
        <!-- اصلاح لینک پروفایل: اگر لاگین بود به پروفایل برود، اگر نه به لاگین -->
        <router-link 
          :to="authStore.isAuthenticated ? '/profile' : '/login'" 
          class="w-10 h-10 rounded-full hover:bg-stone-100 flex items-center justify-center transition text-stone-700 relative"
        >
          <User class="w-5 h-5" />
          <span v-if="authStore.isAuthenticated" class="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full border border-white"></span>
        </router-link>

        <button @click="router.push('/cart')" class="w-10 h-10 rounded-full bg-stone-900 text-white hover:bg-stone-800 flex items-center justify-center transition relative shadow-lg shadow-stone-900/20 hover:scale-105 active:scale-95">
          <ShoppingBag class="w-5 h-5" />
          <span v-if="cartStore.totalItems > 0" class="absolute -top-1 -right-1 bg-accent text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white animate-bounce">
            {{ cartStore.totalItems }}
          </span>
        </button>

        <!-- Mobile Menu Toggle -->
        <button @click="mobileMenuOpen = !mobileMenuOpen" class="md:hidden w-10 h-10 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-700">
          <Menu v-if="!mobileMenuOpen" />
          <X v-else />
        </button>
      </div>
    </div>

    <!-- Mobile Menu Overlay -->
    <div v-if="mobileMenuOpen" class="fixed inset-0 bg-stone-50/95 backdrop-blur-xl z-40 flex flex-col items-center justify-center gap-8 md:hidden animate-fade-in">
      <router-link @click="mobileMenuOpen = false" to="/" class="text-3xl font-black text-stone-800 hover:text-accent transition">خانه</router-link>
      <router-link @click="mobileMenuOpen = false" to="/products" class="text-3xl font-black text-stone-800 hover:text-accent transition">محصولات</router-link>
      <router-link @click="mobileMenuOpen = false" :to="authStore.isAuthenticated ? '/profile' : '/login'" class="text-3xl font-black text-stone-800 hover:text-accent transition">
        {{ authStore.isAuthenticated ? 'حساب کاربری' : 'ورود / ثبت نام' }}
      </router-link>
      <a href="#" class="text-3xl font-black text-stone-800 hover:text-accent transition">تماس با ما</a>
    </div>
  </header>
</template>