<!-- app/components/editor/BlockEditor.vue -->
<script setup lang="ts">
import type { AnyBlock } from '~/types/blocks'

const props = defineProps<{ block: AnyBlock }>()
const emit = defineEmits<{ 'update:data': [data: AnyBlock['data']] }>()
</script>

<template>
  <BioBlockEdit
    v-if="props.block.type === 'bio'"
    :data="(props.block.data as any)"
    @update:data="emit('update:data', $event)"
  />
  <LookingForBlockEdit
    v-else-if="props.block.type === 'looking_for'"
    :data="(props.block.data as any)"
    @update:data="emit('update:data', $event)"
  />
  <InterestsBlockEdit
    v-else-if="props.block.type === 'interests'"
    :data="(props.block.data as any)"
    @update:data="emit('update:data', $event)"
  />
  <ValuesBlockEdit
    v-else-if="props.block.type === 'values'"
    :data="(props.block.data as any)"
    @update:data="emit('update:data', $event)"
  />
  <PronounsBlockEdit
    v-else-if="props.block.type === 'pronouns'"
    :data="(props.block.data as any)"
    @update:data="emit('update:data', $event)"
  />
  <LocationBlockEdit
    v-else-if="props.block.type === 'location'"
    :data="(props.block.data as any)"
    @update:data="emit('update:data', $event)"
  />
  <CurrentlyBlockEdit
    v-else-if="props.block.type === 'currently'"
    :data="(props.block.data as any)"
    @update:data="emit('update:data', $event)"
  />
  <QuoteBlockEdit
    v-else-if="props.block.type === 'quote'"
    :data="(props.block.data as any)"
    @update:data="emit('update:data', $event)"
  />
  <PhotoSingleBlockEdit
    v-else-if="props.block.type === 'photo_single'"
    :data="(props.block.data as any)"
    @update:data="emit('update:data', $event)"
  />
  <PhotoCarouselBlockEdit
    v-else-if="props.block.type === 'photo_carousel'"
    :data="(props.block.data as any)"
    @update:data="emit('update:data', $event)"
  />
  <VideoBlockEdit
    v-else-if="props.block.type === 'video'"
    :data="(props.block.data as any)"
    @update:data="emit('update:data', $event)"
  />
  <WebsitePreviewBlockEdit
    v-else-if="props.block.type === 'website_preview'"
    :data="(props.block.data as any)"
    @update:data="emit('update:data', $event)"
  />
  <SocialLinksBlockEdit
    v-else-if="props.block.type === 'social_links'"
    :data="(props.block.data as any)"
    @update:data="emit('update:data', $event)"
  />
  <ContactButtonBlockEdit
    v-else-if="props.block.type === 'contact_button'"
    :data="(props.block.data as any)"
    @update:data="emit('update:data', $event)"
  />
</template>
