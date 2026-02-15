<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAdminStore } from '@/stores/admin'
import { useSettingsStore } from '@/stores/settings'
import { useToastStore } from '@/stores/toast'
import { supabase } from '@/lib/supabase'
import { Edit, CreditCard, DollarSign, Truck, Eye, X, ImageIcon, Save, Trash2, Plus, Search, Package, MapPin, User, Phone, Loader2, Link as LinkIcon, Copy, CheckCircle2 } from 'lucide-vue-next'

const adminStore = useAdminStore()
const settingsStore = useSettingsStore()
const toastStore = useToastStore()

const showModal = ref(false)
const showReceiptModal = ref(false)
const selectedOrder = ref<any>(null)
const receiptImage = ref('')
const activeTab = ref<'status' | 'items' | 'shipping'>('status')

// Data for editing
const allProducts = ref<any[]>([])
const productSearch = ref('')
const shippingForm = ref({
  receiver_name: '',
  receiver_phone: '',
  shipping_address: ''
})
const statusForm = ref({
  status: '',
  tracking_code: '',
  shipping_method_id: null as number | null,
  // New Fields for Shipping Cost
  shipping_cost_real: 0,
  shipping_payment_status: 'waived'
})

const loadingProducts = ref(false)

onMounted(async () => {
  await adminStore.fetchStats()
  await settingsStore.fetchShippingMethods()

  loadingProducts.value = true
  const { data } = await supabase.from('products').select('id, title, price, image, stock')
  if (data) allProducts.value = data
  loadingProducts.value = false
})

const filteredProducts = computed(() => {
  if (!productSearch.value) return []
  return allProducts.value.filter(p => p.title.toLowerCase().includes(productSearch.value.toLowerCase())).slice(0, 5)
})

const openModal = (order: any) => {
  selectedOrder.value = JSON.parse(JSON.stringify(order))
  
  statusForm.value.status = order.status
  statusForm.value.tracking_code = order.tracking_code || ''
  statusForm.value.shipping_method_id = order.shipping_method_id || null
  statusForm.value.shipping_cost_real = order.shipping_cost_real || 0
  statusForm.value.shipping_payment_status = order.shipping_payment_status || 'waived'
  
  shippingForm.value.receiver_name = order.receiver_name
  shippingForm.value.receiver_phone = order.receiver_phone
  shippingForm.value.shipping_address = order.shipping_address
  
  activeTab.value = 'status'
  showModal.value = true
}

const viewReceipt = (url: string) => {
  receiptImage.value = url
  showReceiptModal.value = true
}

const updateStatus = async () => {
  if (!selectedOrder.value) return
  
  const { error } = await supabase
    .from('orders')
    .update({
      status: statusForm.value.status,
      tracking_code: statusForm.value.tracking_code || null,
      shipping_method_id: statusForm.value.shipping_method_id,
      shipping_cost_real: statusForm.value.shipping_cost_real,
      shipping_payment_status: statusForm.value.shipping_payment_status
    })
    .eq('id', selectedOrder.value.id)

  if (!error) {
    toastStore.showToast('وضعیت سفارش بروزرسانی شد', 'success')
    selectedOrder.value.status = statusForm.value.status
    selectedOrder.value.tracking_code = statusForm.value.tracking_code
    selectedOrder.value.shipping_method_id = statusForm.value.shipping_method_id
    selectedOrder.value.shipping_cost_real = statusForm.value.shipping_cost_real
    selectedOrder.value.shipping_payment_status = statusForm.value.shipping_payment_status
    await adminStore.fetchStats() // Refresh list
  } else {
    toastStore.showToast('خطا در بروزرسانی', 'error')
  }
}

const verifyPayment = async (approved: boolean) => {
  if (!selectedOrder.value) return
  const newStatus = approved ? 'paid' : 'cancelled'
  const error = await adminStore.updateOrderStatus(selectedOrder.value.id, newStatus)
  if (!error) {
    toastStore.showToast(approved ? 'پرداخت تایید شد' : 'پرداخت رد شد', approved ? 'success' : 'warning')
    statusForm.value.status = newStatus
    selectedOrder.value.status = newStatus
  }
}

