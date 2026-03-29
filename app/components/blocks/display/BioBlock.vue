<script setup lang="ts">
import type { BioBlockData } from '~/types/blocks'
defineProps<{ data: BioBlockData }>()
</script>

<template>
  <div
    v-if="data.content"
    class="prose prose-sm max-w-none text-[var(--profile-text,#1a1a17)] [&_a]:text-[var(--profile-accent,#6e8761)]"
    v-html="data.content"
  />
  <p v-else class="text-sm italic text-warm-muted">Write your bio…</p>
</template>
