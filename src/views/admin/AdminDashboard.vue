<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminSidebar from '@/components/admin/AdminSidebar.vue'
import { Menu, Bell, Search, User, ChevronDown, LogOut, Settings, X, ShoppingBag, UserPlus, Globe, MessageSquare } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const isSidebarOpen = ref(true)

// --- Header States ---
const showNotifications = ref(false)
const showProfileMenu = ref(false)
const globalSearch = ref('')
const notifications = ref<any[]>([])
const loadingNotifs = ref(false)
let realtimeChannel: RealtimeChannel | null = null

const toggleSidebar = () => isSidebarOpen.value = !isSidebarOpen.value
const pageTitle = computed(() => route.meta.title || 'پنل مدیریت')

// --- Helper: Time Ago ---
const getTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  let interval = seconds / 31536000
  if (interval > 1) return Math.floor(interval) + " سال پیش"
  interval = seconds / 2592000
  if (interval > 1) return Math.floor(interval) + " ماه پیش"
  interval = seconds / 86400
  if (interval > 1) return Math.floor(interval) + " روز پیش"
  interval = seconds / 3600
  if (interval > 1) return Math.floor(interval) + " ساعت پیش"
  interval = seconds / 60
  if (interval > 1) return Math.floor(interval) + " دقیقه پیش"
  return "لحظاتی پیش"
}

// --- Fetch Real Notifications ---
const fetchNotifications = async (background = false) => {
  if (!background) loadingNotifs.value = true
  // استفاده از آرایه موقت برای جلوگیری از پرش UI
  const tempNotifs: any[] = []

  try {
    // 1. دریافت آخرین سفارشات (۵ مورد اخیر)
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('id, created_at, total_price, receiver_name')
      .order('created_at', { ascending: false })
      .limit(5)

    if (recentOrders) {
      recentOrders.forEach(order => {
        tempNotifs.push({
          id: `order-${order.id}`,
          title: `سفارش جدید #${order.id}`,
          desc: `${order.receiver_name} - ${order.total_price.toLocaleString()} تومان`,
          time: getTimeAgo(order.created_at),
          rawTime: new Date(order.created_at).getTime(),
          icon: ShoppingBag,
          color: 'text-blue-600 bg-blue-50',
          route: 'admin-orders'
        })
      })
    }

    // 2. دریافت آخرین کاربران (۳ مورد اخیر)
    const { data: recentUsers } = await supabase
      .from('profiles')
      .select('id, created_at, full_name')
      .order('created_at', { ascending: false })
      .limit(3)

    if (recentUsers) {
      recentUsers.forEach(user => {
        tempNotifs.push({
          id: `user-${user.id}`,
          title: `کاربر جدید: ${user.full_name || 'بدون نام'}`,
          desc: 'ثبت نام در سیستم',
          time: getTimeAgo(user.created_at),
          rawTime: new Date(user.created_at).getTime(),
          icon: UserPlus,
          color: 'text-green-600 bg-green-50',
          route: 'admin-users'
        })
      })
    }

    // 3. دریافت آخرین نظرات (۳ مورد اخیر)
    const { data: recentComments } = await supabase
      .from('comments')
      .select('id, created_at, content, products(title)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(3)

    if (recentComments) {
      recentComments.forEach(comment => {
        const productTitle = comment.products?.title || 'محصول'
        tempNotifs.push({
          id: `comment-${comment.id}`,
          title: `نظر جدید برای ${productTitle}`,
          desc: comment.content.substring(0, 40) + (comment.content.length > 40 ? '...' : ''),
          time: getTimeAgo(comment.created_at),
          rawTime: new Date(comment.created_at).getTime(),
          icon: MessageSquare,
          color: 'text-orange-600 bg-orange-50',
          route: 'admin-comments'
        })
      })
    }

    // مرتب‌سازی بر اساس زمان (جدیدترین اول)
    tempNotifs.sort((a, b) => b.rawTime - a.rawTime)
    notifications.value = tempNotifs

  } catch (error) {
    console.error('Error fetching notifications:', error)
  } finally {
    if (!background) loadingNotifs.value = false
  }
}

const subscribeToRealtime = () => {
  realtimeChannel = supabase.channel('admin-header-notifs')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'orders' },
      () => {
        // سفارش جدید ثبت شد -> بروزرسانی لیست
        fetchNotifications(true)
      }
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'profiles' },
      () => {
        // کاربر جدید ثبت نام کرد -> بروزرسانی لیست
        fetchNotifications(true)
      }
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'comments' },
      () => {
        // نظر جدید ثبت شد -> بروزرسانی لیست
        fetchNotifications(true)
      }
    )
    .subscribe()
}

