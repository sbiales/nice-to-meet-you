<!-- app/pages/signup.vue -->
<script setup lang="ts">
import { validateSignUpForm } from '~/lib/validation'

definePageMeta({ layout: 'auth' })

const { signUp } = useAuth()
const router = useRouter()

const form = reactive({ name: '', email: '', password: '' })
const errors = reactive({ name: '', email: '', password: '' })
const submitError = ref('')
const loading = ref(false)

async function handleSubmit() {
  const result = validateSignUpForm(form)
  errors.name = result.name
  errors.email = result.email
  errors.password = result.password
  if (errors.name || errors.email || errors.password) return
  submitError.value = ''
  loading.value = true
  try {
    const result = await signUp(form.email, form.password, form.name)
    if (result?.error) {
      submitError.value = result.error.message ?? 'Sign up failed. Please try again.'
    } else {
      await router.push('/onboarding')
    }
  } catch {
    submitError.value = 'Something went wrong. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-6 text-center">
      <h1 class="text-2xl font-semibold text-warm-text">Create your page</h1>
      <p class="mt-1 text-sm text-warm-muted">Free, and takes about 2 minutes</p>
    </div>

    <AppCard>
      <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
        <AppInput
          id="name"
          v-model="form.name"
          label="Your name"
          type="text"
          autocomplete="name"
          placeholder="Alex"
          :error="errors.name"
          required
        />
        <AppInput
          id="email"
          v-model="form.email"
          label="Email"
          type="email"
          autocomplete="email"
          placeholder="you@example.com"
          :error="errors.email"
          required
        />
        <AppInput
          id="password"
          v-model="form.password"
          label="Password"
          type="password"
          autocomplete="new-password"
          placeholder="••••••••"
          helper="At least 8 characters"
          :error="errors.password"
          required
        />
        <p v-if="submitError" class="text-sm text-red-500">{{ submitError }}</p>
        <AppButton type="submit" :loading="loading" class="w-full">
          Create account
        </AppButton>
        <div class="relative flex items-center gap-3">
          <div class="h-px flex-1 bg-warm-border" />
          <span class="text-xs text-warm-muted">or</span>
          <div class="h-px flex-1 bg-warm-border" />
        </div>
        <SocialAuthButton provider="google" />
      </form>
    </AppCard>

    <p class="mt-4 text-center text-sm text-warm-muted">
      Already have an account?
      <NuxtLink to="/signin" class="font-medium text-sage-500 hover:text-sage-600">
        Sign in
      </NuxtLink>
    </p>
  </div>
</template>
