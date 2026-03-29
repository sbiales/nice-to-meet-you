<script setup lang="ts">
import type { LookingForBlockData } from '~/types/blocks'
defineProps<{ data: LookingForBlockData }>()
</script>
<template>
  <div>
    <div class="mb-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--profile-accent,#6e8761)]">
      Looking for
    </div>
    <p v-if="data.text" class="text-sm text-[var(--profile-text,#1a1a17)]">{{ data.text }}</p>
    <p v-else class="text-sm italic text-warm-muted">What are you looking for?</p>
  </div>
</template>
