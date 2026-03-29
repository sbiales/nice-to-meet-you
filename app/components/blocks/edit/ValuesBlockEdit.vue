<script setup lang="ts">
import type { ValuesBlockData } from '~/types/blocks'
const props = defineProps<{ data: ValuesBlockData }>()
const emit = defineEmits<{ 'update:data': [data: ValuesBlockData] }>()
const tags = ref([...props.data.tags])
watch(tags, (v) => emit('update:data', { tags: [...v] }), { deep: true })
</script>
<template>
  <TagInput v-model="tags" label="Values" placeholder="Type a value, press Enter" />
</template>
