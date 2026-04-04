<!-- app/components/profile/ProfileStamp.vue -->
<script setup lang="ts">
defineProps<{
  status: 'paused' | 'taken'
}>()
</script>

<template>
  <div
    class="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
    aria-hidden="true"
  >
    <span
      class="rotate-[-45deg] border-[6px] border-black px-8 py-2 text-5xl font-black uppercase tracking-widest text-black opacity-20 sm:text-7xl"
    >
      {{ status }}
    </span>
  </div>
</template>
