<script setup lang="ts">
definePageMeta({ layout: 'default' })

const sagePalette = [
  { name: '50', class: 'bg-sage-50', hex: '#f2f7f3' },
  { name: '100', class: 'bg-sage-100', hex: '#deeee2' },
  { name: '200', class: 'bg-sage-200', hex: '#beddca' },
  { name: '300', class: 'bg-sage-300', hex: '#93c5a9' },
  { name: '400', class: 'bg-sage-400', hex: '#64a685' },
  { name: '500', class: 'bg-sage-500', hex: '#6B9E76' },
  { name: '600', class: 'bg-sage-600', hex: '#4a7d57' },
  { name: '700', class: 'bg-sage-700', hex: '#3b6446' },
  { name: '800', class: 'bg-sage-800', hex: '#315139' },
  { name: '900', class: 'bg-sage-900', hex: '#294330' },
  { name: '950', class: 'bg-sage-950', hex: '#132419' },
]

const warmPalette = [
  { name: 'bg', class: 'bg-warm-bg', hex: '#FAFAF8', border: true },
  { name: 'card', class: 'bg-warm-card', hex: '#FFFFFF', border: true },
  { name: 'text', class: 'bg-warm-text', hex: '#1A1A17' },
  { name: 'muted', class: 'bg-warm-muted', hex: '#6B6860' },
  { name: 'border', class: 'bg-warm-border', hex: '#E5E0D8', border: true },
]
</script>

<template>
  <div class="mx-auto max-w-2xl px-6 py-16">
    <h1 class="text-3xl font-semibold text-warm-text">Nice To Meet You</h1>
    <p class="mt-2 text-warm-muted">Design token palette sampler</p>

    <section class="mt-10">
      <h2 class="text-lg font-medium text-warm-text">Sage</h2>
      <div class="mt-3 flex gap-2">
        <div v-for="swatch in sagePalette" :key="swatch.name" class="flex flex-col items-center gap-1">
          <div
            :class="[swatch.class, 'h-12 w-12 rounded-md shadow-sm']"
          />
          <span class="text-[10px] font-medium text-warm-muted">{{ swatch.name }}</span>
          <span class="text-[9px] text-warm-muted/70">{{ swatch.hex }}</span>
        </div>
      </div>
    </section>

    <section class="mt-10">
      <h2 class="text-lg font-medium text-warm-text">Warm</h2>
      <div class="mt-3 flex gap-2">
        <div v-for="swatch in warmPalette" :key="swatch.name" class="flex flex-col items-center gap-1">
          <div
            :class="[swatch.class, 'h-12 w-12 rounded-md shadow-sm', swatch.border && 'border border-warm-border']"
          />
          <span class="text-[10px] font-medium text-warm-muted">{{ swatch.name }}</span>
          <span class="text-[9px] text-warm-muted/70">{{ swatch.hex }}</span>
        </div>
      </div>
    </section>

    <section class="mt-10">
      <h2 class="text-lg font-medium text-warm-text">Components</h2>
      <div class="mt-4 space-y-4">
        <div class="flex flex-wrap gap-3">
          <AppButton variant="primary">Primary</AppButton>
          <AppButton variant="secondary">Secondary</AppButton>
          <AppButton variant="ghost">Ghost</AppButton>
          <AppButton variant="primary" loading>Loading</AppButton>
        </div>
        <div class="max-w-xs space-y-3">
          <AppInput label="Default input" placeholder="Placeholder text" />
          <AppInput label="With error" error="Something went wrong" />
          <AppInput label="With helper" helper="Helper text goes here" />
        </div>
        <AppCard>
          <p class="text-sm text-warm-muted">This is an AppCard with some content inside.</p>
        </AppCard>
      </div>
    </section>

    <section class="mt-10">
      <h2 class="text-lg font-medium text-warm-text">Typography</h2>
      <div class="mt-4 space-y-2">
        <p class="text-2xl font-semibold">DM Sans — Semibold 2xl</p>
        <p class="text-lg font-medium">DM Sans — Medium lg</p>
        <p class="text-sm">DM Sans — Regular sm</p>
        <p class="text-xs text-warm-muted">DM Sans — Muted xs</p>
      </div>
    </section>
  </div>
</template>
