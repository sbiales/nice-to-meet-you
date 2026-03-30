<!-- app/components/ui/TagInput.vue -->
<script setup lang="ts">
interface Props {
  modelValue: string[]
  label?: string
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Type and press Enter',
})
const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>()

const inputValue = ref('')

function addTag() {
  const tag = inputValue.value.trim()
  if (tag && !props.modelValue.includes(tag)) {
    emit('update:modelValue', [...props.modelValue, tag])
  }
  inputValue.value = ''
}

function removeTag(tag: string) {
  emit('update:modelValue', props.modelValue.filter(t => t !== tag))
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault()
    addTag()
  } else if (e.key === 'Backspace' && !inputValue.value && props.modelValue.length) {
    removeTag(props.modelValue[props.modelValue.length - 1]!)
  }
}
</script>

<template>
  <div>
    <label v-if="label" class="mb-1.5 block text-sm font-medium text-warm-text">
      {{ label }}
    </label>
    <div
      class="flex min-h-[44px] flex-wrap gap-1.5 rounded-md border border-warm-border bg-warm-card px-3 py-2 focus-within:ring-2 focus-within:ring-sage-500 focus-within:ring-offset-2"
    >
      <span
        v-for="tag in modelValue"
        :key="tag"
        class="flex items-center gap-1 rounded-full bg-sage-100 px-2.5 py-0.5 text-sm text-sage-800"
      >
        {{ tag }}
        <button
          type="button"
          class="leading-none text-sage-500 hover:text-sage-900"
          @click="removeTag(tag)"
        >×</button>
      </span>
      <input
        v-model="inputValue"
        type="text"
        :placeholder="modelValue.length === 0 ? placeholder : ''"
        class="min-w-[120px] flex-1 bg-transparent text-sm text-warm-text outline-none placeholder:text-warm-muted"
        @keydown="handleKeydown"
        @blur="addTag"
      />
    </div>
  </div>
</template>
