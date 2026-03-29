<script setup lang="ts">
import type { WebsitePreviewBlockData } from '~/types/blocks'

const props = defineProps<{ data: WebsitePreviewBlockData }>()

const { data: og, pending } = useFetch<{ title: string; image: string; description: string }>(
  `/api/og?url=${encodeURIComponent(props.data.url)}`,
  { key: `og-${props.data.url}` },
)
</script>

<template>
  <a
    v-if="data.url"
    :href="data.url"
    target="_blank"
    rel="noopener noreferrer"
    class="block rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow no-underline"
  >
    <img
      v-if="og?.image"
      :src="og.image"
      :alt="og?.title ?? 'Preview image'"
      class="w-full h-48 object-cover"
    />
    <div class="p-4">
      <p v-if="pending" class="text-sm text-gray-400">Loading preview…</p>
      <template v-else>
        <p class="font-medium text-gray-900 truncate">{{ og?.title || data.url }}</p>
        <p v-if="og?.description" class="text-sm text-gray-500 mt-1 line-clamp-2">
          {{ og.description }}
        </p>
        <p class="text-xs text-gray-400 mt-2 truncate">{{ data.url }}</p>
      </template>
    </div>
  </a>
  <div v-else class="p-4 text-sm text-gray-400">No URL set</div>
</template>
