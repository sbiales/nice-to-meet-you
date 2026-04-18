<script setup lang="ts">
import { applyTheme } from '~/types/theme'
import type { Theme } from '~/types/theme'
import type { AnyBlock } from '~/types/blocks'

definePageMeta({ layout: 'default' })

const route = useRoute()
const username = route.params.username as string
const config = useRuntimeConfig()

// Fetch profile server-side (SSR) — 404s are handled by Nuxt error page
const { data: profile } = await useAsyncData(
  `profile-${username}`,
  () => $fetch<Record<string, unknown>>(`/api/profiles/${username}`),
  { lazy: false }
)

if (!profile.value) {
  throw createError({ statusCode: 404, message: 'Profile not found' })
}

const theme = computed(() => profile.value?.theme as Theme)
const blocks = computed(() => profile.value?.blocks as AnyBlock[] ?? [])
const status = computed(() => profile.value?.status as 'active' | 'taken' | 'paused')
const displayName = computed(() => profile.value?.displayName as string ?? '')
const taglinePrefix = computed(() => profile.value?.taglinePrefix as string | null ?? null)
const headerImageKey = computed(() => profile.value?.headerImageKey as string | null ?? null)
const isContactable = computed(() => profile.value?.isContactable as boolean ?? false)

// OG tags — set from SSR data
const bioBlock = computed(() => blocks.value.find(b => b.type === 'bio'))
const bioText = computed(() => {
  if (!bioBlock.value) return null
  const html = (bioBlock.value.data as { content: string }).content
  return html.replace(/<[^>]*>/g, '').trim().substring(0, 160) || null
})
const ogDescription = computed(
  () => bioText.value ?? `Check out ${displayName.value}'s profile on Nice To Meet You`
)
const ogImage = computed(() =>
  headerImageKey.value
    ? `${config.public.storagePublicUrl}/${headerImageKey.value}`
    : undefined
)

useHead({
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

useSeoMeta({
  title: displayName,
  ogTitle: displayName,
  description: ogDescription,
  ogDescription: ogDescription,
  ogImage: ogImage,
  ogUrl: `${config.public.appUrl}/${username}`,
})

// Apply theme CSS vars on the client after mount
const pageRef = ref<HTMLElement | null>(null)

onMounted(() => {
  if (pageRef.value && theme.value) {
    applyTheme(pageRef.value, theme.value)
  }
})

watch(theme, (t) => {
  if (pageRef.value && t) applyTheme(pageRef.value, t)
}, { deep: true })
</script>

<template>
  <div
    ref="pageRef"
    class="min-h-screen"
    :style="{ backgroundColor: theme?.backgroundColor }"
  >
    <!-- PAUSED: show themed shell + message, no profile content -->
    <template v-if="status === 'paused'">
      <div class="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p
          class="text-lg"
          :style="{ color: theme?.textColor, fontFamily: theme?.bodyFont }"
        >
          Sorry, {{ displayName }} has paused their profile.
        </p>
      </div>
      <ProfileStamp status="paused" />
    </template>

    <!-- ACTIVE or TAKEN: render full profile -->
    <template v-else>
      <ProfileHeaderDisplay
        :display-name="displayName"
        :tagline-prefix="taglinePrefix"
        :header-image-key="headerImageKey"
        :theme="theme"
      />

      <div class="mx-auto max-w-2xl space-y-4 px-4 py-6">
        <BlockRenderer
          v-for="block in blocks"
          :key="block.id"
          :block="block"
        />
      </div>

      <ContactForm
        v-if="isContactable && status === 'active'"
        :username="username"
      />

      <ProfileStamp v-if="status === 'taken'" status="taken" />
    </template>
  </div>
</template>
