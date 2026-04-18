<!-- app/components/profile/ContactForm.vue -->
<script setup lang="ts">
const props = defineProps<{
  username: string
}>()

const name = ref('')
const email = ref('')
const message = ref('')
const status = ref<'idle' | 'submitting' | 'success' | 'error'>('idle')
const errorMessage = ref('')

async function handleSubmit() {
  status.value = 'submitting'
  errorMessage.value = ''
  try {
    await $fetch(`/api/contact/${props.username}`, {
      method: 'POST',
      body: {
        name: name.value.trim(),
        email: email.value.trim() || undefined,
        message: message.value.trim(),
      },
    })
    status.value = 'success'
  } catch (err: any) {
    status.value = 'error'
    errorMessage.value = err?.data?.message ?? 'Something went wrong. Please try again.'
  }
}
</script>

<template>
  <section id="contact" class="mt-6 border-t border-warm-border px-4 py-10">
    <div class="mx-auto max-w-2xl">
      <h2 class="mb-6 text-xl font-semibold text-warm-text">Get in touch</h2>

      <div v-if="status === 'success'" class="rounded-lg bg-sage-50 p-6 text-center">
        <p class="font-medium text-sage-700">Message sent!</p>
        <p class="mt-1 text-sm text-warm-muted">They'll get back to you if you left your email.</p>
      </div>

      <form v-else class="space-y-4" @submit.prevent="handleSubmit">
        <div>
          <label class="mb-1 block text-sm font-medium text-warm-text">
            Name <span class="text-red-500">*</span>
          </label>
          <input
            v-model="name"
            type="text"
            required
            placeholder="Your name"
            class="w-full rounded-md border border-warm-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400"
          />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-warm-text">Email</label>
          <input
            v-model="email"
            type="email"
            placeholder="your@email.com"
            class="w-full rounded-md border border-warm-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400"
          />
          <p class="mt-1 text-xs text-warm-muted">Required if you want a reply</p>
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-warm-text">
            Message <span class="text-red-500">*</span>
          </label>
          <textarea
            v-model="message"
            required
            rows="4"
            placeholder="Say something..."
            class="w-full resize-none rounded-md border border-warm-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400"
          />
        </div>

        <p v-if="status === 'error'" class="text-sm text-red-500">{{ errorMessage }}</p>

        <button
          type="submit"
          :disabled="status === 'submitting'"
          class="w-full rounded-lg bg-gray-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
        >
          {{ status === 'submitting' ? 'Sending…' : 'Send message' }}
        </button>
      </form>
    </div>
  </section>
</template>