const verifyShippingPayment = async (approved: boolean) => {
  if (!selectedOrder.value) return
  const newStatus = approved ? 'paid_separately' : 'pending_payment'
  
  const { error } = await supabase
    .from('orders')
    .update({ shipping_payment_status: newStatus })
    .eq('id', selectedOrder.value.id)

  if (!error) {
    toastStore.showToast(approved ? 'پرداخت هزینه ارسال تایید شد' : 'پرداخت هزینه ارسال رد شد', approved ? 'success' : 'warning')
    statusForm.value.shipping_payment_status = newStatus
    selectedOrder.value.shipping_payment_status = newStatus
  }
}

const saveShippingInfo = async () => {
  if (!selectedOrder.value) return
  const { error } = await supabase.from('orders').update({
      receiver_name: shippingForm.value.receiver_name,
      receiver_phone: shippingForm.value.receiver_phone,
      shipping_address: shippingForm.value.shipping_address
    }).eq('id', selectedOrder.value.id)
  if (!error) {
    toastStore.showToast('اطلاعات ارسال ذخیره شد', 'success')
    const idx = adminStore.orders.findIndex(o => o.id === selectedOrder.value.id)
    if (idx !== -1) {
      adminStore.orders[idx].receiver_name = shippingForm.value.receiver_name
      adminStore.orders[idx].receiver_phone = shippingForm.value.receiver_phone
      adminStore.orders[idx].shipping_address = shippingForm.value.shipping_address
    }
  } else {
    toastStore.showToast('خطا در ذخیره اطلاعات', 'error')
  }
}

const recalculateTotal = async () => {
  if (!selectedOrder.value) return
  const newTotal = selectedOrder.value.order_items.reduce((sum: number, item: any) => sum + (item.price_at_purchase * item.quantity), 0)
  const { error } = await supabase.from('orders').update({ total_price: newTotal }).eq('id', selectedOrder.value.id)
  if (!error) {
    selectedOrder.value.total_price = newTotal
    const idx = adminStore.orders.findIndex(o => o.id === selectedOrder.value.id)
    if (idx !== -1) adminStore.orders[idx].total_price = newTotal
  }
}

const updateItemQty = async (item: any, change: number) => {
  const newQty = item.quantity + change
  if (newQty < 1) return
  const { error } = await supabase.from('order_items').update({ quantity: newQty }).eq('id', item.id)
  if (!error) {
    item.quantity = newQty
    await recalculateTotal()
    toastStore.showToast('تعداد بروزرسانی شد', 'success')
  } else {
    toastStore.showToast('خطا در تغییر تعداد', 'error')
  }
}

const removeItem = async (itemId: number) => {
  if (!confirm('آیا از حذف این آیتم اطمینان دارید؟')) return
  const { error } = await supabase.from('order_items').delete().eq('id', itemId)
  if (!error) {
    selectedOrder.value.order_items = selectedOrder.value.order_items.filter((i: any) => i.id !== itemId)
    await recalculateTotal()
    toastStore.showToast('آیتم حذف شد', 'success')
  } else {
    toastStore.showToast('خطا در حذف آیتم', 'error')
  }
}

const addItemToOrder = async (product: any) => {
  const existingItem = selectedOrder.value.order_items.find((i: any) => i.product_id === product.id)
  if (existingItem) {
    await updateItemQty(existingItem, 1)
    productSearch.value = ''
    return
  }
  const newItem = {
    order_id: selectedOrder.value.id,
    product_id: product.id,
    quantity: 1,
    price_at_purchase: product.price
  }
  const { data, error } = await supabase.from('order_items').insert(newItem).select(`*, products (title, image, category)`).single()
  if (!error && data) {
    selectedOrder.value.order_items.push(data)
    await recalculateTotal()
    toastStore.showToast('محصول به سفارش اضافه شد', 'success')
    productSearch.value = ''
  } else {
    toastStore.showToast('خطا در افزودن محصول', 'error')
  }
}

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    'pending': 'در انتظار پرداخت',
    'pending_approval': 'در انتظار تایید فیش',
    'paid': 'پرداخت شده',
    'processing': 'در حال پردازش',
    'shipped': 'ارسال شده',
    'delivered': 'تحویل شده',
    'cancelled': 'لغو شده'
  }
  return map[status] || status
}

