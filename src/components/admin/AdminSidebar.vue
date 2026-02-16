<script setup lang="ts">
import { 
  LayoutDashboard, 
  ShoppingBag, 
  ShoppingCart, 
  Settings, 
  Users, 
  LogOut, 
  X,
  Package,
  BarChart3,
  ChevronRight,
  Layers,
  Globe,
  BadgePercent,
  MessageSquare
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useRoute } from 'vue-router'
 
defineProps<{
  isOpen: boolean
}>()
 
const emit = defineEmits(['close'])
const authStore = useAuthStore()
const route = useRoute()
 
const menuGroups = [
  {
    title: 'اصلی',
    items: [
      { routeName: 'admin-dashboard', label: 'داشبورد', icon: LayoutDashboard },
      { routeName: 'admin-analytics', label: 'آمار و گزارشات', icon: BarChart3 }
    ]
  },
  {
    title: 'فروشگاه',
    items: [
      { routeName: 'admin-products', label: 'محصولات', icon: ShoppingBag },
      { routeName: 'admin-categories', label: 'دسته‌بندی‌ها', icon: Layers },
      { routeName: 'admin-orders', label: 'سفارشات', icon: ShoppingCart },
      { routeName: 'admin-inventory', label: 'مدیریت موجودی', icon: Package },
      { routeName: 'admin-coupons', label: 'کدهای تخفیف', icon: BadgePercent},
      { routeName: 'admin-comments', label: 'نظرات کاربران', icon: MessageSquare}
    ]
  },
  {
    title: 'کاربران',
    items: [
      { routeName: 'admin-users', label: 'لیست مشتریان', icon: Users },
    ]
  },
  {
    title: 'سیستم',
    items: [
      { routeName: 'home', label: 'مشاهده فروشگاه', icon: Globe },
      { routeName: 'admin-settings', label: 'تنظیمات', icon: Settings },
    ]
  }
]
 
const isActive = (name: string) => route.name === name || (name === 'admin-products' && route.path.includes('/products/'))
</script>
 
<template>
  <aside 
    class="fixed inset-y-0 right-0 z-50 w-72 bg-white border-l border-gray-100 transform transition-transform duration-300 ease-in-out shadow-[0_0_40px_-10px_rgba(0,0,0,0.05)]"
    :class="isOpen ? 'translate-x-0' : 'translate-x-full'"
  >
    <!-- Logo Area -->
    <div class="h-20 flex items-center justify-between px-6 border-b border-gray-50">
      <div class="flex items-center gap-2.5 text-gray-900 font-black text-xl tracking-tight">
        <div class="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">H</div>
        <span class="font-sans">HASIR<span class="text-indigo-600">ADMIN</span></span>
      </div>
      
      <button @click="emit('close')" class="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition">
        <X class="w-5 h-5 lg:hidden" />
        <ChevronRight class="w-5 h-5 hidden lg:block" />
      </button>
    </div>
 
    <!-- Menu Items -->
    <div class="p-6 space-y-8 overflow-y-auto h-[calc(100vh-9rem)]">
      <div v-for="(group, index) in menuGroups" :key="index">
        <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-3">{{ group.title }}</h3>
        <ul class="space-y-1.5">
          <li v-for="item in group.items" :key="item.routeName">
            <router-link 
              :to="{ name: item.routeName }"
              class="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-200 group relative font-medium text-sm"
              :class="[
                isActive(item.routeName)
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              ]"
            >
              <div class="flex items-center gap-3.5">
                <component 
                  :is="item.icon" 
                  class="w-5 h-5 transition-colors" 
                  :class="isActive(item.routeName) ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'" 
                  stroke-width="2"
                />
                <span>{{ item.label }}</span>
              </div>
              
              <div v-if="isActive(item.routeName)" class="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-600 rounded-l-full"></div>
            </router-link>
          </li>
        </ul>
      </div>
    </div>
 
    <!-- Footer -->
    <div class="absolute bottom-0 w-full p-6 border-t border-gray-50 bg-white">
      <button @click="authStore.logout" class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 transition font-medium text-sm group">
        <LogOut class="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span>خروج از حساب</span>
      </button>
    </div>
  </aside>
 
  <div 
    v-if="isOpen" 
    @click="emit('close')"
    class="fixed inset-0 bg-gray-900/20 z-40 lg:hidden backdrop-blur-sm transition-opacity"
  ></div>
</template>