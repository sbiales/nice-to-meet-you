<script setup lang="ts">
import type { ContactButtonBlockData } from '~/types/blocks'

const props = defineProps<{ data: ContactButtonBlockData }>()
const emit = defineEmits<{ (e: 'update', data: ContactButtonBlockData): void }>()

const label = ref(props.data.label)

function onInput(value: string) {
  label.value = value
  emit('update', { ...props.data, label: value })
}
</script>

<template>
  <div class="space-y-3">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Button label</label>
      <input
        :value="label"
        type="text"
        placeholder="Get in touch"
        maxlength="50"
        class="w-full rounded-md border px-3 py-2 text-sm"
        @input="onInput(($event.target as HTMLInputElement).value)"
      />
    </div>
    <!-- Live preview -->
    <div class="flex justify-center">
      <button
        type="button"
        class="rounded-lg bg-gray-900 px-8 py-3 text-sm font-semibold text-white"
      >
        {{ label || 'Get in touch' }}
      </button>
    </div>
    <p class="text-xs text-gray-400 text-center">
      The contact form will be connected in a later phase.
    </p>
  </div>
</template>
