<!-- app/components/editor/ThemeSidebar.vue -->
<script setup lang="ts">
import { THEME_PRESETS, type Theme, type ThemePresetName } from '~/types/theme'

const props = defineProps<{ theme: Theme }>()
const emit = defineEmits<{ 'update:theme': [theme: Theme] }>()

const presetNames = Object.keys(THEME_PRESETS) as ThemePresetName[]

const presetLabels: Record<ThemePresetName, string> = {
  'sage-linen': 'Sage & Linen',
  'midnight': 'Midnight',
  'blossom': 'Blossom',
  'bold': 'Bold',
  'golden-hour': 'Golden Hour',
  'paper': 'Paper',
}

function selectPreset(name: ThemePresetName) {
  emit('update:theme', { preset: name, ...THEME_PRESETS[name] })
}
</script>

<template>
  <aside class="flex h-full w-64 shrink-0 flex-col border-l border-warm-border bg-warm-card">
    <div class="border-b border-warm-border px-4 py-3">
      <h2 class="text-sm font-semibold text-warm-text">Theme</h2>
      <p class="mt-0.5 text-xs text-warm-muted">Full editor coming in Plan 4b</p>
    </div>
    <div class="flex-1 overflow-y-auto p-4">
      <p class="mb-3 text-xs font-medium text-warm-muted">Choose a preset</p>
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="name in presetNames"
          :key="name"
          :class="[
            'rounded-xl border-2 p-3 text-left transition-all',
            theme.preset === name ? 'border-sage-500' : 'border-transparent hover:border-warm-border',
          ]"
          :style="{
            backgroundColor: THEME_PRESETS[name].backgroundColor,
          }"
          @click="selectPreset(name)"
        >
          <!-- Color swatch strip -->
          <div class="mb-2 flex gap-0.5">
            <div class="h-2 w-3 rounded-sm" :style="{ backgroundColor: THEME_PRESETS[name].accentColor }" />
            <div class="h-2 w-3 rounded-sm" :style="{ backgroundColor: THEME_PRESETS[name].surfaceColor }" />
            <div class="h-2 w-3 rounded-sm" :style="{ backgroundColor: THEME_PRESETS[name].textColor }" />
          </div>
          <div class="text-xs font-medium" :style="{ color: THEME_PRESETS[name].textColor }">
            {{ presetLabels[name] }}
          </div>
        </button>
      </div>
    </div>
  </aside>
</template>
