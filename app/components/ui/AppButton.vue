<!-- app/components/ui/AppButton.vue -->
<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'ghost'
  type?: 'button' | 'submit' | 'reset'
  loading?: boolean
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  type: 'button',
  loading: false,
  disabled: false,
})
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[
      'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors duration-150',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      variant === 'primary' && 'bg-sage-500 text-white hover:bg-sage-600 active:bg-sage-700',
      variant === 'secondary' && 'border border-warm-border bg-warm-card text-warm-text hover:bg-warm-bg',
      variant === 'ghost' && 'text-warm-muted hover:bg-warm-bg hover:text-warm-text',
    ]"
  >
    <span
      v-if="loading"
      class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden="true"
    />
    <slot />
  </button>
</template>
