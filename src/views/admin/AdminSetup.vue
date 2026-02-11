<script setup lang="ts">
import { ref } from 'vue'
import { createClient } from '@supabase/supabase-js'

const loading = ref(false)
const message = ref('')
const isError = ref(false)

const form = ref({
  serviceKey: '',
  mobile: '09369619510',
  password: 'admin123',
  fullName: 'مدیر سیستم'
})

const createOrFixAdmin = async () => {
  if (!form.value.serviceKey) {
    message.value = 'لطفا Service Role Key را وارد کنید'
    isError.value = true
    return
  }

  if (form.value.password.length < 6) {
    message.value = 'رمز عبور باید حداقل ۶ کاراکتر باشد'
    isError.value = true
    return
  }

  loading.value = true
  message.value = 'در حال برقراری ارتباط با سرور...'
  isError.value = false

  try {
    // 1. ساخت کلاینت ادمین با دسترسی کامل
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const adminClient = createClient(supabaseUrl, form.value.serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 2. فرمت استاندارد شماره (+98)
    let phone = form.value.mobile.trim()
    phone = phone.replace(/[^\d+]/g, '')
    if (phone.startsWith('09')) phone = '+98' + phone.substring(1)
    else if (phone.startsWith('9')) phone = '+98' + phone

    console.log('Target Phone:', phone)
    message.value = 'در حال بررسی حساب کاربری...'

    // 3. تلاش برای ساخت کاربر
    const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
      phone: phone,
      password: form.value.password,
      email_confirm: true,
      phone_confirm: true,
      user_metadata: {
        full_name: form.value.fullName,
        role: 'admin' // این متا دیتا برای تریگرها مفید است
      }
    })

    let userId = createData.user?.id

    // 4. مدیریت حالت "کاربر تکراری"
    if (createError) {
      if (createError.message?.includes('registered') || createError.message?.includes('exists') || createError.status === 422) {
        console.log('User exists. Finding user ID...')
        message.value = 'کاربر یافت شد. در حال بروزرسانی اطلاعات...'
        
        // پیدا کردن ID کاربر از لیست کاربران
        const { data: listData } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
        // جستجو با فرمت‌های مختلف شماره
        const searchPhone = phone.replace('+98', '')
        const foundUser = listData.users.find(u => u.phone?.includes(searchPhone))
        
        if (foundUser) {
          userId = foundUser.id
          
          // آپدیت پسورد کاربر موجود
          await adminClient.auth.admin.updateUserById(userId, {
            password: form.value.password,
            user_metadata: { role: 'admin', full_name: form.value.fullName }
          })
        } else {
          throw new Error('شماره موبایل در سیستم ثبت شده اما ID کاربر یافت نشد. لطفا کاربر را دستی از پنل Supabase پاک کنید.')
        }
      } else {
        throw createError
      }
    }

    if (!userId) throw new Error('شناسه کاربر (User ID) یافت نشد.')

    // 5. اعمال نقش ادمین در جدول profiles
    message.value = 'در حال تنظیم دسترسی مدیریت...'
    
    // کمی صبر برای اطمینان از اجرای تریگر دیتابیس (ساخت اولیه پروفایل)
    await new Promise(r => setTimeout(r, 2000))

    // تلاش برای آپدیت پروفایل (با نام ستون صحیح: phone)
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({
        role: 'admin',
        full_name: form.value.fullName,
        phone: phone, // نام ستون طبق اسکرین‌شات شما phone است
      })
      .eq('id', userId)

    if (updateError) {
      // اگر آپدیت فیل کرد، شاید ردیف هنوز ساخته نشده، پس اینسرت میکنیم
      console.log('Update failed, trying upsert...', updateError)
      const { error: upsertError } = await adminClient
        .from('profiles')
        .upsert({
          id: userId,
          role: 'admin',
          full_name: form.value.fullName,
          phone: phone
        })
      
      if (upsertError) throw upsertError
    }

    // 6. بررسی نهایی (Verification)
    const { data: finalProfile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (finalProfile?.role === 'admin') {
      message.value = '✅ تبریک! حساب ادمین با موفقیت ساخته/آپدیت شد. اکنون می‌توانید لاگین کنید.'
      isError.value = false
    } else {
      message.value = '⚠️ هشدار: عملیات انجام شد اما نقش کاربر در دیتابیس هنوز "admin" نیست. لطفا ستون role را در جدول profiles دستی چک کنید.'
      isError.value = true
    }

  } catch (e: any) {
    console.error(e)
    message.value = '❌ خطا: ' + (e.message || e)
    isError.value = true
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-100 font-sans">
    <div class="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border-t-4 border-indigo-600">
      <div class="text-center mb-6">
        <h1 class="text-2xl font-black text-slate-800">پنل نجات اضطراری</h1>
        <p class="text-xs text-slate-400 mt-1">نسخه اصلاح شده (Fix Column Name)</p>
      </div>
      
      <div v-if="message" class="p-4 rounded-xl mb-6 text-sm font-bold leading-relaxed" :class="isError ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'">
        {{ message }}
      </div>

      <form @submit.prevent="createOrFixAdmin" class="space-y-4">
        <div class="bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-xs text-yellow-800 leading-relaxed">
          <strong class="block mb-1">نکته مهم:</strong>
          مطمئن شوید که <strong>Service Role Key</strong> (کلید مخفی با دسترسی کامل) را وارد می‌کنید، نه Anon Key را.
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-500 mb-1">Service Role Key</label>
          <input v-model="form.serviceKey" type="password" required class="w-full p-3 border border-slate-200 rounded-xl dir-ltr text-left font-mono text-xs focus:border-indigo-500 outline-none transition-colors" placeholder="eyJhbGciOiJIUzI1NiIsIn..." />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-500 mb-1">شماره موبایل</label>
            <input v-model="form.mobile" type="text" class="w-full p-3 border border-slate-200 rounded-xl dir-ltr text-left focus:border-indigo-500 outline-none transition-colors" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 mb-1">رمز عبور جدید</label>
            <input v-model="form.password" type="text" class="w-full p-3 border border-slate-200 rounded-xl dir-ltr text-left focus:border-indigo-500 outline-none transition-colors" />
          </div>
        </div>

        <button :disabled="loading" type="submit" class="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex justify-center items-center gap-2">
          <span v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          <span>{{ loading ? 'در حال پردازش...' : 'اعمال نقش ادمین' }}</span>
        </button>
      </form>

      <div class="mt-6 text-center pt-4 border-t border-slate-100">
        <router-link to="/login" class="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">
          بازگشت به صفحه ورود
        </router-link>
      </div>
    </div>
  </div>
</template>