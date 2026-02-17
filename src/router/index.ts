import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
  type Router,
} from 'vue-router'
import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    requiresAdmin?: boolean
    hideLayout?: boolean
    title?: string
  }
}

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
  { path: '/products', name: 'products', component: () => import('../views/ProductListView.vue') },
  { path: '/products/:id', name: 'product-detail', component: () => import('../views/ProductDetailView.vue') },

  { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
  { path: '/cart', name: 'cart', component: () => import('../views/CartView.vue') },

  {
    path: '/checkout',
    name: 'checkout',
    component: () => import('../views/CheckoutView.vue'),
    meta: { requiresAuth: true },
  },

  { path: '/payment-result', name: 'payment-result', component: () => import('../views/PaymentResultView.vue') },

  {
    path: '/pay-shipping/:token',
    name: 'pay-shipping',
    component: () => import('../views/ShippingPaymentView.vue'),
    meta: { hideLayout: true },
  },

  {
    path: '/admin',
    component: () => import('../views/admin/AdminDashboard.vue'),
    meta: { requiresAuth: true, requiresAdmin: true, hideLayout: true },
    children: [
      { path: '', redirect: { name: 'admin-dashboard' } },

      {
        path: 'dashboard',
        name: 'admin-dashboard',
        component: () => import('../components/admin/DashboardHome.vue'),
        meta: { title: 'داشبورد مدیریتی' },
      },
      {
        path: 'products',
        name: 'admin-products',
        component: () => import('../components/admin/AdminProductManager.vue'),
        meta: { title: 'مدیریت محصولات' },
      },
      {
        path: 'products/create',
        name: 'admin-product-create',
        component: () => import('../views/admin/AdminProductForm.vue'),
        meta: { title: 'افزودن محصول جدید' },
      },
      {
        path: 'products/edit/:id',
        name: 'admin-product-edit',
        component: () => import('../views/admin/AdminProductForm.vue'),
        meta: { title: 'ویرایش محصول' },
      },
      {
        path: 'categories',
        name: 'admin-categories',
        component: () => import('../components/admin/AdminCategoryManager.vue'),
        meta: { title: 'مدیریت دسته‌بندی‌ها' },
      },
      {
        path: 'orders',
        name: 'admin-orders',
        component: () => import('../components/admin/AdminOrderManager.vue'),
        meta: { title: 'مدیریت سفارشات' },
      },
      {
        path: 'inventory',
        name: 'admin-inventory',
        component: () => import('../components/admin/AdminInventory.vue'),
        meta: { title: 'مدیریت موجودی انبار' },
      },
      {
        path: 'users',
        name: 'admin-users',
        component: () => import('../components/admin/AdminCustomerList.vue'),
        meta: { title: 'لیست مشتریان' },
      },
      {
        path: 'analytics',
        name: 'admin-analytics',
        component: () => import('../components/admin/AdminAnalytics.vue'),
        meta: { title: 'آمار و گزارشات' },
      },
      {
        path: 'coupons',
        name: 'admin-coupons',
        component: () => import('../components/admin/AdminCouponManager.vue'),
        meta: { title: 'مدیریت کدهای تخفیف' },
      },
      {
        path: 'comments',
        name: 'admin-comments',
        component: () => import('../components/admin/AdminCommentManager.vue'),
        meta: { title: 'مدیریت نظرات' },
      },
      {
        path: 'settings',
        name: 'admin-settings',
        component: () => import('../views/admin/AdminSettings.vue'),
        meta: { title: 'تنظیمات سیستم' },
      },
    ],
  },

  {
    path: '/admin-setup',
    name: 'admin-setup',
    component: () => import('../views/admin/AdminSetup.vue'),
    meta: { hideLayout: true },
  },

  {
    path: '/profile',
    name: 'profile',
    component: () => import('../views/user/UserProfile.vue'),
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return savedPosition ?? { top: 0 }
  },
})

router.onError((err) => {
  const message = String((err as Error)?.message ?? err)
  const isChunkLikeError =
    /Failed to fetch|Importing a module script failed|Loading chunk \d+ failed/i.test(message)

  if (!isChunkLikeError) {
    console.error('Router Error:', err)
    return
  }

  // جلوگیری از loop در ریلود
  const key = `__router_reload_once__:${router.currentRoute.value.fullPath}`
  if (sessionStorage.getItem(key)) return
  sessionStorage.setItem(key, '1')

  window.location.reload()
})

export function setupGuards(routerInstance: Router) {
  routerInstance.beforeEach(async (to) => {
    const authStore = useAuthStore()

    try {
      const needsAuth = Boolean(to.meta.requiresAuth)

      if (!authStore.isInitialized) {
        if (needsAuth) {
          await authStore.initializeAuth()
        } else {
          void authStore.initializeAuth().catch((e) =>
            console.debug('Background auth check failed', e),
          )
        }
      }

      if (needsAuth && !authStore.user) {
        return { name: 'login', query: { redirect: to.fullPath } }
      }

      if (to.meta.requiresAdmin && !authStore.isAdmin) {
        return { name: 'home' }
      }

      return true
    } catch (error) {
      console.error('Router Guard Error:', error)
      // جلوگیری از صفحه سفید؛ اجازه عبور اضطراری
      return true
    }
  })
}

export default router