<!-- app/components/editor/BlockCard.vue -->
<script setup lang="ts">
import type { AnyBlock } from '~/types/blocks'
defineProps<{ block: AnyBlock }>()
const emit = defineEmits<{ click: [] }>()
</script>

<template>
  <div
    class="group relative cursor-pointer rounded-[var(--profile-radius,10px)] border-2 border-transparent bg-[var(--profile-surface,#fff)] p-4 shadow-[var(--profile-shadow,none)] transition-all hover:border-sage-200"
    @click="emit('click')"
  >
    <!-- Drag handle — visible on hover -->
    <div
      class="drag-handle absolute left-1.5 top-1/2 -translate-y-1/2 cursor-grab select-none text-warm-muted opacity-0 group-hover:opacity-100"
      title="Drag to reorder"
    >⠿</div>
    <slot />
  </div>
</template>
