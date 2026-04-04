<!-- app/components/profile/ProfileHeaderDisplay.vue -->
<script setup lang="ts">
import type { Theme } from '~/types/theme'

const props = defineProps<{
  displayName: string
  taglinePrefix: string | null
  headerImageKey: string | null
  theme: Theme
}>()

const config = useRuntimeConfig()
const bannerUrl = computed(() =>
  props.headerImageKey
    ? `${config.public.storagePublicUrl}/${props.headerImageKey}`
    : null
)
</script>

<template>
  <div
    class="relative h-44 w-full overflow-hidden sm:h-56"
    :style="{ backgroundColor: theme.backgroundColor }"
  >
    <img
      v-if="bannerUrl"
      :src="bannerUrl"
      :alt="`${displayName}'s banner`"
      class="h-full w-full object-cover"
    />

    <!-- Bottom gradient for text legibility -->
    <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

    <!-- Name + tagline at bottom center -->
    <div class="absolute inset-x-0 bottom-0 flex flex-col items-center pb-5 text-center">
      <p
        v-if="taglinePrefix"
        class="mb-1 text-sm"
        :style="{ color: 'rgba(255,255,255,0.8)', fontFamily: theme.bodyFont }"
      >
        {{ taglinePrefix }}
      </p>
      <h1
        class="text-2xl font-bold text-white sm:text-3xl"
        :style="{ fontFamily: theme.headingFont, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }"
      >
        {{ displayName }}
      </h1>
    </div>
  </div>
</template>
