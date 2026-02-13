import { createClient } from '@supabase/supabase-js'

// دریافت اطلاعات از متغیرهای محیطی (Environment Variables)
// این روش امن است و اطلاعات در کد ذخیره نمی‌شوند
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// نکته مهم برای بیلد:
// اگر متغیرهای محیطی ست نشده باشند (مثلاً در سرور بیلد)، از مقادیر ساختگی معتبر استفاده می‌کنیم
// تا فرآیند بیلد با خطای "Invalid URL" متوقف نشود.
// این مقادیر ساختگی هیچ دسترسی واقعی ایجاد نمی‌کنند.
const validUrl = supabaseUrl || 'https://placeholder-project.supabase.co'
const validKey = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MTYxNjE2MTYsImV4cCI6MTkyMTkyMTkyMX0.placeholder_signature_for_build_process'

export const supabase = createClient(validUrl, validKey)