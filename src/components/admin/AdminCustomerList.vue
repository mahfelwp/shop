<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { Search, Mail, Phone, Calendar, ShoppingBag, MoreHorizontal, Trash2, X, Package } from 'lucide-vue-next'
import { useToastStore } from '@/stores/toast'
import ConfirmModal from '@/components/common/ConfirmModal.vue'

const users = ref<any[]>([])
const loading = ref(true)
const searchQuery = ref('')
const toastStore = useToastStore()

// Modal State
const showUserModal = ref(false)
const selectedUser = ref<any>(null)
const userOrders = ref<any[]>([])
const ordersLoading = ref(false)

// Delete Modal State
const showDeleteModal = ref(false)
const userToDelete = ref<string | null>(null)
const deleteLoading = ref(false)

const fetchUsers = async () => {
  loading.value = true
  const { data: profiles } = await supabase.from('profiles').select('*')
  const { data: orders } = await supabase.from('orders').select('id, user_id, total_price, created_at, status')
  
  if (profiles) {
    users.value = profiles.map(profile => {
      const uOrders = orders?.filter(o => o.user_id === profile.id) || []
      const totalSpent = uOrders.reduce((sum, o) => sum + o.total_price, 0)
      
      return {
        ...profile,
        ordersCount: uOrders.length,
        totalSpent: totalSpent,
        joinDate: new Date().toLocaleDateString('fa-IR'),
        allOrders: uOrders
      }
    })
  }
  loading.value = false
}

const filteredUsers = computed(() => {
  const q = searchQuery.value.toLowerCase()
  return users.value.filter(u => 
    (u.full_name?.toLowerCase().includes(q)) || 
    (u.phone?.includes(q))
  )
})

const openUserModal = async (user: any) => {
  selectedUser.value = user
  showUserModal.value = true
  ordersLoading.value = true
  userOrders.value = user.allOrders.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  ordersLoading.value = false
}

const confirmDelete = (userId: string) => {
  userToDelete.value = userId
  showDeleteModal.value = true
}

const handleDelete = async () => {
  if (!userToDelete.value) return

  deleteLoading.value = true
  const { error } = await supabase.from('profiles').delete().eq('id', userToDelete.value)
  
  if (!error) {
    users.value = users.value.filter(u => u.id !== userToDelete.value)
    toastStore.showToast('کاربر با موفقیت حذف شد', 'success')
    showUserModal.value = false
    showDeleteModal.value = false
  } else {
    toastStore.showToast('خطا در حذف کاربر: ' + error.message, 'error')
  }
  deleteLoading.value = false
}

const getStatusColor = (status: string) => {
  const map: any = {
    paid: 'bg-blue-100 text-blue-700',
    processing: 'bg-purple-100 text-purple-700',
    shipped: 'bg-indigo-100 text-indigo-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    pending: 'bg-yellow-100 text-yellow-700'
  }
  return map[status] || 'bg-gray-100'
}

