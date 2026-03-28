<script setup lang="ts">
const route = useRoute()
const username = route.params.username as string

useHead({
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

useSeoMeta({
  title: `${username} — Nice To Meet You`,
  ogTitle: `${username} — Nice To Meet You`,
})

definePageMeta({ layout: 'default' })
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center">
    <p class="text-gray-400">Profile page for @{{ username }}</p>
  </div>
</template>
