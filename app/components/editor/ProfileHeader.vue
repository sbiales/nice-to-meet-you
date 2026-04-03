<!-- app/components/editor/ProfileHeader.vue -->
<script setup lang="ts">
import type { Theme } from '~/types/theme'

const props = defineProps<{
  displayName: string
  taglinePrefix: string | null
  headerImageKey: string | null
  theme: Theme
  uploading: boolean
}>()

const emit = defineEmits<{
  'update:taglinePrefix': [value: string | null]
  'update:displayName': [value: string]
  'upload-header-image': [file: File]
}>()

const config = useRuntimeConfig()
const bannerUrl = computed(() =>
  props.headerImageKey
    ? `${config.public.storagePublicUrl}/${props.headerImageKey}`
    : null
)

const TAGLINE_PRESETS = ['Hi, my name is', 'Meet', 'This is']

const isCustom = computed(
  () => props.taglinePrefix !== null && !TAGLINE_PRESETS.includes(props.taglinePrefix)
)
const customValue = ref(isCustom.value ? (props.taglinePrefix ?? '') : '')
const showCustomInput = ref(isCustom.value)

function selectPreset(preset: string) {
  showCustomInput.value = false
  emit('update:taglinePrefix', preset)
}

function clearTagline() {
  showCustomInput.value = false
  emit('update:taglinePrefix', null)
}

function openCustom() {
  showCustomInput.value = true
  customValue.value = isCustom.value ? (props.taglinePrefix ?? '') : ''
}

function commitCustom() {
  const trimmed = customValue.value.trim()
  emit('update:taglinePrefix', trimmed || null)
}

const fileInput = ref<HTMLInputElement | null>(null)

function handleFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) emit('upload-header-image', file)
}

const editingName = ref(false)
const nameInputRef = ref<HTMLInputElement | null>(null)
const localName = ref(props.displayName)

watch(() => props.displayName, (v) => { localName.value = v })

function startEditName() {
  editingName.value = true
  nextTick(() => nameInputRef.value?.focus())
}

function commitName() {
  editingName.value = false
  if (localName.value.trim()) emit('update:displayName', localName.value.trim())
  else localName.value = props.displayName
}
</script>

<template>
  <div>
    <!-- Tagline prefix picker -->
    <div class="mb-2 flex flex-wrap items-center gap-2">
      <button
        v-for="preset in TAGLINE_PRESETS"
        :key="preset"
        class="rounded-full border px-3 py-1 text-sm transition-colors"
        :class="taglinePrefix === preset
          ? 'border-transparent bg-warm-text text-white'
          : 'border-warm-border text-warm-muted hover:border-warm-text'"
        @click="selectPreset(preset)"
      >
        {{ preset }}
      </button>
      <button
        class="rounded-full border px-3 py-1 text-sm transition-colors"
        :class="isCustom
          ? 'border-transparent bg-warm-text text-white'
          : 'border-warm-border text-warm-muted hover:border-warm-text'"
        @click="openCustom"
      >
        Custom…
      </button>
      <button
        v-if="taglinePrefix !== null"
        class="rounded-full border border-warm-border px-3 py-1 text-sm text-warm-muted hover:border-red-400 hover:text-red-500"
        @click="clearTagline"
      >
        ✕ Remove
      </button>
    </div>

    <!-- Custom tagline input -->
    <div v-if="showCustomInput" class="mb-2 flex gap-2">
      <input
        v-model="customValue"
        class="flex-1 rounded-lg border border-warm-border bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-warm-text"
        placeholder="Write your own…"
        @keydown.enter="commitCustom"
        @blur="commitCustom"
      />
    </div>

    <!-- Banner area -->
    <div
      class="group relative h-44 w-full overflow-hidden rounded-xl sm:h-56"
      :style="{ backgroundColor: theme.backgroundColor }"
    >
      <img
        v-if="bannerUrl"
        :src="bannerUrl"
        alt=""
        class="h-full w-full object-cover"
      />

      <!-- Bottom gradient for text legibility -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

      <!-- Upload button — visible on hover -->
      <button
        class="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100"
        :disabled="uploading"
        @click="fileInput?.click()"
      >
        <span class="rounded-full bg-black/60 px-4 py-2 text-sm font-medium text-white">
          {{ uploading ? 'Uploading…' : bannerUrl ? 'Change banner' : '+ Add banner' }}
        </span>
      </button>

      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        class="hidden"
        @change="handleFileChange"
      />

      <!-- Name + tagline overlay at bottom center -->
      <div class="absolute inset-x-0 bottom-0 flex flex-col items-center pb-5 text-center">
        <p
          v-if="taglinePrefix"
          class="mb-1 text-sm"
          :style="{ color: 'rgba(255,255,255,0.8)', fontFamily: theme.bodyFont }"
        >
          {{ taglinePrefix }}
        </p>
        <button
          v-if="!editingName"
          class="text-2xl font-bold text-white sm:text-3xl"
          :style="{ fontFamily: theme.headingFont, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }"
          @click="startEditName"
        >
          {{ displayName }}
          <span class="ml-1 text-base opacity-50">✎</span>
        </button>
        <input
          v-else
          ref="nameInputRef"
          v-model="localName"
          class="rounded bg-black/30 px-3 py-1 text-center text-2xl font-bold text-white placeholder-white/50 focus:outline-none sm:text-3xl"
          :style="{ fontFamily: theme.headingFont }"
          placeholder="Your name"
          @keydown.enter="commitName"
          @blur="commitName"
        />
      </div>
    </div>
  </div>
</template>
