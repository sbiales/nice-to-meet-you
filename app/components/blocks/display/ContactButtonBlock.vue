<script setup lang="ts">
import type { ContactButtonBlockData } from '~/types/blocks'

defineProps<{ data: ContactButtonBlockData }>()

function scrollToContact() {
  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <div class="flex justify-center">
    <button
      type="button"
      class="rounded-lg bg-gray-900 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-700"
      @click="scrollToContact"
    >
      {{ data.label || 'Get in touch' }}
    </button>
  </div>
</template>
