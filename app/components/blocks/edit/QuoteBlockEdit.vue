<script setup lang="ts">
import type { QuoteBlockData } from '~/types/blocks'
const props = defineProps<{ data: QuoteBlockData }>()
const emit = defineEmits<{ 'update:data': [data: QuoteBlockData] }>()
const local = reactive({ ...props.data })
watch(local, (v) => emit('update:data', { text: v.text, attribution: v.attribution }), { deep: true })
</script>
<template>
  <div class="flex flex-col gap-3">
    <div>
      <label class="mb-1.5 block text-sm font-medium text-warm-text">Quote</label>
      <textarea
        v-model="local.text"
        rows="2"
        placeholder="A quote that resonates with you"
        class="w-full resize-none rounded-md border border-warm-border bg-warm-bg px-3 py-2 text-sm text-warm-text placeholder:text-warm-muted focus:outline-none focus:ring-2 focus:ring-sage-500"
      />
    </div>
    <AppInput v-model="local.attribution" label="Attribution (optional)" placeholder="— Author name" />
  </div>
</template>
