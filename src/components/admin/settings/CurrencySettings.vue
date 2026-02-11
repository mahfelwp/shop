<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useCurrencyStore } from '@/stores/currency'
import { useToastStore } from '@/stores/toast'
import { RefreshCw, DollarSign, Coins, Euro, Save, Loader2, Globe } from 'lucide-vue-next'

const currencyStore = useCurrencyStore()
const toastStore = useToastStore()

const currencyForm = ref<Record<string, number>>({})

onMounted(async () => {
  await currencyStore.fetchRates()
  syncCurrencyForm()
})

const syncCurrencyForm = () => {
  currencyStore.rates.forEach(r => {
    currencyForm.value[r.currency_code] = r.rate
  })
}

watch(() => currencyStore.rates, () => {
  syncCurrencyForm()
}, { deep: true })

const updateCurrency = async (code: string) => {
  const rate = currencyForm.value[code]
  if (rate > 0) {
    const success = await currencyStore.updateRate(code, rate)
    if (success) {
      toastStore.showToast(`نرخ ${code} ذخیره شد`, 'success')
    }
  }
}

const handleLiveUpdate = async () => {
  await currencyStore.fetchLiveRates()
}
</script>

<template>
  <div class="space-y-8 animate-fade-in">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h3 class="font-bold text-lg text-stone-800 mb-1">نرخ ارز و طلا</h3>
        <p class="text-sm text-stone-500">مدیریت قیمت‌گذاری پویا برای محصولات</p>
      </div>
      
      <button 
        @click="handleLiveUpdate" 
        :disabled="currencyStore.loading"
        class="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition flex items-center gap-2 shadow-lg shadow-indigo-200 disabled:opacity-70"
      >
        <Loader2 v-if="currencyStore.loading" class="w-4 h-4 animate-spin" />
        <Globe v-else class="w-4 h-4" />
        بروزرسانی آنلاین نرخ‌ها
      </button>
    </div>

    <div class="grid gap-6">
      <!-- USD -->
      <div class="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <div class="p-3 bg-green-50 text-green-700 rounded-xl">
          <DollarSign class="w-6 h-6" />
        </div>
        <div class="flex-grow text-center sm:text-right">
          <div class="font-bold text-stone-800">دلار آمریکا (USD)</div>
          <div class="text-xs text-stone-400">مبنای محاسبه قیمت دلاری</div>
        </div>
        <div class="flex gap-2 w-full sm:w-auto">
          <input 
            v-model="currencyForm['usd']" 
            type="number" 
            class="w-full sm:w-40 px-3 py-2 rounded-lg border border-stone-300 focus:border-indigo-500 outline-none text-center font-bold text-lg dir-ltr"
          />
          <button 
            @click="updateCurrency('usd')" 
            :disabled="currencyStore.loading"
            class="bg-stone-900 text-white px-3 rounded-lg hover:bg-accent transition disabled:opacity-50 flex items-center justify-center"
            title="ذخیره دستی"
          >
            <Save class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Gold -->
      <div class="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <div class="p-3 bg-yellow-50 text-yellow-600 rounded-xl">
          <Coins class="w-6 h-6" />
        </div>
        <div class="flex-grow text-center sm:text-right">
          <div class="font-bold text-stone-800">طلا ۱۸ عیار (Gold)</div>
          <div class="text-xs text-stone-400">قیمت هر گرم به تومان</div>
        </div>
        <div class="flex gap-2 w-full sm:w-auto">
          <input 
            v-model="currencyForm['gold']" 
            type="number" 
            class="w-full sm:w-40 px-3 py-2 rounded-lg border border-stone-300 focus:border-indigo-500 outline-none text-center font-bold text-lg dir-ltr"
          />
          <button 
            @click="updateCurrency('gold')" 
            :disabled="currencyStore.loading"
            class="bg-stone-900 text-white px-3 rounded-lg hover:bg-accent transition disabled:opacity-50 flex items-center justify-center"
            title="ذخیره دستی"
          >
            <Save class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Euro -->
      <div class="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <div class="p-3 bg-blue-50 text-blue-700 rounded-xl">
          <Euro class="w-6 h-6" />
        </div>
        <div class="flex-grow text-center sm:text-right">
          <div class="font-bold text-stone-800">یورو (EUR)</div>
          <div class="text-xs text-stone-400">مبنای محاسبه قیمت یورویی</div>
        </div>
        <div class="flex gap-2 w-full sm:w-auto">
          <input 
            v-model="currencyForm['eur']" 
            type="number" 
            class="w-full sm:w-40 px-3 py-2 rounded-lg border border-stone-300 focus:border-indigo-500 outline-none text-center font-bold text-lg dir-ltr"
          />
          <button 
            @click="updateCurrency('eur')" 
            :disabled="currencyStore.loading"
            class="bg-stone-900 text-white px-3 rounded-lg hover:bg-accent transition disabled:opacity-50 flex items-center justify-center"
            title="ذخیره دستی"
          >
            <Save class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
    
    <div class="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800 flex items-start gap-2">
      <RefreshCw class="w-5 h-5 shrink-0 mt-0.5" />
      <p>
        <strong>نکته مهم:</strong> با تغییر هر یک از نرخ‌های بالا، قیمت تمام محصولاتی که روش قیمت‌گذاری آن‌ها روی ارز مربوطه تنظیم شده باشد، بلافاصله در دیتابیس بروزرسانی خواهد شد.
      </p>
    </div>
  </div>
</template>