import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'vue-router'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<any>(null)
  const session = ref<any>(null)
  const profile = ref<any>(null)
  const router = useRouter()

  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => profile.value?.role === 'admin')

  // بررسی وضعیت لاگین در شروع برنامه
  const initializeAuth = async () => {
    const { data } = await supabase.auth.getSession()
    session.value = data.session
    user.value = data.session?.user
    
    if (user.value) {
      await fetchProfile()
    }
    
    supabase.auth.onAuthStateChange(async (_event, _session) => {
      session.value = _session
      user.value = _session?.user
      if (user.value) {
        await fetchProfile()
      } else {
        profile.value = null
      }
    })
  }

  const fetchProfile = async () => {
    if (!user.value) return
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.value.id)
      .single()
    
    if (!error && data) {
      profile.value = data
    }
  }

  // لاگین با ایمیل و پسورد (استاندارد)
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return data
  }

  // لاگین با شماره موبایل و پسورد (برای ادمین یا کاربرانی که پسورد ست کرده‌اند)
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

  // ارسال OTP
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
    
    // آپدیت فوری استیت برای جلوگیری از تاخیر در ریدایرکت
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
    initializeAuth, 
    signIn, 
    signInWithPhonePassword, // متد جدید
    signUp, 
    sendOtp, 
    verifyOtp, 
    logout 
  }
})