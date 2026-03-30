<script setup lang="ts">
import type { WebsitePreviewBlockData } from '~/types/blocks'

const props = defineProps<{ data: WebsitePreviewBlockData }>()
const emit = defineEmits<{ (e: 'update', data: WebsitePreviewBlockData): void }>()

const url = ref(props.data.url)

function isValidUrl(value: string): boolean {
  if (!value) return true // empty is OK (no error shown)
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

function onInput(value: string) {
  url.value = value
  emit('update', { ...props.data, url: value })
}
</script>

<template>
  <div class="space-y-2">
    <label class="block text-sm font-medium text-gray-700">Website URL</label>
    <input
      :value="url"
      type="url"
      placeholder="https://example.com"
      class="w-full rounded-md border px-3 py-2 text-sm"
      :class="{ 'border-red-400': url && !isValidUrl(url) }"
      @input="onInput(($event.target as HTMLInputElement).value)"
    />
    <p v-if="url && !isValidUrl(url)" class="text-xs text-red-500">
      Enter a valid URL starting with https://
    </p>
  </div>
</template>
