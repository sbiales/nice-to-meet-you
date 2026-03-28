<!-- app/components/ui/AppInput.vue -->
<script setup lang="ts">
interface Props {
  label?: string
  error?: string
  helper?: string
  id?: string
}

defineProps<Props>()
const model = defineModel<string>()
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label
      v-if="label"
      :for="id"
      class="text-sm font-medium text-warm-text"
    >
      {{ label }}
    </label>
    <input
      :id="id"
      v-model="model"
      v-bind="$attrs"
      :class="[
        'w-full rounded-md border bg-warm-card px-3 py-2.5 text-sm text-warm-text',
        'placeholder:text-warm-muted/50 transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-0',
        error
          ? 'border-red-400 focus:ring-red-400'
          : 'border-warm-border hover:border-sage-300 focus:ring-sage-500',
      ]"
    />
    <p v-if="error" class="text-xs text-red-500">{{ error }}</p>
    <p v-else-if="helper" class="text-xs text-warm-muted">{{ helper }}</p>
  </div>
</template>
