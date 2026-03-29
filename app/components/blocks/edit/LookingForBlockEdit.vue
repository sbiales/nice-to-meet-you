<script setup lang="ts">
import type { LookingForBlockData } from '~/types/blocks'
const props = defineProps<{ data: LookingForBlockData }>()
const emit = defineEmits<{ 'update:data': [data: LookingForBlockData] }>()
const text = ref(props.data.text)
watch(text, (v) => emit('update:data', { text: v }))
</script>
<template>
  <div>
    <label class="mb-1.5 block text-sm font-medium text-warm-text">
      What are you looking for?
    </label>
    <textarea
      v-model="text"
      rows="3"
      placeholder="e.g. New friends to explore the city with, or someone to grab coffee and talk about books"
      class="w-full resize-none rounded-md border border-warm-border bg-warm-bg px-3 py-2 text-sm text-warm-text placeholder:text-warm-muted focus:outline-none focus:ring-2 focus:ring-sage-500"
    />
  </div>
</template>
