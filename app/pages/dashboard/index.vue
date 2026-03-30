<!-- app/pages/dashboard/index.vue -->
<script setup lang="ts">
import { v4 as uuid } from 'uuid'
import { applyTheme } from '~/types/theme'
import type { BlockMeta, AnyBlock } from '~/types/blocks'

definePageMeta({ layout: 'dashboard', ssr: false, middleware: 'profile-required' })

const {
  blocks,
  theme,
  saveStatus,
  loadProfile,
  addBlock,
  updateBlockData,
  updateBlockWidth,
  removeBlock,
  reorderBlocks,
  setTheme,
  existingBlockTypes,
  newBlockId,
} = useProfile()

// Expose saveStatus to layout via provide so the nav can show it
provide('saveStatus', saveStatus)

// Apply theme CSS vars to the canvas whenever theme changes
const canvasRef = ref<HTMLElement | null>(null)
watchEffect(() => {
  if (canvasRef.value) applyTheme(canvasRef.value, theme.value)
})

// UI state
const showPicker = ref(false)
const editingBlockId = ref<string | null>(null)
const showTheme = ref(false)

const editingBlock = computed(() =>
  editingBlockId.value
    ? blocks.value.find(b => b.id === editingBlockId.value) ?? null
    : null
)

function handlePickerSelect(meta: BlockMeta) {
  const newBlock = {
    id: newBlockId(),
    type: meta.type,
    width: 'full' as const,
    data: { ...meta.defaultData },
  } as AnyBlock
  addBlock(newBlock)
  showPicker.value = false
  editingBlockId.value = newBlock.id
}

function handleUpdateData(id: string, data: AnyBlock['data']) {
  updateBlockData(id, data)
}

onMounted(loadProfile)
</script>

<template>
  <div class="flex h-[calc(100vh-56px)]">
    <!-- Canvas -->
    <div class="flex-1 overflow-y-auto">
      <div
        ref="canvasRef"
        class="min-h-full p-6 transition-colors duration-500"
        :style="{ backgroundColor: theme.backgroundColor }"
      >
        <div class="mx-auto max-w-2xl">
          <!-- Empty state -->
          <div
            v-if="blocks.length === 0"
            class="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-warm-border py-24 text-center"
          >
            <p class="mb-1 text-base font-medium text-warm-text">Your profile is empty</p>
            <p class="mb-6 text-sm text-warm-muted">Add blocks to start building your page</p>
            <AppButton @click="showPicker = true">+ Add your first block</AppButton>
          </div>

          <!-- Block canvas -->
          <BlockCanvas
            v-else
            :blocks="blocks"
            @update:blocks="reorderBlocks"
            @edit-block="editingBlockId = $event"
          />

          <!-- Add block button (when blocks exist) -->
          <div v-if="blocks.length > 0" class="mt-6 text-center">
            <AppButton variant="secondary" @click="showPicker = true">
              + Add block
            </AppButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Theme sidebar -->
    <ThemeSidebar
      v-if="showTheme"
      :theme="theme"
      @update:theme="setTheme"
    />
  </div>

  <!-- Theme toggle (floating) -->
  <div class="fixed bottom-6 right-6 z-30">
    <AppButton variant="secondary" @click="showTheme = !showTheme">
      🎨 {{ showTheme ? 'Close' : 'Theme' }}
    </AppButton>
  </div>

  <!-- Block picker modal -->
  <BlockPicker
    v-if="showPicker"
    :existing-block-types="existingBlockTypes()"
    @select="handlePickerSelect"
    @close="showPicker = false"
  />

  <!-- Block edit popup -->
  <BlockPopup
    v-if="editingBlock"
    :title="editingBlock.type.replace(/_/g, ' ')"
    :width="editingBlock.width"
    @update:width="updateBlockWidth(editingBlock.id, $event)"
    @delete="removeBlock(editingBlock.id)"
    @close="editingBlockId = null"
  >
    <BlockEditor
      :block="editingBlock"
      @update:data="handleUpdateData(editingBlock.id, $event)"
    />
  </BlockPopup>
</template>
