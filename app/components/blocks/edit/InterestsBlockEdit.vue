<script setup lang="ts">
import type { InterestsBlockData } from '~/types/blocks'
const props = defineProps<{ data: InterestsBlockData }>()
const emit = defineEmits<{ 'update:data': [data: InterestsBlockData] }>()
const tags = ref([...props.data.tags])
watch(tags, (v) => emit('update:data', { tags: [...v] }), { deep: true })
</script>
<template>
  <TagInput v-model="tags" label="Interests" placeholder="Type an interest, press Enter" />
</template>
