<script setup lang="ts">
import type { ValuesBlockData } from '~/types/blocks'
defineProps<{ data: ValuesBlockData }>()
</script>
<template>
  <div>
    <div class="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--profile-accent,#6e8761)]">
      Values
    </div>
    <div v-if="data.tags.length" class="flex flex-wrap gap-1.5">
      <span
        v-for="tag in data.tags"
        :key="tag"
        class="rounded-full border border-[var(--profile-accent,#6e8761)] px-3 py-1 text-sm text-[var(--profile-text,#1a1a17)]"
      >{{ tag }}</span>
    </div>
    <p v-else class="text-sm italic text-warm-muted">Add your values…</p>
  </div>
</template>
