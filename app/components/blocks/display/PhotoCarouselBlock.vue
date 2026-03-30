<script setup lang="ts">
import type { PhotoCarouselBlockData } from '~/types/blocks'

const props = defineProps<{ data: PhotoCarouselBlockData }>()

const config = useRuntimeConfig()
const activeIndex = ref(0)

const imageUrls = computed(() =>
  props.data.photos.map(
    (p) => `${config.public.storagePublicUrl}/${p.storageKey}`
  )
)

function prev() {
  activeIndex.value = (activeIndex.value - 1 + imageUrls.value.length) % imageUrls.value.length
}

function next() {
  activeIndex.value = (activeIndex.value + 1) % imageUrls.value.length
}
</script>

<template>
  <div v-if="imageUrls.length > 0" class="relative w-full overflow-hidden rounded-lg">
    <!-- Images -->
    <div class="flex transition-transform duration-300" :style="{ transform: `translateX(-${activeIndex * 100}%)` }">
      <img
        v-for="(url, i) in imageUrls"
        :key="i"
        :src="url"
        alt="Carousel photo"
        class="w-full flex-shrink-0 object-cover max-h-96"
      />
    </div>

    <!-- Controls (only show if >1 photo) -->
    <template v-if="imageUrls.length > 1">
      <button
        class="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60"
        @click="prev"
      >&#8249;</button>
      <button
        class="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60"
        @click="next"
      >&#8250;</button>
      <!-- Dot indicators -->
      <div class="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
        <button
          v-for="(_, i) in imageUrls"
          :key="i"
          class="h-1.5 w-1.5 rounded-full transition-colors"
          :class="i === activeIndex ? 'bg-white' : 'bg-white/50'"
          @click="activeIndex = i"
        />
      </div>
    </template>
  </div>
  <div v-else class="w-full h-48 flex items-center justify-center rounded-lg bg-gray-100 text-gray-400">
    <span>No photos</span>
  </div>
</template>
