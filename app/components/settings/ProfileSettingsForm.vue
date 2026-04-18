<script setup lang="ts">
import { validateUsername, usernameErrorMessage } from '~/lib/username-validator'

const props = defineProps<{
  username: string
  slug: string
  publicUrl: string
  email: string
  status: 'active' | 'paused' | 'taken'
  isContactable: boolean
  saveSlug: (newSlug: string) => Promise<{ error?: string }>
}>()

const emit = defineEmits<{
  'update:status': [value: 'active' | 'paused' | 'taken']
  'update:isContactable': [value: boolean]
}>()

const statusDescriptions = {
  active: 'Your profile is visible and discoverable. People can view all your blocks and contact you.',
  paused: 'Your profile is hidden. Visitors see a "paused" message instead of your content.',
  taken: 'Your profile is visible but marked as taken. Visitors see your full profile with a "taken" banner overlay.',
}

const selectedStatus = computed({
  get: () => props.status,
  set: (value) => emit('update:status', value),
})

// Slug editing state
const isEditingSlug = ref(false)
const newSlug = ref('')
const slugSaving = ref(false)
const slugError = ref('')
const slugSuccess = ref(false)
const slugAvailable = ref<boolean | null>(null)
const checkingSlug = ref(false)
let slugDebounceTimer: ReturnType<typeof setTimeout> | null = null

const slugValidation = computed(() => validateUsername(newSlug.value))
const slugFormatError = computed(() =>
  newSlug.value ? usernameErrorMessage(slugValidation.value) : ''
)

function startEditingSlug() {
  newSlug.value = props.slug
  slugAvailable.value = null
  slugError.value = ''
  slugSuccess.value = false
  isEditingSlug.value = true
}

function cancelEditSlug() {
  isEditingSlug.value = false
  slugError.value = ''
}

watch(newSlug, (val) => {
  slugAvailable.value = null
  slugError.value = ''
  if (slugDebounceTimer) clearTimeout(slugDebounceTimer)
  if (!val || !slugValidation.value.valid || val === props.slug) return

  checkingSlug.value = true
  slugDebounceTimer = setTimeout(async () => {
    try {
      const result = await $fetch<{ available: boolean }>(
        `/api/profiles/check-slug?slug=${encodeURIComponent(val)}`
      )
      slugAvailable.value = result.available
    } finally {
      checkingSlug.value = false
    }
  }, 300)
})

const canSaveSlug = computed(() =>
  slugValidation.value.valid &&
  (newSlug.value === props.slug || slugAvailable.value === true) &&
  !checkingSlug.value &&
  newSlug.value !== ''
)

async function handleSaveSlug() {
  if (!canSaveSlug.value) return
  slugSaving.value = true
  slugError.value = ''
  const result = await props.saveSlug(newSlug.value)
  slugSaving.value = false
  if (result.error) {
    slugError.value = result.error
  } else {
    slugSuccess.value = true
    isEditingSlug.value = false
    setTimeout(() => { slugSuccess.value = false }, 3000)
  }
}

function copyUrl() {
  window.navigator.clipboard.writeText(props.publicUrl)
}
</script>

