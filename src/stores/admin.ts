import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

export const useAdminStore = defineStore('admin', () => {
  const stats = ref({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    uniqueCustomers: 0
  })
  
  const orders = ref<any[]>([])
  const categoryStats = ref<any[]>([])
  const loading = ref(false)

  // محاسبه داده‌های نمودار (فروش ۷ روز گذشته)
  const chartData = computed(() => {
    const days = 7
    const data = []
    const today = new Date()
    
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(today.getDate() - i)
      const dateStr = d.toLocaleDateString('fa-IR', { weekday: 'long' }) // نام روز هفته
      
      // فیلتر سفارشات مربوط به این روز (فقط سفارشات پرداخت شده یا ارسال شده)
      const dailyOrders = orders.value.filter(o => {
        const orderDate = new Date(o.created_at)
        const isSameDay = orderDate.getDate() === d.getDate() && 
                          orderDate.getMonth() === d.getMonth() &&
                          orderDate.getFullYear() === d.getFullYear()
        
        const isValidStatus = ['paid', 'processing', 'shipped', 'delivered'].includes(o.status)
        return isSameDay && isValidStatus
      })

      const dailyTotal = dailyOrders.reduce((sum, o) => sum + o.total_price, 0)
      
      data.push({
        label: dateStr,
        value: dailyTotal,
        count: dailyOrders.length
      })
    }
    
    // نرمال‌سازی ارتفاع ستون‌ها برای نمودار
    const maxVal = Math.max(...data.map(d => d.value)) || 1
    return data.map(d => ({
      ...d,
      height: `${Math.round((d.value / maxVal) * 100)}%`
    }))
  })

  // --- Actions ---

  const fetchStats = async () => {
    loading.value = true
    try {
      // 1. Products Count
      const { count: pCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
      
      // 2. Orders Data (دریافت همه سفارشات برای محاسبه دقیق آمار)
      // اصلاح: اضافه کردن id و product_id به کوئری تو در تو
      const { data: oData, count: oCount } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            order_id,
            product_id,
            quantity,
            price_at_purchase,
            products (title, image, category)
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

      orders.value = oData || []
      
      // 3. Calculate Revenue & Pending
      const revenue = orders.value
        .filter(o => ['paid', 'processing', 'shipped', 'delivered'].includes(o.status))
        .reduce((sum, o) => sum + o.total_price, 0)
        
      const pending = orders.value.filter(o => o.status === 'pending_approval' || o.status === 'pending').length

      // 4. Calculate Unique Customers (Real Data)
      const uniqueUserIds = new Set(orders.value.map(o => o.user_id).filter(id => id))
      
      // 5. Calculate Category Sales (Real Data)
      const catMap: Record<string, { value: number, count: number }> = {}
      
      orders.value.forEach(order => {
        if (['paid', 'processing', 'shipped', 'delivered'].includes(order.status)) {
          order.order_items.forEach((item: any) => {
            const cat = item.products?.category || 'نامشخص'
            if (!catMap[cat]) catMap[cat] = { value: 0, count: 0 }
            
            catMap[cat].value += (item.price_at_purchase * item.quantity)
            catMap[cat].count += item.quantity
          })
        }
      })

      // تبدیل مپ به آرایه برای نمودار
      const catArray = Object.keys(catMap).map(key => ({
        label: key,
        value: catMap[key].value,
        count: catMap[key].count
      }))
      
      // نرمال‌سازی ارتفاع برای نمودار دسته‌بندی
      const maxCatVal = Math.max(...catArray.map(d => d.value)) || 1
      categoryStats.value = catArray.map(d => ({
        ...d,
        height: `${Math.round((d.value / maxCatVal) * 100)}%`
      }))

      stats.value = {
        totalProducts: pCount || 0,
        totalOrders: oCount || 0,
        totalRevenue: revenue,
        pendingOrders: pending,
        uniqueCustomers: uniqueUserIds.size
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error)
    } finally {
      loading.value = false
    }
  }

  const updateOrderStatus = async (orderId: number, status: string, trackingCode?: string) => {
    const { error } = await supabase
      .from('orders')
      .update({
        status,
        tracking_code: trackingCode || null
      })
      .eq('id', orderId)

    if (!error) {
      const index = orders.value.findIndex(o => o.id === orderId)
      if (index !== -1) {
        orders.value[index].status = status
        orders.value[index].tracking_code = trackingCode
      }
      // آپدیت مجدد آمار برای اطمینان از صحت داده‌ها
      await fetchStats()
    }
    return error
  }

  return { stats, orders, categoryStats, loading, chartData, fetchStats, updateOrderStatus }
})