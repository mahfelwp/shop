<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import { CreditCard, RefreshCw, Settings, ChevronLeft, Truck, Globe } from 'lucide-vue-next'

// Import Sub-Components
import PaymentSettings from '@/components/admin/settings/PaymentSettings.vue'
import CurrencySettings from '@/components/admin/settings/CurrencySettings.vue'
import ShippingSettings from '@/components/admin/settings/ShippingSettings.vue'
import GeneralSettings from '@/components/admin/settings/GeneralSettings.vue'

const activeTab = ref('general')

const tabs = [
  { id: 'general', label: 'عمومی و سئو', icon: Globe, component: GeneralSettings },
  { id: 'payment', label: 'درگاه و پرداخت', icon: CreditCard, component: PaymentSettings },
  { id: 'shipping', label: 'روش‌های ارسال', icon: Truck, component: ShippingSettings },
  { id: 'currency', label: 'نرخ ارز و طلا', icon: RefreshCw, component: CurrencySettings },
]
</script>

<template>
  <div class="animate-fade-in pb-12">
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-stone-800">تنظیمات سیستم</h2>
      <p class="text-stone-500 text-sm mt-1">مدیریت پیکربندی‌های اصلی فروشگاه</p>
    </div>

    <div class="flex flex-col lg:flex-row gap-8 min-h-[600px]">
      
      <!-- Sidebar Menu -->
      <aside class="w-full lg:w-72 shrink-0">
        <div class="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden sticky top-24">
          <div class="p-4 border-b border-stone-100 bg-stone-50">
            <span class="text-xs font-bold text-stone-500 uppercase tracking-wider">منوی تنظیمات</span>
          </div>
          <nav class="p-2 space-y-1">
            <button 
              v-for="tab in tabs" 
              :key="tab.id"
              @click="activeTab = tab.id"
              class="w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 group text-sm font-medium"
              :class="activeTab === tab.id 
                ? 'bg-stone-900 text-white shadow-md' 
                : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'"
            >
              <div class="flex items-center gap-3">
                <component :is="tab.icon" class="w-5 h-5" :class="activeTab === tab.id ? 'text-white' : 'text-stone-400 group-hover:text-stone-600'" />
                <span>{{ tab.label }}</span>
              </div>
              <ChevronLeft v-if="activeTab === tab.id" class="w-4 h-4 opacity-50" />
            </button>
          </nav>
        </div>
      </aside>

      <!-- Content Area -->
      <main class="flex-1">
        <div class="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 lg:p-8 min-h-full">
          <Transition name="fade" mode="out-in">
            <component :is="tabs.find(t => t.id === activeTab)?.component" />
          </Transition>
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
  transform: translateY(5px);
}
</style>