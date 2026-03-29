<script setup lang="ts">
import type { InterestsBlockData } from '~/types/blocks'
defineProps<{ data: InterestsBlockData }>()
</script>
<template>
  <div>
    <div class="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--profile-accent,#6e8761)]">
      Interests
    </div>
    <div v-if="data.tags.length" class="flex flex-wrap gap-1.5">
      <span
        v-for="tag in data.tags"
        :key="tag"
        class="rounded-full bg-[var(--profile-surface,#fff)] px-3 py-1 text-sm text-[var(--profile-text,#1a1a17)] shadow-sm ring-1 ring-black/5"
      >{{ tag }}</span>
    </div>
    <p v-else class="text-sm italic text-warm-muted">Add your interests…</p>
  </div>
</template>
