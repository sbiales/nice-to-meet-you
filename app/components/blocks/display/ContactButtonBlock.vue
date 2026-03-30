<script setup lang="ts">
import type { ContactButtonBlockData } from '~/types/blocks'

defineProps<{ data: ContactButtonBlockData }>()
</script>

<template>
  <div class="flex justify-center">
    <button
      type="button"
      class="rounded-lg bg-gray-900 px-8 py-3 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
    >
      {{ data.label || 'Get in touch' }}
    </button>
  </div>
</template>
