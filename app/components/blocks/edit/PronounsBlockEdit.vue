<script setup lang="ts">
import type { PronounsBlockData } from '~/types/blocks'
const props = defineProps<{ data: PronounsBlockData }>()
const emit = defineEmits<{ 'update:data': [data: PronounsBlockData] }>()

const PRESET_OPTIONS = ['she/her', 'he/him', 'they/them', 'she/they', 'he/they', 'any/all']
const isPreset = (v: string) => PRESET_OPTIONS.includes(v)

const selected = ref(isPreset(props.data.value) ? props.data.value : 'custom')
const customValue = ref(isPreset(props.data.value) ? '' : props.data.value)

function selectOption(opt: string) {
  selected.value = opt
  if (opt !== 'custom') {
    emit('update:data', { value: opt })
  }
}

watch(customValue, (v) => {
  if (selected.value === 'custom') {
    emit('update:data', { value: v })
  }
})
</script>
<template>
  <div class="flex flex-col gap-3">
    <label class="text-sm font-medium text-warm-text">Pronouns</label>
    <div class="flex flex-wrap gap-2">
      <button
        v-for="opt in [...PRESET_OPTIONS, 'custom']"
        :key="opt"
        :class="[
          'rounded-full border px-3 py-1 text-sm transition-colors',
          selected === opt
            ? 'border-sage-500 bg-sage-50 text-sage-700'
            : 'border-warm-border text-warm-muted hover:border-sage-300',
        ]"
        @click="selectOption(opt)"
      >{{ opt }}</button>
    </div>
    <AppInput
      v-if="selected === 'custom'"
      v-model="customValue"
      placeholder="e.g. xe/xem"
      label="Custom pronouns"
    />
  </div>
</template>
