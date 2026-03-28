<!-- app/pages/reset-password.vue -->
<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { resetPassword } = useAuth()
const router = useRouter()
const route = useRoute()

const token = computed(() => (route.query.token as string) ?? '')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleSubmit() {
  if (password.value.length < 8) {
    error.value = 'Password must be at least 8 characters'
    return
  }
  error.value = ''
  loading.value = true
  try {
    const result = await resetPassword(token.value, password.value)
    if (result?.error) {
      error.value = result.error.message ?? 'Reset failed. Your link may have expired.'
    } else {
      await router.push('/signin')
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
      <h1 class="text-2xl font-semibold text-warm-text">Set a new password</h1>
      <p class="mt-1 text-sm text-warm-muted">Make it something you'll remember</p>
    </div>

    <AppCard>
      <div v-if="!token" class="text-center">
        <p class="text-sm text-red-500">
          This link is invalid or has expired.
          <NuxtLink to="/forgot-password" class="font-medium text-sage-500 hover:text-sage-600">
            Request a new one.
          </NuxtLink>
        </p>
      </div>
      <form v-else class="flex flex-col gap-4" @submit.prevent="handleSubmit">
        <AppInput
          id="password"
          v-model="password"
          label="New password"
          type="password"
          autocomplete="new-password"
          placeholder="••••••••"
          helper="At least 8 characters"
          required
        />
        <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
        <AppButton type="submit" :loading="loading" class="w-full">
          Update password
        </AppButton>
      </form>
    </AppCard>
  </div>
</template>