onMounted(() => {
  fetchNotifications()
  subscribeToRealtime()
})

onUnmounted(() => {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel)
  }
})

// --- Actions ---
const handleGlobalSearch = () => {
  const query = globalSearch.value.trim()
  if (!query) return

  if (query.startsWith('#') || /^\d+$/.test(query)) {
    router.push({ name: 'admin-orders' })
  } else if (query.includes('کاربر') || query.includes('مشتری')) {
    router.push({ name: 'admin-users' })
  } else {
    router.push({ name: 'admin-products' })
  }
  globalSearch.value = ''
}

const handleNotificationClick = (routeName: string) => {
  showNotifications.value = false
  router.push({ name: routeName })
}

const closeDropdowns = () => {
  // لاجیک بسته شدن دراپ‌داون‌ها می‌تواند اینجا باشد
  // فعلا با v-if کنترل می‌شود
}

</script>

<template>
  <div class="min-h-screen bg-[#f8f9fc] flex font-sans text-right" dir="rtl" @click="closeDropdowns">
    
    <!-- Sidebar -->
    <AdminSidebar 
      :isOpen="isSidebarOpen" 
      @close="isSidebarOpen = false"
    />

    <!-- Main Content -->
    <div 
      class="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out" 
      :class="isSidebarOpen ? 'lg:mr-72' : 'lg:mr-0'"
    >
      
      <!-- Top Header -->
      <header class="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-30 h-20">
        <div class="flex items-center justify-between px-6 h-full max-w-7xl mx-auto w-full">
          <div class="flex items-center gap-4">
            <button @click="toggleSidebar" class="p-2.5 hover:bg-gray-100 rounded-xl text-gray-600 transition">
              <Menu class="w-6 h-6" />
            </button>
            <h1 class="text-xl font-bold text-gray-800 hidden md:block tracking-tight">{{ pageTitle }}</h1>
          </div>

          <div class="flex items-center gap-4">
            
            <!-- View Store Button -->
            <a 
              href="/" 
              target="_blank"
              class="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-indigo-600 hover:border-indigo-200 transition font-bold text-sm shadow-sm"
              title="مشاهده صفحه اصلی فروشگاه"
            >
              <Globe class="w-4 h-4" />
              <span>مشاهده فروشگاه</span>
            </a>

            <!-- Search Bar -->
            <div class="hidden md:flex items-center bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 w-72 focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-50 transition-all">
              <Search class="w-4 h-4 text-gray-400 ml-3" />
              <input 
                v-model="globalSearch"
                @keyup.enter="handleGlobalSearch"
                type="text" 
                placeholder="جستجو (مثلا: #123 یا نام محصول)..." 
                class="bg-transparent border-none outline-none text-sm w-full text-gray-700 placeholder-gray-400" 
              />
            </div>

            <!-- Notifications -->
            <div class="relative">
              <button 
                @click.stop="showNotifications = !showNotifications; showProfileMenu = false"
                class="relative p-2.5 hover:bg-gray-100 rounded-xl text-gray-500 transition group"
                :class="showNotifications ? 'bg-gray-100 text-indigo-600' : ''"
              >
                <Bell class="w-5 h-5 group-hover:text-indigo-600 transition-colors" />
                <span v-if="notifications.length > 0" class="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
              </button>

              <!-- Notifications Dropdown -->
              <div v-if="showNotifications" class="absolute left-0 mt-4 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in z-50">
                <div class="p-4 border-b border-gray-50 flex justify-between items-center">
                  <span class="font-bold text-gray-800 text-sm">اعلان‌های اخیر</span>
                  <button @click="showNotifications = false" class="text-gray-400 hover:text-gray-600"><X class="w-4 h-4" /></button>
                </div>
                
                <div class="max-h-80 overflow-y-auto">
                  <div v-if="loadingNotifs" class="p-4 text-center text-gray-400 text-sm">
                    در حال دریافت...
                  </div>
                  <div v-else-if="notifications.length === 0" class="p-4 text-center text-gray-400 text-sm">
                    هیچ اعلان جدیدی وجود ندارد.
                  </div>
                  <div 
                    v-else
                    v-for="notif in notifications" 
                    :key="notif.id" 
                    @click="handleNotificationClick(notif.route)"
                    class="p-4 hover:bg-gray-50 transition flex gap-3 border-b border-gray-50 last:border-0 cursor-pointer group"
                  >
                    <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0" :class="notif.color">
                      <component :is="notif.icon" class="w-5 h-5" />
                    </div>
                    <div class="flex-grow">
                      <div class="flex justify-between items-start">
                        <p class="text-sm font-bold text-gray-800 group-hover:text-indigo-600 transition">{{ notif.title }}</p>
                        <span class="text-[10px] text-gray-400 whitespace-nowrap">{{ notif.time }}</span>
                      </div>
                      <p class="text-xs text-gray-500 mt-1 truncate">{{ notif.desc }}</p>
                    </div>
                  </div>
                </div>
                
                <div class="p-3 text-center border-t border-gray-50 bg-gray-50">
                  <button @click="fetchNotifications(false)" class="text-xs font-bold text-indigo-600 hover:text-indigo-700">بروزرسانی لیست</button>
                </div>
              </div>
            </div>

            <!-- Admin Profile -->
            <div class="relative">
              <div 
                @click.stop="showProfileMenu = !showProfileMenu; showNotifications = false"
                class="flex items-center gap-3 pl-2 mr-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded-xl transition select-none"
              >
                <div class="text-left hidden md:block">
                  <div class="text-sm font-bold text-gray-800">{{ authStore.profile?.full_name || 'مدیر سیستم' }}</div>
                  <div class="text-xs text-gray-500 font-medium">دسترسی کامل</div>
                </div>
                <div class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-indigo-200">
                  <User class="w-5 h-5" />
                </div>
                <ChevronDown class="w-4 h-4 text-gray-400 hidden md:block transition-transform duration-300" :class="showProfileMenu ? 'rotate-180' : ''" />
              </div>

              <!-- Profile Dropdown -->
              <div v-if="showProfileMenu" class="absolute left-0 mt-4 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in z-50">
                <div class="p-2 space-y-1">
                  <!-- لینک واقعی به پروفایل -->
                  <router-link 
                    to="/profile" 
                    @click="showProfileMenu = false"
                    class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition text-sm font-medium"
                  >
                    <User class="w-4 h-4" /> پروفایل من
                  </router-link>
                  
                  <!-- لینک واقعی به تنظیمات ادمین -->
                  <router-link 
                    to="/admin/settings" 
                    @click="showProfileMenu = false"
                    class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition text-sm font-medium"
                  >
                    <Settings class="w-4 h-4" /> تنظیمات سیستم
                  </router-link>
                  
                  <div class="h-px bg-gray-100 my-1"></div>
                  
                  <button @click="authStore.logout" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition text-sm font-medium">
                    <LogOut class="w-4 h-4" /> خروج از سیستم
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </header>

      <!-- View Content (Router View) -->
      <main class="p-6 md:p-8 overflow-y-auto h-[calc(100vh-5rem)]">
        <div class="max-w-7xl mx-auto">
          <router-view v-slot="{ Component }">
            <Transition name="fade" mode="out-in">
              <component :is="Component" />
            </Transition>
          </router-view>
        </div>
      </main>

    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>