<template>
  <div class="max-w-lg space-y-6">
    <!-- Username field (read-only) -->
    <div>
      <label class="block text-sm font-medium text-warm-text mb-2">
        Username
      </label>
      <input
        type="text"
        :value="username"
        disabled
        class="w-full rounded-lg border border-warm-border bg-warm-bg-secondary px-3 py-2 text-sm text-warm-text cursor-not-allowed opacity-60"
      />
      <p class="mt-1 text-xs text-warm-muted">
        Your unique account identifier. Cannot be changed.
      </p>
    </div>

    <!-- Public URL field (editable) -->
    <div>
      <label class="block text-sm font-medium text-warm-text mb-2">
        Public Profile URL
      </label>

      <template v-if="!isEditingSlug">
        <div class="flex gap-2">
          <input
            type="text"
            :value="publicUrl"
            disabled
            class="flex-1 rounded-lg border border-warm-border bg-warm-bg-secondary px-3 py-2 text-sm text-warm-text cursor-not-allowed opacity-60"
          />
          <button
            class="px-3 py-2 rounded-lg bg-warm-text text-white text-sm font-medium hover:opacity-90 transition-opacity"
            @click="copyUrl"
          >
            Copy
          </button>
          <button
            class="px-3 py-2 rounded-lg border border-warm-border bg-white text-sm font-medium text-warm-text hover:bg-warm-bg transition-colors"
            @click="startEditingSlug"
          >
            Edit
          </button>
        </div>
        <p v-if="slugSuccess" class="mt-1 text-xs text-sage-600">URL updated successfully.</p>
        <p class="mt-1 text-xs text-warm-muted">
          The URL where your profile is publicly visible.
        </p>
      </template>

      <template v-else>
        <div class="flex gap-2">
          <div class="flex-1">
            <input
              v-model="newSlug"
              type="text"
              autocomplete="off"
              autocapitalize="none"
              spellcheck="false"
              placeholder="your-slug"
              class="w-full rounded-lg border border-warm-border px-3 py-2 text-sm text-warm-text focus:outline-none focus:ring-2 focus:ring-warm-text"
            />
          </div>
          <button
            :disabled="!canSaveSlug || slugSaving"
            class="px-3 py-2 rounded-lg bg-warm-text text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
            @click="handleSaveSlug"
          >
            {{ slugSaving ? 'Saving…' : 'Save' }}
          </button>
          <button
            class="px-3 py-2 rounded-lg border border-warm-border bg-white text-sm font-medium text-warm-text hover:bg-warm-bg transition-colors"
            @click="cancelEditSlug"
          >
            Cancel
          </button>
        </div>
        <p v-if="slugFormatError" class="mt-1 text-xs text-red-500">{{ slugFormatError }}</p>
        <p v-else-if="checkingSlug" class="mt-1 text-xs text-warm-muted">Checking availability…</p>
        <p v-else-if="slugAvailable === false" class="mt-1 text-xs text-red-500">That URL is already taken.</p>
        <p v-else-if="slugAvailable === true" class="mt-1 text-xs text-sage-600">Available!</p>
        <p v-else-if="slugError" class="mt-1 text-xs text-red-500">{{ slugError }}</p>
        <p class="mt-1 text-xs text-warm-muted">
          Only lowercase letters, numbers, and underscores. 3–30 characters.
        </p>
      </template>
    </div>

    <!-- Email field (read-only) -->
    <div>
      <label class="block text-sm font-medium text-warm-text mb-2">
        Email
      </label>
      <input
        type="email"
        :value="email"
        disabled
        class="w-full rounded-lg border border-warm-border bg-warm-bg-secondary px-3 py-2 text-sm text-warm-muted cursor-not-allowed opacity-60"
      />
      <p class="mt-1 text-xs text-warm-muted">
        Email management coming in a future update.
      </p>
    </div>

    <!-- Status selector -->
    <div class="pt-4 border-t border-warm-border">
      <label class="block text-sm font-medium text-warm-text mb-2">
        Profile Status
      </label>
      <select
        v-model="selectedStatus"
        class="w-full rounded-lg border border-warm-border bg-white px-3 py-2 text-sm text-warm-text focus:outline-none focus:ring-2 focus:ring-warm-text"
      >
        <option value="active">Active</option>
        <option value="paused">Paused</option>
        <option value="taken">Taken</option>
      </select>
      <p class="mt-2 text-sm text-warm-muted leading-relaxed">
        {{ statusDescriptions[selectedStatus] }}
      </p>
    </div>

    <!-- Allow contact toggle -->
    <div class="pt-4 border-t border-warm-border">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-warm-text">Allow contact form</p>
          <p class="text-xs text-warm-muted mt-0.5">
            When enabled, visitors can send you a message via your profile page.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          :aria-checked="isContactable"
          class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-warm-text focus:ring-offset-2"
          :class="isContactable ? 'bg-sage-500' : 'bg-warm-border'"
          @click="emit('update:isContactable', !isContactable)"
        >
          <span
            class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
            :class="isContactable ? 'translate-x-5' : 'translate-x-0'"
          />
        </button>
      </div>
    </div>
  </div>
</template>
