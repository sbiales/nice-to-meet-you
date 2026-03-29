<!-- app/components/editor/BlockCanvas.vue -->
<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'
import type { AnyBlock } from '~/types/blocks'

const props = defineProps<{ blocks: AnyBlock[] }>()
const emit = defineEmits<{
  'update:blocks': [blocks: AnyBlock[]]
  'edit-block': [id: string]
}>()

const localBlocks = computed({
  get: () => props.blocks,
  set: (val) => emit('update:blocks', val),
})
</script>

<template>
  <VueDraggable
    v-model="localBlocks"
    handle=".drag-handle"
    :animation="200"
    class="flex flex-wrap gap-3"
  >
    <div
      v-for="block in localBlocks"
      :key="block.id"
      :class="block.width === 'half' ? 'w-[calc(50%-6px)]' : 'w-full'"
    >
      <BlockCard :block="block" @click="emit('edit-block', block.id)">
        <BlockRenderer :block="block" />
      </BlockCard>
    </div>
  </VueDraggable>
</template>
