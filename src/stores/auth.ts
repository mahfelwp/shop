import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'vue-router'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<any>(null)
  const session = ref<any>(null)
  const profile = ref<any>(null)
  const isInitialized = ref(false) // فلگ برای بررسی وضعیت اولیه
  const router = useRouter()

  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => profile.value?.role === 'admin')

  // بررسی وضعیت لاگین در شروع برنامه
  const initializeAuth = async () => {
    if (isInitialized.value) return

    try {
      // استفاده از getUser به جای getSession برای امنیت و پایداری بیشتر
      const { data, error } = await supabase.auth.getUser()
      
      if (error) {
        // اگر خطا AbortError بود، آن را نادیده می‌گیریم (کاربر مهمان)
        if (error.message && error.message.includes('AbortError')) {
          console.debug('Auth check aborted, assuming guest.')
        } else {
          console.warn('Auth check failed:', error.message)
        }
        user.value = null
        session.value = null
      } else {
        user.value = data.user
        // دریافت سشن برای توکن‌ها
        const { data: sessionData } = await supabase.auth.getSession()
        session.value = sessionData.session
        
        if (user.value) {
          await fetchProfile()
        }
      }
      
      // لیسنر برای تغییرات وضعیت (لاگین/لاگ‌اوت در تب‌های دیگر)
      supabase.auth.onAuthStateChange(async (_event, _session) => {
        session.value = _session
        user.value = _session?.user
        if (user.value) {
          await fetchProfile()
        } else {
          profile.value = null
        }
      })

    } catch (e: any) {
      // مدیریت خطای کلی برای جلوگیری از کرش
      console.error('Auth initialization exception:', e)
    } finally {
      isInitialized.value = true
    }
  }

  const fetchProfile = async () => {
    if (!user.value) return
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.value.id)
        .single()
      
      if (!error && data) {
        profile.value = data
      }
    } catch (e) {
      console.error('Error fetching profile:', e)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return data
  }

  const signInWithPhonePassword = async (phone: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      phone: phone,
      password: password
    })
    if (error) throw error
    return data
  }

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })
    if (error) throw error
    return data
  }

  const sendOtp = async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      phone: phone
    })
    if (error) throw error
  }

  const verifyOtp = async (phone: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms'
    })
    if (error) throw error
    
    if (data.session) {
      session.value = data.session
      user.value = data.session.user
      await fetchProfile()
    }
    
    return !!data.session
  }

  const logout = async () => {
    await supabase.auth.signOut()
    user.value = null
    session.value = null
    profile.value = null
    router.push('/login')
  }

  return { 
    user, 
    session, 
    profile, 
    isAdmin, 
    isAuthenticated, 
    isInitialized,
    initializeAuth, 
    signIn, 
    signInWithPhonePassword,
    signUp, 
    sendOtp, 
    verifyOtp, 
    logout 
  }
})