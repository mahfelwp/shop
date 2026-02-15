import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import ProductListView from '../views/ProductListView.vue'
import CartView from '../views/CartView.vue'
import CheckoutView from '../views/CheckoutView.vue'
import PaymentResultView from '../views/PaymentResultView.vue'
import ShippingPaymentView from '../views/ShippingPaymentView.vue' // New View
import UserProfile from '../views/user/UserProfile.vue'
import { useAuthStore } from '@/stores/auth'
 
// Admin Components
import AdminDashboard from '../views/admin/AdminDashboard.vue'
import DashboardHome from '../components/admin/DashboardHome.vue'
import AdminProductManager from '../components/admin/AdminProductManager.vue'
import AdminProductForm from '../views/admin/AdminProductForm.vue'
import AdminCategoryManager from '../components/admin/AdminCategoryManager.vue'
import AdminOrderManager from '../components/admin/AdminOrderManager.vue'
import AdminInventory from '../components/admin/AdminInventory.vue'
import AdminCustomerList from '../components/admin/AdminCustomerList.vue'
import AdminAnalytics from '../components/admin/AdminAnalytics.vue'
import AdminSettings from '../views/admin/AdminSettings.vue'
import AdminSetup from '../views/admin/AdminSetup.vue'
import AdminCouponManager from '../components/admin/AdminCouponManager.vue'
 
export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/products', name: 'products', component: ProductListView },
  { path: '/login', name: 'login', component: LoginView },
  { path: '/cart', name: 'cart', component: CartView },
  { path: '/checkout', name: 'checkout', component: CheckoutView, meta: { requiresAuth: true } },
  { path: '/payment-result', name: 'payment-result', component: PaymentResultView },
  
  // New Route for Shipping Payment
  { path: '/pay-shipping/:token', name: 'pay-shipping', component: ShippingPaymentView, meta: { hideLayout: true } },
  
  // پنل ادمین
  { 
    path: '/admin', 
    component: AdminDashboard,
    meta: { requiresAuth: true, requiresAdmin: true, hideLayout: true },
    children: [
      { path: '', redirect: { name: 'admin-dashboard' } },
      { path: 'dashboard', name: 'admin-dashboard', component: DashboardHome, meta: { title: 'داشبورد مدیریتی' } },
      
      // Products Routes
      { path: 'products', name: 'admin-products', component: AdminProductManager, meta: { title: 'مدیریت محصولات' } },
      { path: 'products/create', name: 'admin-product-create', component: AdminProductForm, meta: { title: 'افزودن محصول جدید' } },
      { path: 'products/edit/:id', name: 'admin-product-edit', component: AdminProductForm, meta: { title: 'ویرایش محصول' } },
      
      // Categories Route
      { path: 'categories', name: 'admin-categories', component: AdminCategoryManager, meta: { title: 'مدیریت دسته‌بندی‌ها' } },
 
      { path: 'orders', name: 'admin-orders', component: AdminOrderManager, meta: { title: 'مدیریت سفارشات' } },
      { path: 'inventory', name: 'admin-inventory', component: AdminInventory, meta: { title: 'مدیریت موجودی انبار' } },
      { path: 'users', name: 'admin-users', component: AdminCustomerList, meta: { title: 'لیست مشتریان' } },
      { path: 'analytics', name: 'admin-analytics', component: AdminAnalytics, meta: { title: 'آمار و گزارشات' } },
      
      // Coupons Route (New)
      { path: 'coupons', name: 'admin-coupons', component: AdminCouponManager, meta: { title: 'مدیریت کدهای تخفیف' } },
      
      // Settings Route
      { path: 'settings', name: 'admin-settings', component: AdminSettings, meta: { title: 'تنظیمات سیستم' } }
    ]
  },
  
  {
    path: '/admin-setup',
    name: 'admin-setup',
    component: AdminSetup,
    meta: { hideLayout: true }
  },
  
  { 
    path: '/profile', 
    name: 'profile', 
    component: UserProfile,
    meta: { requiresAuth: true }
  }
]
 
export const createRouterInstance = () => createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})
 
export const setupGuards = (router: any) => {
  router.beforeEach(async (to: any, from: any, next: any) => {
    if (import.meta.env.SSR) {
      return next()
    }
 
    const authStore = useAuthStore()
    
    if (!authStore.session) {
      await authStore.initializeAuth()
    }
 
    if (to.meta.requiresAuth && !authStore.user) {
      next({ name: 'login' })
    } else if (to.meta.requiresAdmin && !authStore.isAdmin) {
      next({ name: 'home' }) 
    } else {
      next()
    }
  })
}