<!-- app/layouts/dashboard.vue -->
<script setup lang="ts">
const { signOut } = useAuth()
const saveStatus = inject<Ref<string>>('saveStatus', ref('idle'))

async function handleSignOut() {
  await signOut()
  await navigateTo('/signin')
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-warm-bg">
    <nav class="sticky top-0 z-40 border-b border-warm-border bg-warm-card">
      <div class="flex h-14 items-center justify-between px-6">
        <NuxtLink to="/" class="font-handwriting text-xl text-sage-600">ntmy</NuxtLink>
        <div class="flex items-center gap-4">
          <span v-if="saveStatus === 'saving'" class="text-xs text-warm-muted">Saving…</span>
          <span v-else-if="saveStatus === 'saved'" class="text-xs text-sage-600">Saved ✓</span>
          <span v-else-if="saveStatus === 'error'" class="text-xs text-red-500">Failed to save</span>
          <button
            class="text-sm text-warm-muted transition-colors hover:text-warm-text"
            @click="handleSignOut"
          >Sign out</button>
        </div>
      </div>
    </nav>
    <slot />
  </div>
</template>