onMounted(fetchUsers)
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">لیست مشتریان</h2>
        <p class="text-gray-500 text-sm mt-1">مدیریت کاربران و تاریخچه خرید</p>
      </div>
      <div class="relative">
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="جستجو با نام یا شماره..." 
          class="pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none w-72 transition bg-white"
        />
        <Search class="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
      </div>
    </div>

    <!-- Users Table -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
      <div class="overflow-x-auto">
        <table class="w-full text-right">
          <thead class="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
            <tr>
              <th class="p-5">کاربر</th>
              <th class="p-5">اطلاعات تماس</th>
              <th class="p-5">تاریخ عضویت</th>
              <th class="p-5">تعداد سفارش</th>
              <th class="p-5">مجموع خرید</th>
              <th class="p-5">عملیات</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="user in filteredUsers" :key="user.id" class="hover:bg-gray-50/50 transition">
              <td class="p-5">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                    {{ user.full_name ? user.full_name.charAt(0) : 'U' }}
                  </div>
                  <div>
                    <div class="font-bold text-gray-800 text-sm">{{ user.full_name || 'کاربر بدون نام' }}</div>
                    <div class="text-xs text-gray-400 mt-0.5">ID: {{ user.id.substring(0, 8) }}...</div>
                  </div>
                </div>
              </td>
              <td class="p-5">
                <div class="flex flex-col gap-1">
                  <div class="flex items-center gap-2 text-xs text-gray-600">
                    <Phone class="w-3 h-3" /> {{ user.phone || '---' }}
                  </div>
                  <div class="flex items-center gap-2 text-xs text-gray-600">
                    <Mail class="w-3 h-3" /> {{ user.email || '---' }}
                  </div>
                </div>
              </td>
              <td class="p-5 text-sm text-gray-600">
                <div class="flex items-center gap-2">
                  <Calendar class="w-3.5 h-3.5 text-gray-400" />
                  {{ user.joinDate }}
                </div>
              </td>
              <td class="p-5">
                <div class="flex items-center gap-2">
                  <ShoppingBag class="w-4 h-4 text-indigo-500" />
                  <span class="font-bold text-gray-800">{{ user.ordersCount }}</span>
                </div>
              </td>
              <td class="p-5 font-bold text-gray-800">
                {{ user.totalSpent.toLocaleString() }} <span class="text-xs font-normal text-gray-400">تومان</span>
              </td>
              <td class="p-5">
                <div class="relative group">
                  <button @click="openUserModal(user)" class="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-indigo-600 transition">
                    <MoreHorizontal class="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div v-if="filteredUsers.length === 0" class="p-12 text-center text-gray-400">
        کاربری یافت نشد.
      </div>
    </div>

    <!-- User Details Modal -->
    <div v-if="showUserModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
        <!-- Modal Header -->
        <div class="bg-gray-900 text-white p-4 flex justify-between items-center shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold">
              {{ selectedUser?.full_name?.charAt(0) || 'U' }}
            </div>
            <div>
              <h3 class="font-bold">{{ selectedUser?.full_name || 'کاربر مهمان' }}</h3>
              <p class="text-xs text-gray-400">{{ selectedUser?.phone || selectedUser?.email }}</p>
            </div>
          </div>
          <button @click="showUserModal = false" class="hover:bg-white/10 p-1 rounded-lg transition"><X class="w-5 h-5" /></button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 overflow-y-auto">
          <div class="grid md:grid-cols-3 gap-4 mb-6">
            <div class="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
              <div class="text-xs text-gray-500 mb-1">تعداد سفارشات</div>
              <div class="text-xl font-black text-gray-800">{{ selectedUser?.ordersCount }}</div>
            </div>
            <div class="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
              <div class="text-xs text-gray-500 mb-1">مجموع خرید</div>
              <div class="text-xl font-black text-indigo-600">{{ selectedUser?.totalSpent.toLocaleString() }} <span class="text-xs">تومان</span></div>
            </div>
            <div class="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
              <div class="text-xs text-gray-500 mb-1">تاریخ عضویت</div>
              <div class="text-lg font-bold text-gray-800">{{ selectedUser?.joinDate }}</div>
            </div>
          </div>

          <h4 class="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Package class="w-5 h-5 text-gray-400" />
            تاریخچه سفارشات
          </h4>

          <div v-if="userOrders.length > 0" class="space-y-3">
            <div v-for="order in userOrders" :key="order.id" class="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center font-mono text-xs font-bold text-gray-500">
                  #{{ order.id }}
                </div>
                <div>
                  <div class="font-bold text-gray-800 text-sm">{{ order.total_price.toLocaleString() }} تومان</div>
                  <div class="text-xs text-gray-400">{{ new Date(order.created_at).toLocaleDateString('fa-IR') }}</div>
                </div>
              </div>
              <span class="px-2.5 py-1 rounded-lg text-xs font-bold" :class="getStatusColor(order.status)">
                {{ order.status }}
              </span>
            </div>
          </div>
          <div v-else class="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            این کاربر هنوز سفارشی ثبت نکرده است.
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
          <button @click="confirmDelete(selectedUser.id)" class="text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2">
            <Trash2 class="w-4 h-4" /> حذف کاربر
          </button>
          <button @click="showUserModal = false" class="bg-gray-200 text-gray-700 px-6 py-2 rounded-xl text-sm font-bold hover:bg-gray-300 transition">
            بستن
          </button>
        </div>
      </div>
    </div>

    <!-- Custom Confirm Modal -->
    <ConfirmModal 
      v-if="showDeleteModal"
      title="حذف کاربر"
      message="آیا از حذف این کاربر و تمام اطلاعات او اطمینان دارید؟ این عملیات غیرقابل بازگشت است."
      confirmText="بله، حذف شود"
      type="danger"
      :loading="deleteLoading"
      @confirm="handleDelete"
      @cancel="showDeleteModal = false"
    />

  </div>
</template>