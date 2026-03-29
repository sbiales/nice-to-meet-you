<script setup lang="ts">
import type { CurrentlyBlockData } from '~/types/blocks'
defineProps<{ data: CurrentlyBlockData }>()
</script>
<template>
  <div class="text-sm text-[var(--profile-text,#1a1a17)]">
    <span class="font-semibold">{{ data.label || 'Currently' }}:</span>
    <span v-if="data.value" class="ml-1.5">{{ data.value }}</span>
    <span v-else class="ml-1.5 italic text-warm-muted">Add something you're into right now</span>
  </div>
</template>
