<script setup lang="ts">
import { ArrowLeft, ArrowDown, Star, Play, Leaf, ShieldCheck, Truck } from 'lucide-vue-next'
import ProductCard from '@/components/ProductCard.vue'
import { useHead } from '@vueuse/head'

// تنظیمات سئو صفحه اصلی
useHead({
  title: 'خانه', // به صورت خودکار تبدیل می‌شود به: خانه | فروشگاه حصیرباف
  meta: [
    { name: 'description', content: 'فروشگاه اینترنتی حصیرباف، عرضه کننده مستقیم انواع سبد، گلدان، زیرانداز و محصولات دکوراتیو حصیری با بهترین کیفیت و قیمت.' },
    { property: 'og:title', content: 'فروشگاه صنایع دستی حصیری | هنر دست‌بافت طبیعت' },
    { property: 'og:description', content: 'زیبایی خام طبیعت را به فضای مدرن خانه خود بیاورید. خرید آنلاین محصولات حصیری جنوب.' },
    { property: 'og:image', content: 'https://images.unsplash.com/photo-1595867627368-2354583e56b6?auto=format&fit=crop&q=80&w=600' },
  ]
})

// داده‌های محصولات با تصاویر واقعی و تست شده
const featuredProducts = [
  { 
    id: 1, 
    title: 'سبد حصیری مدل آوا', 
    price: 450000, 
    category: 'سبد', 
    image: 'https://images.unsplash.com/photo-1595867627368-2354583e56b6?auto=format&fit=crop&q=80&w=600', 
    isNew: true 
  },
  { 
    id: 2, 
    title: 'گلدان پایه دار بامبو', 
    price: 280000, 
    category: 'گلدان', 
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4f9d?auto=format&fit=crop&q=80&w=600', 
    discount: 10 
  },
  { 
    id: 3, 
    title: 'لوستر حصیری روستیک', 
    price: 850000, 
    category: 'دکوراتیو', 
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=600' 
  },
  { 
    id: 4, 
    title: 'باکس نظم دهنده', 
    price: 120000, 
    category: 'نظم دهنده', 
    image: 'https://images.unsplash.com/photo-1584589167171-541ce45f1eea?auto=format&fit=crop&q=80&w=600' 
  },
]
</script>

