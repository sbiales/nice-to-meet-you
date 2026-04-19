<script setup lang="ts">
import { validateUsername, usernameErrorMessage } from '~/lib/username-validator'

definePageMeta({ layout: 'auth', ssr: false })

const { session } = useAuth()
const router = useRouter()

// Guard: wait for session to load, then redirect if not signed in or already has a profile
watch(() => session.value?.isPending, async (pending) => {
  if (pending !== false) return
  if (!session.value?.data?.user) {
    await navigateTo('/signin')
    return
  }
  try {
    await $fetch('/api/profiles/me')
    await navigateTo('/dashboard')
  } catch (error: any) {
    if (error?.statusCode === 401) {
      await navigateTo('/signin')
    }
    // 404 = no profile yet — stay on this page
  }
}, { immediate: true })

const user = computed(() => session.value?.data?.user)

function toUsernameSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/@.*$/, '')
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 30)
}

const form = reactive({ username: '', displayName: '' })
const usernameAvailable = ref<boolean | null>(null)
const checkingUsername = ref(false)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

function scheduleUsernameCheck(username: string) {
  usernameAvailable.value = null
  if (debounceTimer) clearTimeout(debounceTimer)
  if (!username || !validateUsername(username).valid) return

  checkingUsername.value = true
  debounceTimer = setTimeout(async () => {
    try {
      const result = await $fetch<{ available: boolean }>(
        `/api/profiles/check-username?username=${encodeURIComponent(username)}`
      )
      usernameAvailable.value = result.available
    } finally {
      checkingUsername.value = false
    }
  }, 300)
}

watch(user, (u) => {
  if (!u) return
  if (!form.username) {
    form.username = toUsernameSlug(u.email ?? '')
    scheduleUsernameCheck(form.username)
  }
  if (!form.displayName) {
    form.displayName = (u.name ?? toUsernameSlug(u.email ?? '')).slice(0, 60)
  }
}, { immediate: true })

const usernameValidation = computed(() => validateUsername(form.username))
const usernameFormatError = computed(() =>
  form.username ? usernameErrorMessage(usernameValidation.value) : ''
)

watch(() => form.username, scheduleUsernameCheck)

const usernameError = computed(() => {
  if (usernameFormatError.value) return usernameFormatError.value
  if (usernameAvailable.value === false) return 'That username is already taken'
  return ''
})

const usernameHelper = computed(() => {
  if (usernameError.value) return ''
  if (checkingUsername.value) return 'Checking availability…'
  if (usernameAvailable.value === true) return `nicetomeetyou.app/${form.username}`
  return ''
})

const canSubmit = computed(() =>
  !!form.username &&
  !!form.displayName.trim() &&
  usernameValidation.value.valid &&
  usernameAvailable.value === true &&
  !checkingUsername.value
)

const submitError = ref('')
const loading = ref(false)

async function handleSubmit() {
  if (!canSubmit.value) return
  submitError.value = ''
  loading.value = true
  try {
    await $fetch('/api/profiles', {
      method: 'POST',
      body: { username: form.username, displayName: form.displayName.trim() },
    })
    await router.push('/dashboard')
  } catch (error: any) {
    if (error?.statusCode === 409) {
      submitError.value = 'That username was just taken. Please choose another.'
    } else {
      submitError.value = 'Something went wrong. Please try again.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-6 text-center">
      <h1 class="text-2xl font-semibold text-warm-text">Set up your page</h1>
      <p class="mt-1 text-sm text-warm-muted">
        This is how people will find you. You can change it later.
      </p>
    </div>

    <AppCard>
      <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
        <AppInput
          id="username"
          v-model="form.username"
          label="Choose your username"
          placeholder="yourname"
          :error="usernameError"
          :helper="usernameHelper"
          autocomplete="off"
          autocapitalize="none"
          spellcheck="false"
        />
        <AppInput
          id="displayName"
          v-model="form.displayName"
          label="Your display name"
          placeholder="Jane Smith"
        />
        <p v-if="submitError" class="text-sm text-red-500">{{ submitError }}</p>
        <AppButton
          type="submit"
          :loading="loading"
          :disabled="!canSubmit"
          class="w-full"
        >
          Let's go →
        </AppButton>
      </form>
    </AppCard>
  </div>
</template>
