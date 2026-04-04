<script setup lang="ts">
const props = defineProps<{
  username: string
  publicUrl: string
  email: string
  status: 'active' | 'paused' | 'taken'
}>()

const emit = defineEmits<{
  'update:status': [value: 'active' | 'paused' | 'taken']
}>()

const statusDescriptions = {
  active: 'Your profile is visible and discoverable. People can view all your blocks and contact you.',
  paused: 'Your profile is hidden. Visitors see a "paused" message instead of your content. Use this when you\'re taking a break.',
  taken: 'Your profile is visible but marked as taken. Visitors see your full profile with a "taken" banner overlay.',
}

const selectedStatus = computed({
  get: () => props.status,
  set: (value) => emit('update:status', value),
})

function copyUrl() {
  window.navigator.clipboard.writeText(props.publicUrl)
}
</script>

<template>
  <div class="max-w-lg space-y-6">
    <!-- Username field (disabled) -->
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

    <!-- Public URL field (disabled) -->
    <div>
      <label class="block text-sm font-medium text-warm-text mb-2">
        Public Profile URL
      </label>
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
      </div>
      <p class="mt-1 text-xs text-warm-muted">
        This is the URL where your profile is publicly visible. Share this link or the QR code with others.
      </p>
    </div>

    <!-- Email field (disabled) -->
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

    <!-- Status selector (ENABLED) -->
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
  </div>
</template>
