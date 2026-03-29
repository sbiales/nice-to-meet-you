<script setup lang="ts">
import { parseVideoUrl } from '~/utils/video'
import type { VideoBlockData } from '~/types/blocks'

const props = defineProps<{ data: VideoBlockData }>()
const emit = defineEmits<{ (e: 'update', data: VideoBlockData): void }>()

const url = ref(props.data.url)
const parseResult = computed(() => parseVideoUrl(url.value))
const isValid = computed(() => parseResult.value !== null || url.value === '')

function onInput(value: string) {
  url.value = value
  emit('update', { ...props.data, url: value })
}
</script>

<template>
  <div class="space-y-2">
    <label class="block text-sm font-medium text-gray-700">Video URL</label>
    <input
      :value="url"
      type="url"
      placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
      class="w-full rounded-md border px-3 py-2 text-sm"
      :class="{ 'border-red-400': !isValid }"
      @input="onInput(($event.target as HTMLInputElement).value)"
    />
    <p v-if="!isValid" class="text-xs text-red-500">
      Paste a YouTube or Vimeo URL
    </p>
    <p v-if="parseResult" class="text-xs text-gray-500">
      {{ parseResult.platform === 'youtube' ? '▶ YouTube' : '▶ Vimeo' }} video detected
    </p>
  </div>
</template>
