<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { supabase } from '@/lib/supabase'
import { LogOut, Package, User, MapPin, Edit2 } from 'lucide-vue-next'
import ConfirmModal from '@/components/common/ConfirmModal.vue'

// Components
import UserOrders from '@/components/user/UserOrders.vue'
import UserAddresses from '@/components/user/UserAddresses.vue'
import AddressModal from '@/components/user/AddressModal.vue'
import ProfileEditModal from '@/components/user/ProfileEditModal.vue'

const authStore = useAuthStore()
const toastStore = useToastStore()

const orders = ref<any[]>([])
const addresses = ref<any[]>([])
const loading = ref(true)
const activeTab = ref<'orders' | 'addresses'>('orders')

// Modals State
const showEditProfile = ref(false)
const showAddAddress = ref(false)

// Delete Modal State
const showDeleteModal = ref(false)
const addressToDelete = ref<number | null>(null)
const deleteLoading = ref(false)

const fetchData = async () => {
  if (!authStore.user) return
  loading.value = true
  
  // Fetch Orders
  const { data: ordersData } = await supabase
    .from('orders')
    .select(`*, order_items (*, products (title, image))`)
    .eq('user_id', authStore.user.id)
    .order('created_at', { ascending: false })

  if (ordersData) orders.value = ordersData

  // Fetch Addresses
  const { data: addressData } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', authStore.user.id)
    .order('created_at', { ascending: false })
    
  if (addressData) addresses.value = addressData

  loading.value = false
}

onMounted(fetchData)

// --- Actions ---

const handleUpdateProfile = async (formData: any) => {
  if (!authStore.user) return
  
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: formData.full_name,
    })
    .eq('id', authStore.user.id)

  if (!error) {
    if (authStore.profile) {
      authStore.profile.full_name = formData.full_name
    }
    showEditProfile.value = false
    toastStore.showToast('مشخصات با موفقیت بروزرسانی شد', 'success')
  } else {
    toastStore.showToast('خطا در بروزرسانی مشخصات', 'error')
  }
}

const handleSaveAddress = async (addressData: any) => {
  if (!authStore.user) return
  if (!addressData.address || !addressData.phone) {
    toastStore.showToast('لطفا آدرس و شماره تماس را وارد کنید', 'warning')
    return
  }

  const { data, error } = await supabase
    .from('addresses')
    .insert({
      user_id: authStore.user.id,
      ...addressData
    })
    .select()
    .single()

  if (!error && data) {
    addresses.value.unshift(data)
    showAddAddress.value = false
    toastStore.showToast('آدرس جدید با موفقیت ثبت شد', 'success')
  } else {
    console.error(error)
    toastStore.showToast('خطا در ثبت آدرس', 'error')
  }
}

const confirmDeleteAddress = (id: number) => {
  addressToDelete.value = id
  showDeleteModal.value = true
}

const handleDeleteAddress = async () => {
  if (!addressToDelete.value) return

  deleteLoading.value = true
  const { error } = await supabase
    .from('addresses')
    .delete()
    .eq('id', addressToDelete.value)

  if (!error) {
    addresses.value = addresses.value.filter(a => a.id !== addressToDelete.value)
    toastStore.showToast('آدرس حذف شد', 'info')
    showDeleteModal.value = false
  } else {
    toastStore.showToast('خطا در حذف آدرس', 'error')
  }
  deleteLoading.value = false
}
</script>

<template>
  <div class="min-h-screen bg-stone-50 pt-32 pb-12 px-4">
    <div class="container mx-auto max-w-6xl">
      <div class="grid md:grid-cols-12 gap-8">
        
        <!-- Sidebar -->
        <div class="md:col-span-4 lg:col-span-3">
          <div class="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 text-center sticky top-32">
            <div class="relative w-24 h-24 mx-auto mb-4">
              <div class="w-full h-full bg-stone-200 rounded-full flex items-center justify-center text-stone-500 overflow-hidden">
                <User class="w-12 h-12" />
              </div>
              <button @click="showEditProfile = true" class="absolute bottom-0 right-0 bg-stone-900 text-white p-2 rounded-full hover:bg-accent transition shadow-lg">
                <Edit2 class="w-4 h-4" />
              </button>
            </div>
            
            <h2 class="font-bold text-xl mb-1 text-stone-800">{{ authStore.profile?.full_name || 'کاربر مهمان' }}</h2>
            <p class="text-stone-500 text-sm mb-6 dir-ltr">{{ authStore.user?.phone || authStore.user?.email }}</p>
            
            <div class="space-y-2 mb-6">
              <button 
                @click="activeTab = 'orders'"
                class="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium"
                :class="activeTab === 'orders' ? 'bg-stone-100 text-stone-900' : 'text-stone-500 hover:bg-stone-50'"
              >
                <Package class="w-5 h-5" />
                سفارش‌های من
              </button>
              <button 
                @click="activeTab = 'addresses'"
                class="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium"
                :class="activeTab === 'addresses' ? 'bg-stone-100 text-stone-900' : 'text-stone-500 hover:bg-stone-50'"
              >
                <MapPin class="w-5 h-5" />
                آدرس‌های من
              </button>
            </div>

            <button @click="authStore.logout" class="w-full border border-red-200 text-red-500 py-2 rounded-xl hover:bg-red-50 transition flex items-center justify-center gap-2">
              <LogOut class="w-4 h-4" /> خروج از حساب
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="md:col-span-8 lg:col-span-9">
          
          <UserOrders 
            v-if="activeTab === 'orders'" 
            :orders="orders" 
            :loading="loading" 
          />

          <UserAddresses 
            v-if="activeTab === 'addresses'" 
            :addresses="addresses" 
            @add="showAddAddress = true"
            @delete="confirmDeleteAddress"
          />

        </div>
      </div>
    </div>

    <!-- Modals -->
    <ProfileEditModal 
      v-if="showEditProfile" 
      :initialData="{ full_name: authStore.profile?.full_name || '', phone: authStore.profile?.phone || '' }"
      @close="showEditProfile = false"
      @save="handleUpdateProfile"
    />

    <AddressModal 
      v-if="showAddAddress"
      @close="showAddAddress = false"
      @save="handleSaveAddress"
    />

    <!-- Custom Confirm Modal -->
    <ConfirmModal 
      v-if="showDeleteModal"
      title="حذف آدرس"
      message="آیا از حذف این آدرس اطمینان دارید؟"
      confirmText="بله، حذف شود"
      type="danger"
      :loading="deleteLoading"
      @confirm="handleDeleteAddress"
      @cancel="showDeleteModal = false"
    />

  </div>
</template>