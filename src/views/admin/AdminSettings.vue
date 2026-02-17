<script setup lang="ts">
import { ref, computed, markRaw } from 'vue'
import { CreditCard, RefreshCw, ChevronLeft, Truck, Globe } from 'lucide-vue-next'

// Sub-Components
import PaymentSettings from '@/components/admin/settings/PaymentSettings.vue'
import CurrencySettings from '@/components/admin/settings/CurrencySettings.vue'
import ShippingSettings from '@/components/admin/settings/ShippingSettings.vue'
import GeneralSettings from '@/components/admin/settings/GeneralSettings.vue'

const tabs = [
  { id: 'general', label: 'عمومی و سئو', icon: markRaw(Globe), component: markRaw(GeneralSettings) },
  { id: 'payment', label: 'درگاه و پرداخت', icon: markRaw(CreditCard), component: markRaw(PaymentSettings) },
  { id: 'shipping', label: 'روش‌های ارسال', icon: markRaw(Truck), component: markRaw(ShippingSettings) },
  { id: 'currency', label: 'نرخ ارز و طلا', icon: markRaw(RefreshCw), component: markRaw(CurrencySettings) },
] as const

type TabId = (typeof tabs)[number]['id']
type TabItem = (typeof tabs)[number]

const activeTab = ref<TabId>('general')

const tabsById = new Map<TabId, TabItem>(tabs.map((t) => [t.id, t]))

const activeTabConfig = computed(() => tabsById.get(activeTab.value) ?? tabs[0])
const activeComponent = computed(() => activeTabConfig.value.component)

const setActiveTab = (id: TabId) => {
  activeTab.value = id
}
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
              type="button"
              @click="setActiveTab(tab.id)"
              class="w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 group text-sm font-medium"
              :class="
                activeTab === tab.id
                  ? 'bg-stone-900 text-white shadow-md'
                  : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
              "
              :aria-current="activeTab === tab.id ? 'page' : undefined"
            >
              <div class="flex items-center gap-3">
                <component
                  :is="tab.icon"
                  class="w-5 h-5"
                  :class="activeTab === tab.id ? 'text-white' : 'text-stone-400 group-hover:text-stone-600'"
                />
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
            <component :is="activeComponent" :key="activeTab" />
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