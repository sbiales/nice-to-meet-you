<script setup lang="ts">
definePageMeta({ layout: 'dashboard', ssr: false, middleware: 'profile-required' })

const { username, slug, status, isContactable, saveStatus, saveSlug, loadProfile } = useProfile()
const { session } = useAuth()

provide('saveStatus', saveStatus)

const config = useRuntimeConfig()

const publicUrl = computed(() => `${config.public.appUrl}/${slug.value}`)
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
            :slug="slug"
            :public-url="publicUrl"
            :email="email"
            :status="status"
            :is-contactable="isContactable"
            :save-slug="saveSlug"
            @update:status="status = $event"
            @update:is-contactable="isContactable = $event"
          />
        </div>
      </div>
    </div>
  </div>
</template>
