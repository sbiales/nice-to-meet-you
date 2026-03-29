<script setup lang="ts">
import type { QuoteBlockData } from '~/types/blocks'
defineProps<{ data: QuoteBlockData }>()
</script>
<template>
  <blockquote class="border-l-4 border-[var(--profile-accent,#6e8761)] pl-4">
    <p v-if="data.text" class="text-sm italic text-[var(--profile-text,#1a1a17)]">
      "{{ data.text }}"
    </p>
    <p v-else class="text-sm italic text-warm-muted">Your favorite quote…</p>
    <footer v-if="data.attribution" class="mt-1 text-xs text-[var(--profile-muted,#6b6860)]">
      — {{ data.attribution }}
    </footer>
  </blockquote>
</template>
