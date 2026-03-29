<script setup lang="ts">
import type { PronounsBlockData } from '~/types/blocks'
defineProps<{ data: PronounsBlockData }>()
</script>
<template>
  <div
    class="inline-flex items-center gap-1.5 rounded-full border border-[var(--profile-accent,#6e8761)] px-3 py-1 text-sm text-[var(--profile-accent,#6e8761)]"
  >
    <span>🏷️</span>
    <span v-if="data.value">{{ data.value }}</span>
    <span v-else class="italic text-warm-muted">Your pronouns</span>
  </div>
</template>
