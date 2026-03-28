<!-- app/pages/signin.vue -->
<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { signIn } = useAuth()
const router = useRouter()

const form = reactive({ email: '', password: '' })
const error = ref('')
const loading = ref(false)

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    const result = await signIn(form.email, form.password)
    if (result?.error) {
      error.value = result.error.message ?? 'Sign in failed. Please try again.'
    } else {
      await router.push('/dashboard')
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
      <h1 class="text-2xl font-semibold text-warm-text">Welcome back</h1>
      <p class="mt-1 text-sm text-warm-muted">Sign in to your account</p>
    </div>

    <AppCard>
      <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
        <AppInput
          id="email"
          v-model="form.email"
          label="Email"
          type="email"
          autocomplete="email"
          placeholder="you@example.com"
          required
        />
        <div>
          <AppInput
            id="password"
            v-model="form.password"
            label="Password"
            type="password"
            autocomplete="current-password"
            placeholder="••••••••"
            required
          />
          <div class="mt-1.5 flex justify-end">
            <NuxtLink
              to="/forgot-password"
              class="text-xs text-sage-500 hover:text-sage-600"
            >
              Forgot password?
            </NuxtLink>
          </div>
        </div>
        <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
        <AppButton type="submit" :loading="loading" class="w-full">
          Sign in
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
      Don't have an account?
      <NuxtLink to="/signup" class="font-medium text-sage-500 hover:text-sage-600">
        Sign up
      </NuxtLink>
    </p>
  </div>
</template>
