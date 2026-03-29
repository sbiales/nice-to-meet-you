<script setup lang="ts">
import type { LocationBlockData } from '~/types/blocks'
defineProps<{ data: LocationBlockData }>()
</script>
<template>
  <div class="flex items-center gap-2 text-sm text-[var(--profile-text,#1a1a17)]">
    <span>📍</span>
    <span v-if="data.text">{{ data.text }}</span>
    <span v-else class="italic text-warm-muted">Your location</span>
  </div>
</template>
