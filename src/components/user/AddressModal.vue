<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet Icons
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

const emit = defineEmits(['close', 'save'])

const form = ref({
  title: 'منزل',
  address: '',
  postal_code: '',
  phone: '',
  lat: null as number | null,
  lng: null as number | null
})

const mapLoading = ref(false)
let map: any = null
let marker: any = null
let L: any = null

const initMap = async () => {
  if (map) return // Prevent re-init

  // Dynamic import for SSG compatibility
  if (typeof window !== 'undefined') {
    try {
      const leafletModule = await import('leaflet')
      L = leafletModule.default

      let DefaultIcon = L.icon({
          iconUrl: icon,
          shadowUrl: iconShadow,
          iconSize: [25, 41],
          iconAnchor: [12, 41]
      });
      L.Marker.prototype.options.icon = DefaultIcon;

      const defaultLat = 35.6892
      const defaultLng = 51.3890

      map = L.map('map-container').setView([defaultLat, defaultLng], 13)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map)

      map.on('click', async (e: any) => {
        const { lat, lng } = e.latlng
        updateMarker(lat, lng)
        await getAddressFromCoords(lat, lng)
      })
    } catch (error) {
      console.error('Error loading Leaflet:', error)
    }
  }
}

const updateMarker = (lat: number, lng: number) => {
  if (!L) return

  if (marker) {
    marker.setLatLng([lat, lng])
  } else if (map) {
    marker = L.marker([lat, lng]).addTo(map)
  }
  form.value.lat = lat
  form.value.lng = lng
}

const getAddressFromCoords = async (lat: number, lng: number) => {
  mapLoading.value = true
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=fa`)
    const data = await response.json()
    if (data && data.display_name) {
      form.value.address = data.display_name
    }
  } catch (error) {
    console.error('Error fetching address:', error)
  } finally {
    mapLoading.value = false
  }
}

const submit = () => {
  emit('save', form.value)
}

onMounted(() => {
  // Wait for modal transition
  setTimeout(() => {
    initMap()
  }, 100)
})
</script>

<template>
  <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
    <div class="bg-white w-full max-w-lg rounded-2xl p-6 animate-scale-in my-8">
      <h3 class="font-bold text-lg mb-4">افزودن آدرس جدید</h3>
      
      <!-- Map Section -->
      <div class="mb-4">
        <label class="block text-sm font-bold text-stone-700 mb-2 flex items-center justify-between">
          موقعیت روی نقشه
          <span v-if="mapLoading" class="text-xs text-accent flex items-center gap-1">
            <Loader2 class="w-3 h-3 animate-spin" /> دریافت آدرس...
          </span>
          <span v-else class="text-xs text-stone-400 font-normal">برای انتخاب کلیک کنید</span>
        </label>
        <div id="map-container" class="w-full h-64 rounded-xl border border-stone-200 z-0"></div>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-bold text-stone-700 mb-2">عنوان آدرس</label>
          <div class="flex gap-2">
            <button 
              v-for="label in ['منزل', 'محل کار', 'دیگر']" 
              :key="label"
              @click="form.title = label"
              class="flex-1 py-2 rounded-lg text-sm border transition"
              :class="form.title === label ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-200 text-stone-600 hover:bg-stone-50'"
            >
              {{ label }}
            </button>
          </div>
        </div>
        <div>
          <label class="block text-sm font-bold text-stone-700 mb-2">آدرس پستی دقیق</label>
          <textarea v-model="form.address" rows="3" class="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-stone-900 outline-none placeholder-stone-300" placeholder="تهران، خیابان..."></textarea>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-bold text-stone-700 mb-2">کد پستی</label>
            <input v-model="form.postal_code" type="text" class="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-stone-900 outline-none dir-ltr" />
          </div>
          <div>
            <label class="block text-sm font-bold text-stone-700 mb-2">شماره تماس گیرنده</label>
            <input v-model="form.phone" type="tel" class="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-stone-900 outline-none dir-ltr" />
          </div>
        </div>
        <div class="flex gap-3 pt-4">
          <button @click="submit" class="flex-1 bg-stone-900 text-white py-3 rounded-xl font-bold hover:bg-accent transition">ثبت آدرس</button>
          <button @click="emit('close')" class="flex-1 bg-stone-100 text-stone-700 py-3 rounded-xl font-bold hover:bg-stone-200 transition">انصراف</button>
        </div>
      </div>
    </div>
  </div>
</template>