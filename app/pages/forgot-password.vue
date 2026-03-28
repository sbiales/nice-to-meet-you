<!-- app/pages/forgot-password.vue -->
<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { forgotPassword } = useAuth()

const email = ref('')
const error = ref('')
const loading = ref(false)
const sent = ref(false)

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    const result = await forgotPassword(email.value)
    if (result?.error) {
      error.value = result.error.message ?? 'Something went wrong. Please try again.'
    } else {
      sent.value = true
    }
  } catch {
    error.value = 'Something went wrong. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-6 text-center">
      <h1 class="text-2xl font-semibold text-warm-text">Forgot your password?</h1>
      <p class="mt-1 text-sm text-warm-muted">We'll send you a link to get back in</p>
    </div>

    <AppCard>
      <div v-if="sent" class="flex flex-col items-center gap-3 py-2 text-center">
        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-sage-100 text-sage-600">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            <path d="m16 19 2 2 4-4" />
          </svg>
        </div>
        <p class="text-sm text-warm-text">
          Check your inbox — we sent a reset link to
          <strong class="font-medium">{{ email }}</strong>
        </p>
      </div>
      <form v-else class="flex flex-col gap-4" @submit.prevent="handleSubmit">
        <AppInput
          id="email"
          v-model="email"
          label="Email"
          type="email"
          autocomplete="email"
          placeholder="you@example.com"
          required
        />
        <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
        <AppButton type="submit" :loading="loading" class="w-full">
          Send reset link
        </AppButton>
      </form>
    </AppCard>

    <p class="mt-4 text-center text-sm text-warm-muted">
      <NuxtLink to="/signin" class="font-medium text-sage-500 hover:text-sage-600">
        Back to sign in
      </NuxtLink>
    </p>
  </div>
</template>
