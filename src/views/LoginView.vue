<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { useRouter } from 'vue-router'
import { Loader2, Smartphone, KeyRound, ArrowRight, RefreshCw, Timer } from 'lucide-vue-next'

// --- State ---
const loginMethod = ref<'otp' | 'password'>('otp') // حالت پیش‌فرض: رمز یکبار مصرف
const step = ref<'phone' | 'verify'>('phone')
const phone = ref('')
const password = ref('')
const otpCode = ref('')
const loading = ref(false)

// --- Timer State ---
const timerValue = ref(0)
const timerInterval = ref<any>(null)
const canResend = computed(() => timerValue.value === 0)

const authStore = useAuthStore()
const toastStore = useToastStore()
const router = useRouter()

// --- Lifecycle ---
onMounted(() => {
  if (authStore.isAuthenticated) {
    router.push('/profile')
  }
})

onUnmounted(() => {
  if (timerInterval.value) clearInterval(timerInterval.value)
})

// --- Helpers ---
const formatPhoneNumber = (input: string) => {
  let p = input.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
  p = p.trim()
  // حذف کاراکترهای غیر عددی به جز +
  p = p.replace(/[^\d+]/g, '')

  if (p.startsWith('09')) return '+98' + p.substring(1)
  if (p.startsWith('9') && p.length === 10) return '+98' + p
  if (p.startsWith('98') && p.length === 12) return '+' + p
  
  return p
}

