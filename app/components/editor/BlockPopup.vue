<!-- app/components/editor/BlockPopup.vue -->
<script setup lang="ts">
interface Props {
  title: string
  width: 'full' | 'half'
}

defineProps<Props>()
const emit = defineEmits<{
  close: []
  'update:width': [value: 'full' | 'half']
  delete: []
}>()

const confirmingDelete = ref(false)

function handleDelete() {
  if (confirmingDelete.value) {
    emit('delete')
    emit('close')
  } else {
    confirmingDelete.value = true
  }
}

function handleClose() {
  confirmingDelete.value = false
  emit('close')
}

onMounted(() => {
  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') handleClose()
  }
  document.addEventListener('keydown', onKey)
  onUnmounted(() => document.removeEventListener('keydown', onKey))
})
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <div
      class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
      @click.self="handleClose"
    />
    <!-- Panel: bottom sheet on mobile, centered modal on sm+ -->
    <div
      class="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl bg-warm-card shadow-xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl"
    >
      <!-- Header -->
      <div class="flex shrink-0 items-center justify-between border-b border-warm-border px-5 py-4">
        <h2 class="text-base font-semibold text-warm-text">{{ title }}</h2>
        <button
          class="text-warm-muted transition-colors hover:text-warm-text"
          @click="handleClose"
        >✕</button>
      </div>

      <!-- Block-specific edit form -->
      <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <slot />
      </div>

      <!-- Footer: width toggle + delete -->
      <div class="shrink-0 border-t border-warm-border px-5 py-3">
        <div class="mb-3 flex items-center gap-2">
          <span class="text-xs text-warm-muted">Width:</span>
          <button
            :class="[
              'rounded px-2.5 py-1 text-xs font-medium transition-colors',
              width === 'full'
                ? 'bg-sage-500 text-white'
                : 'border border-warm-border text-warm-muted hover:bg-warm-bg',
            ]"
            @click="emit('update:width', 'full')"
          >Full</button>
          <button
            :class="[
              'rounded px-2.5 py-1 text-xs font-medium transition-colors',
              width === 'half'
                ? 'bg-sage-500 text-white'
                : 'border border-warm-border text-warm-muted hover:bg-warm-bg',
            ]"
            @click="emit('update:width', 'half')"
          >Half</button>
        </div>

        <button
          v-if="!confirmingDelete"
          class="w-full rounded-md py-2 text-sm text-red-500 transition-colors hover:bg-red-50"
          @click="handleDelete"
        >Delete block</button>
        <div v-else class="flex gap-2">
          <button
            class="flex-1 rounded-md py-2 text-sm text-warm-muted transition-colors hover:bg-warm-bg"
            @click="confirmingDelete = false"
          >Cancel</button>
          <button
            class="flex-1 rounded-md bg-red-500 py-2 text-sm text-white transition-colors hover:bg-red-600"
            @click="handleDelete"
          >Yes, delete</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
