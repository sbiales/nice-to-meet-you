<script setup lang="ts">
definePageMeta({ layout: 'dashboard', ssr: false, middleware: 'profile-required' })

const { username, status, loadProfile } = useProfile()
const { session } = useAuth()

const config = useRuntimeConfig()

const publicUrl = computed(() => `${config.public.appUrl}/${username.value}`)
const email = computed(() => session.value?.data?.user?.email ?? '')

onMounted(() => loadProfile())
</script>

<template>
  <div class="flex h-[calc(100vh-56px)]">
    <div class="flex-1 overflow-y-auto">
      <div class="p-8">
        <div class="mx-auto max-w-2xl">
          <h1 class="text-3xl font-bold text-warm-text mb-2">
            Settings
          </h1>
          <p class="text-warm-muted mb-8">
            Manage your profile and visibility settings
          </p>

          <ProfileSettingsForm
            :username="username"
            :public-url="publicUrl"
            :email="email"
            :status="status"
            @update:status="status = $event"
          />
        </div>
      </div>
    </div>
  </div>
</template>