const formattedTimer = computed(() => {
  const minutes = Math.floor(timerValue.value / 60)
  const seconds = timerValue.value % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

const startTimer = (seconds = 120) => {
  if (timerInterval.value) clearInterval(timerInterval.value)
  timerValue.value = seconds
  timerInterval.value = setInterval(() => {
    if (timerValue.value > 0) {
      timerValue.value--
    } else {
      clearInterval(timerInterval.value)
    }
  }, 1000)
}

// --- Actions ---

// 1. ارسال کد OTP
const handleSendOtp = async () => {
  if (phone.value.length < 10) {
    toastStore.showToast('لطفا شماره موبایل معتبر وارد کنید', 'warning')
    return
  }
  
  loading.value = true
  
  try {
    const formattedPhone = formatPhoneNumber(phone.value)
    await authStore.sendOtp(formattedPhone)
    
    step.value = 'verify'
    startTimer(120) // شروع تایمر ۲ دقیقه‌ای
    toastStore.showToast('کد تایید ارسال شد', 'success')
  } catch (e: any) {
    console.error(e)
    toastStore.showToast(e.message || 'خطا در ارسال کد', 'error')
  } finally {
    loading.value = false
  }
}

// 2. تایید کد OTP
const handleVerifyOtp = async () => {
  if (otpCode.value.length < 6) return

  loading.value = true
  try {
    const formattedPhone = formatPhoneNumber(phone.value)
    const success = await authStore.verifyOtp(formattedPhone, otpCode.value)
    
    if (success) {
      toastStore.showToast('خوش آمدید!', 'success')
      router.push('/profile')
    }
  } catch (e: any) {
    console.error(e)
    toastStore.showToast('کد وارد شده نامعتبر است', 'error')
  } finally {
    loading.value = false
  }
}

// 3. ورود با پسورد (برای ادمین)
const handlePasswordLogin = async () => {
  if (phone.value.length < 10 || !password.value) {
    toastStore.showToast('لطفا شماره و رمز عبور را وارد کنید', 'warning')
    return
  }

  loading.value = true
  try {
    const formattedPhone = formatPhoneNumber(phone.value)
    const { user } = await authStore.signInWithPhonePassword(formattedPhone, password.value)
    
    if (user) {
      toastStore.showToast('ورود موفقیت آمیز بود', 'success')
      // اگر ادمین بود بره به پنل ادمین، اگر نه پروفایل
      if (authStore.isAdmin) {
        router.push('/admin')
      } else {
        router.push('/profile')
      }
    }
  } catch (e: any) {
    console.error(e)
    toastStore.showToast('شماره موبایل یا رمز عبور اشتباه است', 'error')
  } finally {
    loading.value = false
  }
}

// 4. تغییر شماره (بازگشت به مرحله اول)
const changeNumber = () => {
  step.value = 'phone'
  otpCode.value = ''
  if (timerInterval.value) clearInterval(timerInterval.value)
}
</script>

<template>
  <div class="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-stone-50">
    <div class="bg-white w-full max-w-md rounded-3xl shadow-xl border border-stone-100 overflow-hidden">
      
      <!-- Header / Tabs -->
      <div class="flex border-b border-stone-100">
        <button 
          @click="loginMethod = 'otp'; step = 'phone'"
          class="flex-1 py-4 text-sm font-bold transition flex items-center justify-center gap-2"
          :class="loginMethod === 'otp' ? 'bg-white text-stone-900 border-b-2 border-stone-900' : 'bg-stone-50 text-stone-500 hover:bg-stone-100'"
        >
          <Smartphone class="w-4 h-4" />
          رمز یکبار مصرف
        </button>
        <button 
          @click="loginMethod = 'password'"
          class="flex-1 py-4 text-sm font-bold transition flex items-center justify-center gap-2"
          :class="loginMethod === 'password' ? 'bg-white text-stone-900 border-b-2 border-stone-900' : 'bg-stone-50 text-stone-500 hover:bg-stone-100'"
        >
          <KeyRound class="w-4 h-4" />
          رمز عبور ثابت
        </button>
      </div>

      <div class="p-8">
        
        <!-- Title -->
        <div class="text-center mb-8">
          <h1 class="text-2xl font-black text-stone-800 mb-2">
            {{ loginMethod === 'otp' ? 'ورود با شماره موبایل' : 'ورود با رمز عبور' }}
          </h1>
          <p class="text-stone-500 text-sm">
            {{ loginMethod === 'otp' ? 'کد تایید برای شما پیامک خواهد شد' : 'ویژه مدیران و کاربران دارای رمز عبور' }}
          </p>
        </div>

        <!-- MODE 1: OTP LOGIN -->
        <div v-if="loginMethod === 'otp'" class="animate-fade-in">
          
          <!-- Step 1: Phone Input -->
          <div v-if="step === 'phone'" class="space-y-5">
            <div>
              <label class="block text-xs font-bold text-stone-600 mb-2 mr-1">شماره موبایل</label>
              <div class="relative">
                <input 
                  v-model="phone" 
                  type="tel" 
                  placeholder="0912..." 
                  class="w-full px-4 py-3.5 rounded-xl border border-stone-200 focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none transition text-left dir-ltr font-mono text-lg tracking-wider"
                  @keyup.enter="handleSendOtp"
                />
                <Smartphone class="w-5 h-5 text-stone-400 absolute right-3 top-4" />
              </div>
            </div>
            
            <button 
              @click="handleSendOtp" 
              :disabled="loading"
              class="w-full bg-stone-900 text-white py-3.5 rounded-xl font-bold hover:bg-accent transition flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg shadow-stone-900/20"
            >
              <Loader2 v-if="loading" class="animate-spin w-5 h-5" />
              <span v-else>دریافت کد تایید</span>
              <ArrowRight v-if="!loading" class="w-4 h-4" />
            </button>
          </div>

          <!-- Step 2: Verify Code -->
          <div v-else class="space-y-6">
            <div class="bg-stone-50 p-4 rounded-xl border border-stone-100 flex justify-between items-center">
              <span class="text-stone-600 font-mono font-bold text-lg">{{ phone }}</span>
              <button @click="changeNumber" class="text-xs text-blue-600 font-bold hover:underline">ویرایش شماره</button>
            </div>

            <div>
              <label class="block text-xs font-bold text-stone-600 mb-2 mr-1 text-center">کد تایید را وارد کنید</label>
              <input 
                v-model="otpCode" 
                type="text" 
                placeholder="- - - - - -" 
                class="w-full px-4 py-4 rounded-xl border border-stone-200 focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none transition text-center text-3xl tracking-[0.5em] font-mono"
                maxlength="6"
                @keyup.enter="handleVerifyOtp"
                autofocus
              />
            </div>

            <!-- Timer & Resend -->
            <div class="flex justify-between items-center text-sm">
              <div v-if="!canResend" class="flex items-center gap-1 text-stone-500">
                <Timer class="w-4 h-4" />
                <span class="font-mono">{{ formattedTimer }}</span>
                <span>تا ارسال مجدد</span>
              </div>
              <button 
                v-else 
                @click="handleSendOtp" 
                class="flex items-center gap-1 text-blue-600 font-bold hover:underline"
              >
                <RefreshCw class="w-4 h-4" />
                ارسال مجدد کد
              </button>
            </div>

            <button 
              @click="handleVerifyOtp" 
              :disabled="loading || otpCode.length < 6"
              class="w-full bg-stone-900 text-white py-3.5 rounded-xl font-bold hover:bg-accent transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-stone-900/20"
            >
              <Loader2 v-if="loading" class="animate-spin w-5 h-5" />
              <span v-else>ورود به حساب</span>
            </button>
          </div>
        </div>

        <!-- MODE 2: PASSWORD LOGIN -->
        <div v-else class="space-y-5 animate-fade-in">
          <div>
            <label class="block text-xs font-bold text-stone-600 mb-2 mr-1">شماره موبایل</label>
            <div class="relative">
              <input 
                v-model="phone" 
                type="tel" 
                placeholder="0912..." 
                class="w-full px-4 py-3.5 rounded-xl border border-stone-200 focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none transition text-left dir-ltr font-mono text-lg tracking-wider"
              />
              <Smartphone class="w-5 h-5 text-stone-400 absolute right-3 top-4" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-stone-600 mb-2 mr-1">رمز عبور</label>
            <div class="relative">
              <input 
                v-model="password" 
                type="password" 
                placeholder="••••••••" 
                class="w-full px-4 py-3.5 rounded-xl border border-stone-200 focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none transition text-left dir-ltr"
                @keyup.enter="handlePasswordLogin"
              />
              <KeyRound class="w-5 h-5 text-stone-400 absolute right-3 top-4" />
            </div>
          </div>

          <div class="text-left">
            <a href="#" class="text-xs text-stone-400 hover:text-stone-600 transition">رمز عبور را فراموش کرده‌اید؟</a>
          </div>

          <button 
            @click="handlePasswordLogin" 
            :disabled="loading"
            class="w-full bg-stone-900 text-white py-3.5 rounded-xl font-bold hover:bg-accent transition flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg shadow-stone-900/20"
          >
            <Loader2 v-if="loading" class="animate-spin w-5 h-5" />
            <span v-else>ورود با رمز عبور</span>
          </button>
        </div>

      </div>
    </div>
  </div>
</template>