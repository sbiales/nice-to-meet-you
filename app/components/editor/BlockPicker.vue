<!-- app/components/editor/BlockPicker.vue -->
<script setup lang="ts">
import { BLOCK_META, SINGLE_INSTANCE_BLOCKS, type BlockMeta, type BlockType } from '~/types/blocks'

interface Props {
  existingBlockTypes: BlockType[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  select: [meta: BlockMeta]
  close: []
}>()

function isDisabled(type: BlockType): boolean {
  return SINGLE_INSTANCE_BLOCKS.includes(type) && props.existingBlockTypes.includes(type)
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
      @click.self="emit('close')"
    />
    <div
      class="fixed inset-x-0 bottom-0 z-50 max-h-[75vh] overflow-y-auto rounded-t-2xl bg-warm-card shadow-xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl"
    >
      <div class="flex items-center justify-between border-b border-warm-border px-5 py-4">
        <h2 class="text-base font-semibold text-warm-text">Add a block</h2>
        <button class="text-warm-muted hover:text-warm-text" @click="emit('close')">✕</button>
      </div>
      <div class="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2">
        <button
          v-for="meta in BLOCK_META"
          :key="meta.type"
          :disabled="isDisabled(meta.type)"
          class="flex items-start gap-3 rounded-xl border border-warm-border p-3 text-left transition-colors hover:border-sage-300 hover:bg-sage-50 disabled:cursor-not-allowed disabled:opacity-40"
          @click="!isDisabled(meta.type) && emit('select', meta)"
        >
          <span class="mt-0.5 text-xl leading-none">{{ meta.icon }}</span>
          <div>
            <div class="text-sm font-medium text-warm-text">{{ meta.label }}</div>
            <div class="mt-0.5 text-xs text-warm-muted">{{ meta.description }}</div>
          </div>
        </button>
      </div>
    </div>
  </Teleport>
</template>
