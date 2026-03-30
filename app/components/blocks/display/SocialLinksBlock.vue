<script setup lang="ts">
import type { SocialLinksBlockData, SocialPlatform } from '~/types/blocks'

defineProps<{ data: SocialLinksBlockData }>()

const PLATFORM_LABEL: Record<SocialPlatform, string> = {
  instagram: 'Instagram',
  spotify: 'Spotify',
  linkedin: 'LinkedIn',
  twitter: 'X (Twitter)',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  website: 'Website',
  other: 'Link',
}

const PLATFORM_ICON: Record<SocialPlatform, string> = {
  instagram: '📷',
  spotify: '🎵',
  linkedin: '💼',
  twitter: '🐦',
  tiktok: '🎬',
  youtube: '▶️',
  website: '🌐',
  other: '🔗',
}
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <a
      v-for="link in data.links.filter((l) => l.isVisible && l.url)"
      :key="link.platform"
      :href="link.url"
      target="_blank"
      rel="noopener noreferrer"
      class="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 no-underline"
    >
      <span>{{ PLATFORM_ICON[link.platform] }}</span>
      <span>{{ link.label || PLATFORM_LABEL[link.platform] }}</span>
    </a>
    <p v-if="!data.links.some((l) => l.isVisible && l.url)" class="text-sm text-gray-400">
      No links visible
    </p>
  </div>
</template>
