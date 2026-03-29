<script setup lang="ts">
import type { CurrentlyBlockData } from '~/types/blocks'
const props = defineProps<{ data: CurrentlyBlockData }>()
const emit = defineEmits<{ 'update:data': [data: CurrentlyBlockData] }>()
const local = reactive({ ...props.data })
watch(local, (v) => emit('update:data', { label: v.label, value: v.value }), { deep: true })

const labelOptions = ['Reading', 'Watching', 'Listening to', 'Working on', 'Into', 'Obsessed with']
</script>
<template>
  <div class="flex flex-col gap-3">
    <div>
      <label class="mb-1.5 block text-sm font-medium text-warm-text">Label</label>
      <select
        v-model="local.label"
        class="w-full rounded-md border border-warm-border bg-warm-bg px-3 py-2 text-sm text-warm-text focus:outline-none focus:ring-2 focus:ring-sage-500"
      >
        <option v-for="opt in labelOptions" :key="opt" :value="opt">{{ opt }}</option>
      </select>
    </div>
    <AppInput v-model="local.value" label="What?" placeholder="e.g. Dune, The Bear, ambient music…" />
  </div>
</template>