const getStatusColor = (status: string) => {
  const map: Record<string, string> = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'pending_approval': 'bg-orange-100 text-orange-800',
    'paid': 'bg-blue-100 text-blue-800',
    'processing': 'bg-purple-100 text-purple-800',
    'shipped': 'bg-indigo-100 text-indigo-800',
    'delivered': 'bg-green-100 text-green-800',
    'cancelled': 'bg-red-100 text-red-800'
  }
  return map[status] || 'bg-gray-100'
}

const getSelectedMethod = computed(() => {
  return settingsStore.shippingMethods.find(m => m.id === statusForm.value.shipping_method_id)
})

const generatePaymentLink = () => {
  if (!selectedOrder.value?.shipping_payment_token) return ''
  return `${window.location.origin}/pay-shipping/${selectedOrder.value.shipping_payment_token}`
}

const copyLink = () => {
  const link = generatePaymentLink()
  navigator.clipboard.writeText(link)
  toastStore.showToast('لینک پرداخت کپی شد', 'success')
}

const setShippingToPending = () => {
  statusForm.value.shipping_payment_status = 'pending_payment'
  updateStatus()
}
</script>

<template>
  <div class="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden animate-fade-in">
    <div class="p-6 border-b border-stone-100 flex justify-between items-center">
      <span class="font-bold text-lg">مدیریت سفارشات</span>
      <button @click="adminStore.fetchStats" class="text-sm text-blue-600 hover:underline flex items-center gap-1">
        <Loader2 v-if="adminStore.loading" class="w-3 h-3 animate-spin" />
        بروزرسانی لیست
      </button>
    </div>
    
    <div v-if="adminStore.loading && adminStore.orders.length === 0" class="p-12 text-center text-stone-400">
      <Loader2 class="w-8 h-8 animate-spin mx-auto mb-2" />
      در حال دریافت سفارشات...
    </div>

    <div v-else-if="adminStore.orders.length === 0" class="p-12 text-center text-stone-400">
      هیچ سفارشی یافت نشد.
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-right">
        <thead class="bg-stone-50 text-stone-500 text-sm">
          <tr>
            <th class="p-4">شماره</th>
            <th class="p-4">مشتری</th>
            <th class="p-4">مبلغ</th>
            <th class="p-4">روش پرداخت</th>
            <th class="p-4">وضعیت</th>
            <th class="p-4">عملیات</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-stone-100">
          <tr v-for="order in adminStore.orders" :key="order.id" class="hover:bg-stone-50 transition">
            <td class="p-4 font-mono font-bold">#{{ order.id }}</td>
            <td class="p-4">
              <div class="font-bold text-sm">{{ order.receiver_name }}</div>
              <div class="text-xs text-stone-400">{{ order.receiver_phone }}</div>
            </td>
            <td class="p-4 font-bold">{{ order.total_price.toLocaleString() }}</td>
            <td class="p-4 text-sm">
              <span v-if="order.payment_method === 'card_to_card'" class="flex items-center gap-1 text-orange-600"><CreditCard class="w-3 h-3" /> کارت به کارت</span>
              <span v-else class="flex items-center gap-1 text-blue-600"><DollarSign class="w-3 h-3" /> آنلاین</span>
            </td>
            <td class="p-4">
              <span class="px-2 py-1 rounded-lg text-xs font-bold" :class="getStatusColor(order.status)">{{ getStatusLabel(order.status) }}</span>
              <div v-if="order.shipping_payment_status === 'pending_payment'" class="mt-1 text-[10px] text-red-500 font-bold flex items-center gap-1">
                <Truck class="w-3 h-3" /> منتظر پرداخت هزینه ارسال
              </div>
            </td>
            <td class="p-4 flex items-center gap-2">
              <button @click="openModal(order)" class="bg-stone-900 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-accent transition flex items-center gap-1"><Edit class="w-3 h-3" /> مدیریت</button>
              <button v-if="order.payment_receipt_url" @click="viewReceipt(order.payment_receipt_url)" class="bg-white border border-stone-300 text-stone-600 px-3 py-1.5 rounded-lg text-xs hover:bg-stone-100 transition flex items-center gap-1"><ImageIcon class="w-3 h-3" /> فیش</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Order Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
        
        <!-- Modal Header -->
        <div class="bg-stone-900 text-white p-4 flex justify-between items-center shrink-0">
          <div class="flex items-center gap-3">
            <h3 class="font-bold">مدیریت سفارش #{{ selectedOrder?.id }}</h3>
            <span class="text-xs bg-white/20 px-2 py-0.5 rounded">{{ getStatusLabel(selectedOrder?.status) }}</span>
          </div>
          <button @click="showModal = false"><X class="w-5 h-5" /></button>
        </div>

        <!-- Tabs -->
        <div class="flex border-b border-stone-200 bg-stone-50 shrink-0">
          <button @click="activeTab = 'status'" class="flex-1 py-3 text-sm font-bold transition border-b-2" :class="activeTab === 'status' ? 'border-stone-900 text-stone-900 bg-white' : 'border-transparent text-stone-500 hover:bg-stone-100'">وضعیت و ارسال</button>
          <button @click="activeTab = 'items'" class="flex-1 py-3 text-sm font-bold transition border-b-2" :class="activeTab === 'items' ? 'border-stone-900 text-stone-900 bg-white' : 'border-transparent text-stone-500 hover:bg-stone-100'">اقلام سفارش</button>
          <button @click="activeTab = 'shipping'" class="flex-1 py-3 text-sm font-bold transition border-b-2" :class="activeTab === 'shipping' ? 'border-stone-900 text-stone-900 bg-white' : 'border-transparent text-stone-500 hover:bg-stone-100'">اطلاعات گیرنده</button>
        </div>
        
        <!-- Modal Body -->
        <div class="p-6 overflow-y-auto flex-grow">
          
          <!-- TAB 1: STATUS & SHIPPING -->
          <div v-if="activeTab === 'status'" class="space-y-6 animate-fade-in">
            
            <!-- Order Summary -->
            <div class="bg-stone-50 p-4 rounded-xl border border-stone-200 flex justify-between items-center">
              <div>
                <div class="text-sm text-stone-500 mb-1">مبلغ کل سفارش</div>
                <div class="font-black text-2xl text-accent">{{ selectedOrder?.total_price.toLocaleString() }} <span class="text-sm font-normal text-stone-500">تومان</span></div>
              </div>
              <div class="text-left">
                <div class="text-sm text-stone-500 mb-1">روش پرداخت</div>
                <div class="font-bold text-stone-800">{{ selectedOrder?.payment_method === 'card_to_card' ? 'کارت به کارت' : 'آنلاین' }}</div>
              </div>
            </div>

            <!-- Receipt Check (Main Order) -->
            <div v-if="selectedOrder?.payment_method === 'card_to_card' && selectedOrder?.status === 'pending_approval'" class="space-y-3 border-t border-stone-100 pt-4">
              <label class="block text-sm font-bold text-stone-700">بررسی فیش واریزی (سفارش اصلی)</label>
              <div v-if="selectedOrder.payment_receipt_url" class="relative group cursor-pointer" @click="viewReceipt(selectedOrder.payment_receipt_url)">
                <img :src="selectedOrder.payment_receipt_url" class="w-full h-40 object-cover rounded-xl border border-stone-200" />
                <div class="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition rounded-xl">
                  <Eye class="w-8 h-8 text-white" />
                </div>
              </div>
              <div v-else class="text-red-500 text-sm bg-red-50 p-3 rounded-lg">تصویر فیش آپلود نشده است!</div>
              <div class="flex gap-2 pt-2">
                <button @click="verifyPayment(true)" class="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition">تایید پرداخت</button>
                <button @click="verifyPayment(false)" class="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm font-bold hover:bg-red-600 transition">رد پرداخت</button>
              </div>
            </div>

            <!-- Shipping Method & Cost Management -->
            <div class="bg-indigo-50 p-4 rounded-xl border border-indigo-100 space-y-4">
              <h4 class="font-bold text-indigo-900 flex items-center gap-2 border-b border-indigo-200 pb-2">
                <Truck class="w-5 h-5" /> مدیریت ارسال
              </h4>
              
              <div>
                <label class="block text-sm font-bold text-indigo-900 mb-2">روش ارسال</label>
                <select v-model="statusForm.shipping_method_id" class="w-full p-3 rounded-xl border border-indigo-200 focus:border-indigo-500 outline-none bg-white">
                  <option :value="null">انتخاب نشده</option>
                  <option v-for="method in settingsStore.shippingMethods" :key="method.id" :value="method.id">
                    {{ method.title }} ({{ method.cost_type === 'fixed' ? 'هزینه ثابت' : (method.cost_type === 'pas_kerayeh' ? 'پس‌کرایه' : 'محاسبه بعدی') }})
                  </option>
                </select>
              </div>

              <!-- Calculated Later Logic -->
              <div v-if="getSelectedMethod?.cost_type === 'calculated_later'" class="bg-white p-4 rounded-xl border border-indigo-200 space-y-3">
                <div class="text-sm text-indigo-800 font-bold">محاسبه هزینه ارسال</div>
                <div class="flex gap-2">
                  <input 
                    v-model="statusForm.shipping_cost_real" 
                    type="number" 
                    placeholder="هزینه واقعی (تومان)" 
                    class="flex-grow p-2 rounded-lg border border-indigo-200 focus:border-indigo-500 outline-none"
                  />
                  <button 
                    v-if="statusForm.shipping_payment_status === 'waived' || statusForm.shipping_payment_status === 'pending_payment'"
                    @click="setShippingToPending" 
                    class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 transition"
                  >
                    ثبت و ایجاد لینک
                  </button>
                </div>

                <!-- Payment Link Display -->
                <div v-if="statusForm.shipping_payment_status === 'pending_payment'" class="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                  <div class="text-xs text-indigo-600 mb-1">لینک پرداخت هزینه ارسال:</div>
                  <div class="flex gap-2">
                    <input :value="generatePaymentLink()" readonly class="flex-grow bg-white p-1.5 rounded border border-indigo-200 text-xs font-mono dir-ltr" />
                    <button @click="copyLink" class="bg-white p-1.5 rounded border border-indigo-200 hover:bg-indigo-50 text-indigo-600"><Copy class="w-4 h-4" /></button>
                  </div>
                  <div class="text-[10px] text-indigo-400 mt-1">این لینک را برای مشتری پیامک کنید.</div>
                </div>

                <!-- Shipping Payment Status -->
                <div class="flex items-center justify-between text-sm">
                  <span>وضعیت پرداخت هزینه ارسال:</span>
                  <span class="font-bold" :class="{
                    'text-red-500': statusForm.shipping_payment_status === 'pending_payment',
                    'text-green-600': statusForm.shipping_payment_status === 'paid_separately',
                    'text-gray-500': statusForm.shipping_payment_status === 'waived'
                  }">
                    {{ statusForm.shipping_payment_status === 'pending_payment' ? 'منتظر پرداخت' : (statusForm.shipping_payment_status === 'paid_separately' ? 'پرداخت شده' : 'تعیین نشده') }}
                  </span>
                </div>

                <!-- Shipping Receipt Check -->
                <div v-if="selectedOrder.shipping_receipt_url && statusForm.shipping_payment_status === 'pending_payment'" class="mt-2 pt-2 border-t border-indigo-100">
                  <div class="text-xs font-bold text-indigo-800 mb-2">فیش واریزی هزینه ارسال:</div>
                  <div class="flex gap-2 items-center">
                    <button @click="viewReceipt(selectedOrder.shipping_receipt_url)" class="text-blue-600 text-xs hover:underline flex items-center gap-1"><Eye class="w-3 h-3" /> مشاهده فیش</button>
                    <button @click="verifyShippingPayment(true)" class="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600">تایید</button>
                    <button @click="verifyShippingPayment(false)" class="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600">رد</button>
                  </div>
                </div>
              </div>

              <div>
                <label class="block text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                  {{ getSelectedMethod?.type === 'post' ? 'کد رهگیری پستی / تیپاکس' : 'شماره تماس راننده / پیک' }}
                </label>
                <div class="relative">
                  <input 
                    v-model="statusForm.tracking_code" 
                    type="text" 
                    :placeholder="getSelectedMethod?.type === 'post' ? 'کد رهگیری را اینجا وارد کنید...' : 'شماره تماس راننده...'" 
                    class="w-full p-3 pl-10 rounded-xl border border-indigo-200 focus:border-indigo-500 outline-none font-mono dir-ltr bg-white" 
                  />
                  <Truck class="w-5 h-5 text-indigo-300 absolute left-3 top-3.5" />
                </div>
              </div>
            </div>

            <!-- Main Status Update -->
            <div>
              <label class="block text-sm font-bold text-stone-700 mb-2">تغییر وضعیت کلی سفارش</label>
              <select v-model="statusForm.status" class="w-full p-3 rounded-xl border border-stone-300 focus:border-stone-900 outline-none bg-white">
                <option value="pending">در انتظار پرداخت</option>
                <option value="pending_approval">در انتظار تایید فیش</option>
                <option value="paid">پرداخت شده</option>
                <option value="processing">در حال پردازش</option>
                <option value="shipped">ارسال شده</option>
                <option value="delivered">تحویل مشتری شده</option>
                <option value="cancelled">لغو شده</option>
              </select>
            </div>

            <button @click="updateStatus" class="w-full bg-stone-900 text-white py-3 rounded-xl font-bold hover:bg-accent transition flex items-center justify-center gap-2">
              <Save class="w-4 h-4" /> ذخیره تغییرات
            </button>
          </div>

          <!-- TAB 2: ORDER ITEMS -->
          <div v-if="activeTab === 'items'" class="space-y-6 animate-fade-in">
            <!-- Add Item -->
            <div class="relative">
              <label class="block text-sm font-bold text-stone-700 mb-2">افزودن محصول به سفارش</label>
              <div class="relative">
                <input v-model="productSearch" type="text" placeholder="جستجوی محصول..." class="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-300 focus:border-stone-900 outline-none" />
                <Search class="w-5 h-5 text-stone-400 absolute left-3 top-3.5" />
              </div>
              <div v-if="filteredProducts.length > 0" class="absolute top-full left-0 right-0 bg-white border border-stone-200 rounded-xl shadow-xl mt-2 z-20 overflow-hidden">
                <div v-for="product in filteredProducts" :key="product.id" @click="addItemToOrder(product)" class="flex items-center gap-3 p-3 hover:bg-stone-50 cursor-pointer border-b border-stone-50 last:border-0">
                  <img :src="product.image" class="w-10 h-10 rounded-lg object-cover bg-stone-100" />
                  <div class="flex-grow">
                    <div class="font-bold text-sm text-stone-800">{{ product.title }}</div>
                    <div class="text-xs text-stone-500">{{ product.price.toLocaleString() }} تومان</div>
                  </div>
                  <Plus class="w-4 h-4 text-stone-400" />
                </div>
              </div>
            </div>

            <!-- Items List -->
            <div class="space-y-3">
              <div v-for="item in selectedOrder.order_items" :key="item.id" class="flex items-center gap-3 p-3 border border-stone-200 rounded-xl bg-white">
                <img :src="item.products?.image" class="w-16 h-16 rounded-lg object-cover bg-stone-100 border border-stone-100 shrink-0" />
                <div class="flex-grow min-w-0">
                  <div class="font-bold text-stone-800 text-sm truncate">{{ item.products?.title }}</div>
                  <div class="text-xs text-stone-500 mt-1">{{ item.price_at_purchase.toLocaleString() }} تومان</div>
                </div>
                <div class="flex items-center gap-2 bg-stone-50 rounded-lg border border-stone-200 px-1">
                  <button @click="updateItemQty(item, 1)" class="p-1 hover:text-green-600"><Plus class="w-3 h-3" /></button>
                  <span class="w-6 text-center font-bold text-sm">{{ item.quantity }}</span>
                  <button @click="updateItemQty(item, -1)" class="p-1 hover:text-red-600" :disabled="item.quantity <= 1"><div class="w-2 h-0.5 bg-current"></div></button>
                </div>
                <div class="font-bold text-sm w-20 text-left">{{ (item.price_at_purchase * item.quantity).toLocaleString() }}</div>
                <button @click="removeItem(item.id)" class="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 class="w-4 h-4" /></button>
              </div>
            </div>
            <div class="bg-stone-50 p-4 rounded-xl flex justify-between items-center border border-stone-200">
              <span class="font-bold text-stone-700">مجموع کل جدید:</span>
              <span class="font-black text-xl text-accent">{{ selectedOrder.total_price.toLocaleString() }} تومان</span>
            </div>
          </div>

          <!-- TAB 3: SHIPPING INFO -->
          <div v-if="activeTab === 'shipping'" class="space-y-4 animate-fade-in">
            <div>
              <label class="block text-sm font-bold text-stone-700 mb-2">نام گیرنده</label>
              <div class="relative">
                <input v-model="shippingForm.receiver_name" type="text" class="w-full pl-4 pr-10 py-3 rounded-xl border border-stone-300 focus:border-stone-900 outline-none" />
                <User class="w-5 h-5 text-stone-400 absolute right-3 top-3.5" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-bold text-stone-700 mb-2">شماره تماس</label>
              <div class="relative">
                <input v-model="shippingForm.receiver_phone" type="text" class="w-full pl-4 pr-10 py-3 rounded-xl border border-stone-300 focus:border-stone-900 outline-none dir-ltr text-right" />
                <Phone class="w-5 h-5 text-stone-400 absolute right-3 top-3.5" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-bold text-stone-700 mb-2">آدرس کامل پستی</label>
              <div class="relative">
                <textarea v-model="shippingForm.shipping_address" rows="4" class="w-full pl-4 pr-10 py-3 rounded-xl border border-stone-300 focus:border-stone-900 outline-none"></textarea>
                <MapPin class="w-5 h-5 text-stone-400 absolute right-3 top-3.5" />
              </div>
            </div>
            <button @click="saveShippingInfo" class="w-full bg-stone-900 text-white py-3 rounded-xl font-bold hover:bg-accent transition flex items-center justify-center gap-2">
              <Save class="w-4 h-4" /> ذخیره اطلاعات ارسال
            </button>
          </div>

        </div>

        <!-- Modal Footer -->
        <div class="p-4 border-t border-stone-100 bg-stone-50 flex justify-end">
          <button @click="showModal = false" class="bg-white border border-stone-300 text-stone-700 px-6 py-2.5 rounded-xl font-bold hover:bg-stone-100 transition">بستن پنجره</button>
        </div>
      </div>
    </div>

    <!-- Receipt Modal -->
    <div v-if="showReceiptModal" class="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4" @click="showReceiptModal = false">
      <div class="relative max-w-3xl max-h-full">
        <img :src="receiptImage" class="max-w-full max-h-[90vh] rounded-lg shadow-2xl" />
        <button class="absolute -top-10 right-0 text-white hover:text-red-400" @click="showReceiptModal = false"><X class="w-8 h-8" /></button>
      </div>
    </div>
  </div>
</template>