<template>
  <div class="bg-stone-50 overflow-hidden">
    
    <!-- 1. HERO SECTION -->
    <section class="relative min-h-screen flex items-center pt-20 bg-grain">
      <!-- Background Shape -->
      <div class="absolute top-0 right-0 w-3/4 h-full bg-[#f0ebe6] rounded-bl-[150px] -z-10 hidden lg:block"></div>
      
      <div class="container mx-auto px-4 md:px-8">
        <div class="grid lg:grid-cols-12 gap-8 items-center">
          
          <!-- Text Content -->
          <div class="lg:col-span-5 space-y-8 relative z-10">
            <div class="inline-flex items-center gap-2 px-4 py-2 border border-stone-800 rounded-full text-xs font-bold tracking-widest uppercase text-stone-800 animate-slide-up delay-100 bg-white/50 backdrop-blur-sm">
              <span class="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
              کالکشن جدید ۱۴۰۳
            </div>
            
            <h1 class="text-5xl md:text-7xl lg:text-8xl font-black text-stone-900 leading-[0.95] tracking-tighter animate-slide-up delay-200">
              هنرِ <br/>
              <!-- اصلاح فونت: استفاده از فونت وزیرمتن با وزن کمتر برای تمایز -->
              <span class="text-stone-500 font-light pr-2 font-sans">دست‌بافت</span> <br/>
              طبیعت
            </h1>
            
            <p class="text-lg text-stone-600 max-w-md leading-relaxed animate-slide-up delay-300 font-medium">
              ما زیبایی خام طبیعت را به فضای مدرن خانه شما می‌آوریم. هر قطعه داستانی دارد که با دستان هنرمندان جنوب بافته شده است.
            </p>
            
            <div class="flex items-center gap-4 pt-4 animate-slide-up delay-400">
              <router-link to="/products" class="group bg-stone-900 text-white px-8 py-4 rounded-full font-bold hover:bg-stone-800 transition-all duration-300 flex items-center gap-2 shadow-xl shadow-stone-900/20 hover:shadow-stone-900/40 hover:-translate-y-1">
                خرید محصولات
                <ArrowLeft class="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </router-link>
              <button class="w-14 h-14 rounded-full border border-stone-300 flex items-center justify-center hover:border-stone-900 hover:bg-stone-50 transition duration-300 group">
                <Play class="w-5 h-5 fill-stone-900 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>

          <!-- Hero Image Composition -->
          <div class="lg:col-span-7 relative h-[600px] hidden md:block">
            <!-- Main Image (لینک جدید شما) -->
            <div class="absolute top-10 right-10 w-[450px] h-[550px] rounded-t-[250px] rounded-b-[40px] overflow-hidden shadow-2xl animate-float z-10">
              <img src="https://plus.unsplash.com/premium_photo-1661436362044-50ccd76c690c?q=80&w=687&auto=format&fit=crop" class="w-full h-full object-cover hover:scale-105 transition duration-1000" alt="Hero Main">
              <!-- Overlay Gradient -->
              <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
            
            <!-- Floating Card 1 (Social Proof) -->
            <div class="absolute bottom-24 right-[400px] bg-white/90 backdrop-blur-md p-5 rounded-2xl shadow-xl max-w-[220px] animate-slide-up delay-500 z-20 border border-white/50">
              <div class="flex items-center gap-2 mb-3">
                <div class="flex -space-x-3 space-x-reverse">
                  <img src="https://i.pravatar.cc/100?img=1" class="w-10 h-10 rounded-full border-2 border-white" />
                  <img src="https://i.pravatar.cc/100?img=5" class="w-10 h-10 rounded-full border-2 border-white" />
                  <img src="https://i.pravatar.cc/100?img=3" class="w-10 h-10 rounded-full border-2 border-white" />
                </div>
                <span class="text-sm font-bold text-stone-800 mr-2">+۲k مشتری</span>
              </div>
              <p class="text-xs text-stone-500 leading-tight">رضایت مشتریان ما اعتبار ماست. به خانواده بزرگ حصیرباف بپیوندید.</p>
            </div>

            <!-- Floating Card 2 (Product Teaser - لینک دوم شما) -->
            <div class="absolute top-20 -left-8 bg-white p-4 rounded-2xl shadow-2xl animate-float delay-700 z-0 rotate-[-6deg] hover:rotate-0 transition duration-500">
              <img src="https://images.unsplash.com/photo-1641559564912-971904fc74da?q=80&w=687&auto=format&fit=crop" class="w-40 h-40 object-cover rounded-xl mb-3">
              <div class="flex justify-between items-center">
                <div>
                  <div class="text-xs text-stone-500">پرفروش</div>
                  <div class="text-sm font-bold text-stone-800">ست حصیری</div>
                </div>
                <span class="text-sm font-bold text-accent bg-accent/10 px-2 py-1 rounded-lg">۴۵۰,۰۰۰</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Scroll Indicator -->
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce hidden md:block cursor-pointer opacity-50 hover:opacity-100 transition">
        <ArrowDown class="w-6 h-6 text-stone-800" />
      </div>
    </section>

    <!-- 2. MARQUEE (Infinite Scroll) -->
    <div class="bg-stone-900 py-8 overflow-hidden whitespace-nowrap relative -rotate-1 scale-105 my-12 shadow-2xl z-20">
      <div class="inline-block animate-marquee">
        <span class="text-stone-500 text-3xl font-black mx-12 uppercase tracking-widest">صنایع دستی اصیل</span>
        <span class="text-white text-3xl font-serif mx-12 italic">Handmade with Love</span>
        <span class="text-stone-500 text-3xl font-black mx-12 uppercase tracking-widest">ارسال رایگان</span>
        <span class="text-white text-3xl font-serif mx-12 italic">Organic Materials</span>
        <span class="text-stone-500 text-3xl font-black mx-12 uppercase tracking-widest">ضمانت بازگشت</span>
        <span class="text-white text-3xl font-serif mx-12 italic">Sustainable Design</span>
        <span class="text-stone-500 text-3xl font-black mx-12 uppercase tracking-widest">صنایع دستی اصیل</span>
        <span class="text-white text-3xl font-serif mx-12 italic">Handmade with Love</span>
      </div>
    </div>

    <!-- 3. BENTO GRID CATEGORIES -->
    <section class="py-24 container mx-auto px-4 md:px-8">
      <div class="flex flex-col md:flex-row justify-between items-end mb-12">
        <div>
          <h2 class="text-4xl md:text-5xl font-black text-stone-900 mb-4 tracking-tight">دسته‌بندی‌ها</h2>
          <p class="text-stone-500 text-lg">انتخابی برای هر گوشه از خانه شما</p>
        </div>
        <router-link to="/products" class="group text-stone-900 font-bold border-b-2 border-stone-900 pb-1 hover:text-accent hover:border-accent transition mt-6 md:mt-0 flex items-center gap-2">
          مشاهده همه
          <ArrowLeft class="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        </router-link>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-6 h-[700px]">
        <!-- Large Item (دکوراسیون داخلی) -->
        <div class="md:col-span-2 md:row-span-2 relative group overflow-hidden rounded-[40px] cursor-pointer shadow-lg">
          <img src="https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&q=80&w=800" class="w-full h-full object-cover transition duration-700 group-hover:scale-110" alt="Living Room">
          <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition duration-500"></div>
          <div class="absolute bottom-10 right-10 text-white transform translate-y-4 group-hover:translate-y-0 transition duration-500">
            <h3 class="text-4xl font-bold mb-2">دکوراسیون داخلی</h3>
            <p class="opacity-90 text-base font-light">زیبایی را به خانه دعوت کنید</p>
          </div>
        </div>
        
        <!-- Medium Item (سبد و باکس - اصلاح شده) -->
        <div class="md:col-span-1 md:row-span-2 relative group overflow-hidden rounded-[40px] cursor-pointer shadow-lg">
          <img src="https://images.unsplash.com/photo-1595867627368-2354583e56b6?auto=format&fit=crop&q=80&w=600" class="w-full h-full object-cover transition duration-700 group-hover:scale-110" alt="Baskets">
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div class="absolute bottom-8 right-8 text-white">
            <h3 class="text-2xl font-bold mb-1">سبد و باکس</h3>
            <p class="opacity-80 text-sm">نظم دهنده های طبیعی</p>
          </div>
        </div>

        <!-- Small Item 1 (گلدان - اصلاح شده) -->
        <div class="relative group overflow-hidden rounded-[40px] cursor-pointer shadow-lg">
          <img src="https://images.unsplash.com/photo-1463320898484-cdee8141c787?auto=format&fit=crop&q=80&w=400" class="w-full h-full object-cover transition duration-700 group-hover:scale-110" alt="Plants">
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div class="absolute bottom-6 right-6 text-white">
            <h3 class="text-xl font-bold">گلدان</h3>
          </div>
        </div>

        <!-- Small Item 2 (CTA) -->
        <div class="relative group overflow-hidden rounded-[40px] cursor-pointer bg-accent text-white flex flex-col justify-center items-center text-center p-6 shadow-lg hover:bg-accent-dark transition duration-300">
          <div class="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4 text-3xl animate-pulse">✨</div>
          <h3 class="text-2xl font-bold mb-2">کالکشن جدید</h3>
          <p class="text-sm opacity-90">محصولات تابستانه رسید</p>
          <ArrowLeft class="w-6 h-6 mt-4 group-hover:-translate-x-2 transition-transform" />
        </div>
      </div>
    </section>

    <!-- 4. FEATURED PRODUCTS -->
    <section class="py-24 bg-white rounded-t-[80px] relative z-10 shadow-[0_-20px_60px_rgba(0,0,0,0.05)]">
      <div class="container mx-auto px-4 md:px-8">
        <div class="text-center max-w-3xl mx-auto mb-20">
          <span class="text-accent font-bold tracking-[0.2em] text-xs uppercase mb-4 block">منتخب هفته</span>
          <h2 class="text-4xl md:text-6xl font-black text-stone-900 mb-6 tracking-tight">پرفروش‌ترین‌های ما</h2>
          <p class="text-stone-500 text-lg">محصولاتی که بیشترین طرفدار را در بین مشتریان خوش‌سلیقه ما داشته‌اند.</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <ProductCard v-for="product in featuredProducts" :key="product.id" :product="product" />
        </div>
        
        <div class="mt-20 text-center">
          <router-link to="/products" class="inline-block border-2 border-stone-200 text-stone-800 px-12 py-4 rounded-full font-bold hover:bg-stone-900 hover:text-white hover:border-stone-900 transition duration-300">
            مشاهده تمام محصولات
          </router-link>
        </div>
      </div>
    </section>

    <!-- 5. FEATURES (Icons) -->
    <section class="py-20 bg-stone-50 border-b border-stone-200">
      <div class="container mx-auto px-4">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div class="flex flex-col items-center gap-4 group">
            <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition duration-300 text-stone-700">
              <Leaf class="w-8 h-8" />
            </div>
            <h3 class="font-bold text-lg">مواد اولیه طبیعی</h3>
            <p class="text-sm text-stone-500">سازگار با محیط زیست</p>
          </div>
          <div class="flex flex-col items-center gap-4 group">
            <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition duration-300 text-stone-700">
              <ShieldCheck class="w-8 h-8" />
            </div>
            <h3 class="font-bold text-lg">تضمین کیفیت</h3>
            <p class="text-sm text-stone-500">۷ روز ضمانت بازگشت</p>
          </div>
          <div class="flex flex-col items-center gap-4 group">
            <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition duration-300 text-stone-700">
              <Truck class="w-8 h-8" />
            </div>
            <h3 class="font-bold text-lg">ارسال سریع</h3>
            <p class="text-sm text-stone-500">به سراسر ایران</p>
          </div>
          <div class="flex flex-col items-center gap-4 group">
            <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition duration-300 text-stone-700">
              <Star class="w-8 h-8" />
            </div>
            <h3 class="font-bold text-lg">دست‌ساز</h3>
            <p class="text-sm text-stone-500">هنر اصیل ایرانی</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 6. STORY SECTION (Immersive) -->
    <section class="py-32 bg-stone-900 text-stone-100 relative overflow-hidden">
      <!-- Decorative Elements -->
      <div class="absolute -top-40 -left-40 w-[600px] h-[600px] bg-stone-800 rounded-full blur-[100px] opacity-40"></div>
      <div class="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/20 rounded-full blur-[100px] opacity-30"></div>
      
      <div class="container mx-auto px-4 md:px-8 relative z-10">
        <div class="grid md:grid-cols-2 gap-20 items-center">
          <div class="space-y-10">
            <h2 class="text-5xl md:text-7xl font-black leading-[1.1]">
              هر گره، <br/>
              <span class="text-accent">قصه‌ای دارد.</span>
            </h2>
            <p class="text-stone-400 text-xl leading-relaxed font-light">
              در دنیای ماشینی امروز، ما به اصالت بازگشته‌ایم. محصولات ما در کارخانه‌های بزرگ تولید نمی‌شوند؛ بلکه در خانه‌های روستایی، با صدای لالایی مادران و گرمای آفتاب جنوب بافته می‌شوند. خرید شما، حمایت از یک رویاست.
            </p>
            
            <div class="grid grid-cols-2 gap-12 pt-8 border-t border-stone-800">
              <div>
                <div class="text-4xl font-black text-white mb-2">۱۰۰٪</div>
                <div class="text-sm text-stone-500 uppercase tracking-wider">مواد طبیعی</div>
              </div>
              <div>
                <div class="text-4xl font-black text-white mb-2">۵۰۰+</div>
                <div class="text-sm text-stone-500 uppercase tracking-wider">خانواده تحت پوشش</div>
              </div>
            </div>
          </div>
          
          <div class="relative group">
            <div class="absolute inset-0 bg-accent rounded-[50px] rotate-6 group-hover:rotate-3 transition duration-500 opacity-20"></div>
            <img src="https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?auto=format&fit=crop&q=80&w=800" class="relative rounded-[50px] rotate-3 group-hover:rotate-0 transition duration-700 shadow-2xl border-4 border-stone-800 grayscale group-hover:grayscale-0" alt="Weaving">
            
            <div class="absolute -bottom-10 -right-10 bg-stone-100 text-stone-900 p-8 rounded-3xl shadow-xl max-w-xs hidden md:block animate-float delay-300">
              <div class="flex gap-1 text-yellow-500 mb-3">
                <Star class="w-5 h-5 fill-current" v-for="i in 5" :key="i" />
              </div>
              <p class="text-base font-bold italic leading-relaxed">"کیفیت محصولات فوق‌العاده است. حس طبیعت رو کاملا منتقل میکنه."</p>
              <p class="text-sm text-stone-500 mt-4 text-left font-bold">- سارا م.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 7. NEWSLETTER -->
    <section class="py-24 bg-[#eaddd7] relative overflow-hidden">
      <div class="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/woven.png')]"></div>
      <div class="container mx-auto px-4 text-center relative z-10">
        <h2 class="text-4xl font-black text-stone-900 mb-6">عضویت در خبرنامه</h2>
        <p class="text-stone-600 mb-10 text-lg">برای اطلاع از تخفیف‌ها و محصولات جدید ایمیل خود را وارد کنید.</p>
        <div class="max-w-lg mx-auto flex bg-white p-2 rounded-full shadow-2xl transform hover:scale-105 transition duration-300">
          <input type="email" placeholder="ایمیل شما..." class="flex-grow px-8 bg-transparent outline-none text-stone-700 placeholder-stone-400 text-lg">
          <button class="bg-stone-900 text-white px-10 py-4 rounded-full font-bold hover:bg-accent transition duration-300">عضویت</button>
        </div>
      </div>
    </section>

  </div>
</template>

<style scoped>
.animate-marquee {
  animation: marquee 30s linear infinite;
}
@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(50%); }
}
</style>