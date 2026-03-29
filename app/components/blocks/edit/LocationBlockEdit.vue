<script setup lang="ts">
import type { LocationBlockData } from '~/types/blocks'
const props = defineProps<{ data: LocationBlockData }>()
const emit = defineEmits<{ 'update:data': [data: LocationBlockData] }>()
const text = ref(props.data.text)
watch(text, (v) => emit('update:data', { text: v }))
</script>
<template>
  <AppInput v-model="text" label="City or neighborhood" placeholder="Brooklyn, NY" />
</template>
