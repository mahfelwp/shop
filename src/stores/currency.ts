import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useToastStore } from '@/stores/toast'

export interface ExchangeRate {
  id: number
  currency_code: string
  rate: number
  updated_at: string
}

export const useCurrencyStore = defineStore('currency', () => {
  const rates = ref<ExchangeRate[]>([])
  const loading = ref(false)
  const toastStore = useToastStore()

  // --- Helpers ---
  const parsePrice = (p: any): number => {
    if (!p) return 0
    // حذف کاما و تبدیل به عدد
    return parseFloat(String(p).replace(/,/g, ''))
  }

  const fetchRates = async () => {
    loading.value = true
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('*')
      .order('currency_code')
    
    if (data) {
      rates.value = data
    }
    loading.value = false
  }

  const updateRate = async (code: string, newRate: number) => {
    // 1. آپدیت نرخ در جدول exchange_rates
    const { error } = await supabase
      .from('exchange_rates')
      .update({ 
        rate: newRate,
        updated_at: new Date().toISOString()
      })
      .eq('currency_code', code)

    if (error) {
      console.error(`Error updating ${code}:`, error)
      return false
    }

    // 2. آپدیت قیمت تمام محصولاتی که از این ارز استفاده می‌کنند
    await updateProductPrices(code, newRate)
    
    // بروزرسانی استیت لوکال
    const index = rates.value.findIndex(r => r.currency_code === code)
    if (index !== -1) {
      rates.value[index].rate = newRate
    }

    return true
  }

  // تابع کمکی برای آپدیت قیمت محصولات
  const updateProductPrices = async (currencyCode: string, rate: number) => {
    // دریافت محصولاتی که با این ارز قیمت‌گذاری شده‌اند
    const { data: products } = await supabase
      .from('products')
      .select('id, base_price')
      .eq('pricing_method', currencyCode)

    if (!products || products.length === 0) return

    // محاسبه قیمت جدید و آماده‌سازی برای آپدیت
    const updates = products.map(p => {
      const newPriceToman = Math.round(p.base_price * rate)
      return supabase
        .from('products')
        .update({ price: newPriceToman })
        .eq('id', p.id)
    })

    // اجرای همزمان آپدیت‌ها
    await Promise.all(updates)
  }

  // --- LIVE MARKET DATA ---
  const fetchLiveRates = async () => {
    loading.value = true
    // استفاده از کلید عمومی BRS API
    const BRS_API_KEY = "BAEaDlnrAmH39aJQggclQcIbQ4h8xF1N" 
    const BRS_URL = `https://brsapi.ir/Api/Market/Gold_Currency.php?key=${BRS_API_KEY}`
    
    let updatedCount = 0

    try {
      console.log('Fetching live rates...')
      const res = await fetch(BRS_URL)
      if (!res.ok) throw new Error('خطا در ارتباط با سرویس نرخ ارز')
      
      const data = await res.json()
      
      // 1. USD
      const usdItem = data.currency?.find((i: any) => i.symbol === "USD")
      if (usdItem) {
        const price = parsePrice(usdItem.price) // قیمت فروش
        if (price > 0) {
          const success = await updateRate('usd', price)
          if (success) updatedCount++
        }
      }

      // 2. EUR
      const eurItem = data.currency?.find((i: any) => i.symbol === "EUR")
      if (eurItem) {
        const price = parsePrice(eurItem.price)
        if (price > 0) {
          const success = await updateRate('eur', price)
          if (success) updatedCount++
        }
      }

      // 3. GOLD (18K)
      const goldItem = data.gold?.find((i: any) => i.symbol === "IR_GOLD_18K")
      if (goldItem) {
        const price = parsePrice(goldItem.price)
        if (price > 0) {
          const success = await updateRate('gold', price)
          if (success) updatedCount++
        }
      }

      // رفرش لیست نهایی
      await fetchRates()
      
      if (updatedCount > 0) {
        toastStore.showToast(`${updatedCount} نرخ بروزرسانی شد و قیمت محصولات آپدیت گردید`, 'success')
      } else {
        toastStore.showToast('نرخ جدیدی یافت نشد یا خطا در ساختار API', 'warning')
      }

    } catch (error: any) {
      console.error('Live Rate Error:', error)
      // در محیط لوکال ممکن است خطای CORS رخ دهد
      if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
        toastStore.showToast('خطای CORS: لطفا افزونه Allow CORS را در مرورگر فعال کنید یا از پروکسی استفاده کنید', 'warning', 5000)
      } else {
        toastStore.showToast('خطا در دریافت نرخ لحظه‌ای: ' + error.message, 'error')
      }
    } finally {
      loading.value = false
    }
  }

  const getRate = (code: string) => {
    return rates.value.find(r => r.currency_code === code)?.rate || 0
  }

  return { rates, loading, fetchRates, updateRate, fetchLiveRates, getRate }
})