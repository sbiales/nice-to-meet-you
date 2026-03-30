<script setup lang="ts">
import type { PhotoSingleBlockData } from '~/types/blocks'

const props = defineProps<{ data: PhotoSingleBlockData }>()

const config = useRuntimeConfig()

const imageUrl = computed(() =>
  props.data.storageKey
    ? `${config.public.storagePublicUrl}/${props.data.storageKey}`
    : null
)
</script>

<template>
  <figure v-if="imageUrl" class="m-0">
    <img
      :src="imageUrl"
      :alt="data.caption ?? 'Photo'"
      class="w-full rounded-lg object-cover max-h-96"
    />
    <figcaption
      v-if="data.caption"
      class="text-center text-sm text-gray-500 mt-2"
    >
      {{ data.caption }}
    </figcaption>
  </figure>
  <div v-else class="w-full h-48 flex items-center justify-center rounded-lg bg-gray-100 text-gray-400">
    <span>No photo</span>
  </div>
</template>
