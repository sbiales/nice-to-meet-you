<script setup lang="ts">
import type { SocialLinksBlockData, SocialLink, SocialPlatform } from '~/types/blocks'

const props = defineProps<{ data: SocialLinksBlockData }>()
const emit = defineEmits<{ (e: 'update', data: SocialLinksBlockData): void }>()

const ALL_PLATFORMS: SocialPlatform[] = [
  'instagram', 'spotify', 'linkedin', 'twitter', 'tiktok', 'youtube', 'website', 'other',
]

const PLATFORM_LABEL: Record<SocialPlatform, string> = {
  instagram: 'Instagram',
  spotify: 'Spotify',
  linkedin: 'LinkedIn',
  twitter: 'X (Twitter)',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  website: 'Website',
  other: 'Other',
}

// Build a complete list with a row per platform (merge existing data)
const links = ref<SocialLink[]>(
  ALL_PLATFORMS.map((platform) => {
    const existing = props.data.links.find((l) => l.platform === platform)
    return existing ?? { platform, url: '', label: '', isVisible: false }
  })
)

function emitUpdate() {
  emit('update', { links: links.value.map((l) => ({ ...l })) })
}

function toggleVisible(index: number) {
  const link = links.value[index]
  if (!link) return
  link.isVisible = !link.isVisible
  emitUpdate()
}

function updateUrl(index: number, url: string) {
  const link = links.value[index]
  if (!link) return
  link.url = url
  emitUpdate()
}
</script>

<template>
  <div class="space-y-2">
    <div
      v-for="(link, i) in links"
      :key="link.platform"
      class="rounded-lg border border-gray-200 p-3"
    >
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-gray-700">{{ PLATFORM_LABEL[link.platform] }}</span>
        <button
          type="button"
          class="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200"
          :class="link.isVisible ? 'bg-green-500' : 'bg-gray-200'"
          @click="toggleVisible(i)"
        >
          <span
            class="inline-block h-4 w-4 translate-y-0.5 rounded-full bg-white shadow transition-transform duration-200"
            :class="link.isVisible ? 'translate-x-4' : 'translate-x-0.5'"
          />
        </button>
      </div>
      <input
        v-if="link.isVisible"
        :value="link.url"
        type="url"
        :placeholder="`Your ${PLATFORM_LABEL[link.platform]} URL`"
        class="mt-2 w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm"
        @input="updateUrl(i, ($event.target as HTMLInputElement).value)"
      />
    </div>
  </div>
</template>
