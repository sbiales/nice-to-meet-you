<script setup lang="ts">
import { parseVideoUrl, getEmbedUrl } from '~/utils/video'
import type { VideoBlockData } from '~/types/blocks'

const props = defineProps<{ data: VideoBlockData }>()

const embedInfo = computed(() => parseVideoUrl(props.data.url))
const embedUrl = computed(() => embedInfo.value ? getEmbedUrl(embedInfo.value) : null)
</script>

<template>
  <div v-if="embedUrl" class="aspect-video w-full overflow-hidden rounded-lg">
    <iframe
      :src="embedUrl"
      class="w-full h-full"
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
    />
  </div>
  <div v-else class="aspect-video w-full flex items-center justify-center rounded-lg bg-gray-100 text-gray-400">
    <span>{{ data.url ? 'Unrecognised video URL' : 'No video URL set' }}</span>
  </div>
</template>
