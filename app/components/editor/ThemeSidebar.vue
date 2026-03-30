<!-- app/components/editor/ThemeSidebar.vue -->
<script setup lang="ts">
import type { Theme, ThemePresetName, BorderRadius, Shadow } from '~/types/theme'
import { THEME_PRESETS } from '~/types/theme'

const props = defineProps<{ theme: Theme }>()
const emit = defineEmits<{ 'update:theme': [theme: Theme] }>()

const PRESET_LABELS: Record<ThemePresetName, string> = {
  'sage-linen': 'Sage & Linen',
  'midnight': 'Midnight',
  'blossom': 'Blossom',
  'bold': 'Bold',
  'golden-hour': 'Golden Hour',
  'paper': 'Paper',
}

const FONTS = ['DM Sans', 'Inter', 'Playfair Display', 'Bebas Neue', 'Lato', 'Merriweather', 'IBM Plex Mono']

const RADIUS_OPTIONS: Array<{ value: BorderRadius; label: string }> = [
  { value: 'sharp', label: 'Sharp' },
  { value: 'soft', label: 'Soft' },
  { value: 'round', label: 'Round' },
]

const SHADOW_OPTIONS: Array<{ value: Shadow; label: string }> = [
  { value: 'flat', label: 'Flat' },
  { value: 'lifted', label: 'Lifted' },
]

const COLOR_FIELDS: Array<{ key: keyof Pick<Theme, 'backgroundColor' | 'surfaceColor' | 'textColor' | 'mutedColor' | 'accentColor'>; label: string }> = [
  { key: 'backgroundColor', label: 'Background' },
  { key: 'surfaceColor', label: 'Surface' },
  { key: 'textColor', label: 'Text' },
  { key: 'mutedColor', label: 'Muted' },
  { key: 'accentColor', label: 'Accent' },
]

function applyPreset(name: ThemePresetName) {
  emit('update:theme', { ...THEME_PRESETS[name], preset: name })
}

function updateColor(key: keyof Pick<Theme, 'backgroundColor' | 'surfaceColor' | 'textColor' | 'mutedColor' | 'accentColor'>, value: string) {
  emit('update:theme', { ...props.theme, preset: 'custom', [key]: value })
}

function updateFont(key: keyof Pick<Theme, 'headingFont' | 'bodyFont'>, value: string) {
  emit('update:theme', { ...props.theme, preset: 'custom', [key]: value })
}

function updateRadius(value: BorderRadius) {
  emit('update:theme', { ...props.theme, preset: 'custom', borderRadius: value })
}

function updateShadow(value: Shadow) {
  emit('update:theme', { ...props.theme, preset: 'custom', shadow: value })
}
</script>

<template>
  <div class="flex h-full flex-col overflow-y-auto border-l border-gray-200 bg-white p-4 w-64">
    <h3 class="mb-4 text-sm font-semibold text-gray-900">Theme</h3>

    <!-- Presets -->
    <section class="mb-6">
      <p class="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Presets</p>
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="(preset, name) in THEME_PRESETS"
          :key="name"
          type="button"
          :class="[
            'rounded-lg border-2 p-2 text-left text-xs transition-colors',
            theme.preset === name ? 'border-blue-500' : 'border-transparent hover:border-gray-300',
          ]"
          :style="{ backgroundColor: preset.backgroundColor, color: preset.textColor }"
          @click="applyPreset(name as ThemePresetName)"
        >
          {{ PRESET_LABELS[name as ThemePresetName] }}
        </button>
      </div>
    </section>

    <!-- Colors -->
    <section class="mb-6">
      <p class="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Colors</p>
      <div class="space-y-2">
        <div
          v-for="field in COLOR_FIELDS"
          :key="field.key"
          class="flex items-center justify-between"
        >
          <span class="text-xs text-gray-600">{{ field.label }}</span>
          <input
            type="color"
            :value="theme[field.key]"
            class="h-7 w-12 cursor-pointer rounded border border-gray-200 p-0.5"
            @input="updateColor(field.key, ($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>
    </section>

    <!-- Fonts -->
    <section class="mb-6">
      <p class="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Fonts</p>
      <div class="space-y-2">
        <div>
          <label class="mb-1 block text-xs text-gray-600">Heading</label>
          <select
            :value="theme.headingFont"
            class="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm"
            @change="updateFont('headingFont', ($event.target as HTMLSelectElement).value)"
          >
            <option v-for="font in FONTS" :key="font" :value="font">{{ font }}</option>
          </select>
        </div>
        <div>
          <label class="mb-1 block text-xs text-gray-600">Body</label>
          <select
            :value="theme.bodyFont"
            class="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm"
            @change="updateFont('bodyFont', ($event.target as HTMLSelectElement).value)"
          >
            <option v-for="font in FONTS" :key="font" :value="font">{{ font }}</option>
          </select>
        </div>
      </div>
    </section>

    <!-- Border radius -->
    <section class="mb-6">
      <p class="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Corner radius</p>
      <div class="flex gap-2">
        <button
          v-for="opt in RADIUS_OPTIONS"
          :key="opt.value"
          type="button"
          :class="[
            'flex-1 rounded-md border py-1.5 text-xs transition-colors',
            theme.borderRadius === opt.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-400',
          ]"
          @click="updateRadius(opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
    </section>

    <!-- Shadow -->
    <section>
      <p class="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Shadow</p>
      <div class="flex gap-2">
        <button
          v-for="opt in SHADOW_OPTIONS"
          :key="opt.value"
          type="button"
          :class="[
            'flex-1 rounded-md border py-1.5 text-xs transition-colors',
            theme.shadow === opt.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-400',
          ]"
          @click="updateShadow(opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
    </section>
  </div>
</template>
