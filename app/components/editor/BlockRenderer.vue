<!-- app/components/editor/BlockRenderer.vue -->
<script setup lang="ts">
import type { AnyBlock } from '~/types/blocks'
defineProps<{ block: AnyBlock }>()
</script>

<template>
  <BioBlock v-if="block.type === 'bio'" :data="(block.data as any)" />
  <LookingForBlock v-else-if="block.type === 'looking_for'" :data="(block.data as any)" />
  <InterestsBlock v-else-if="block.type === 'interests'" :data="(block.data as any)" />
  <ValuesBlock v-else-if="block.type === 'values'" :data="(block.data as any)" />
  <PronounsBlock v-else-if="block.type === 'pronouns'" :data="(block.data as any)" />
  <LocationBlock v-else-if="block.type === 'location'" :data="(block.data as any)" />
  <CurrentlyBlock v-else-if="block.type === 'currently'" :data="(block.data as any)" />
  <QuoteBlock v-else-if="block.type === 'quote'" :data="(block.data as any)" />
  <PhotoSingleBlock v-else-if="block.type === 'photo_single'" :data="(block.data as any)" />
  <PhotoCarouselBlock v-else-if="block.type === 'photo_carousel'" :data="(block.data as any)" />
  <VideoBlock v-else-if="block.type === 'video'" :data="(block.data as any)" />
  <WebsitePreviewBlock v-else-if="block.type === 'website_preview'" :data="(block.data as any)" />
  <SocialLinksBlock v-else-if="block.type === 'social_links'" :data="(block.data as any)" />
  <ContactButtonBlock v-else-if="block.type === 'contact_button'" :data="(block.data as any)" />
</template>
