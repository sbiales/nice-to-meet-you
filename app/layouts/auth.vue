<!-- app/layouts/auth.vue -->
<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-warm-bg px-4 py-12">
    <div class="mb-8 text-center">
      <NuxtLink to="/" class="inline-block">
        <span class="text-2xl font-semibold tracking-tight text-warm-text">
          nice to meet you
        </span>
      </NuxtLink>
    </div>
    <div class="w-full max-w-sm">
      <slot />
    </div>
    <p class="mt-8 text-xs text-warm-muted">
      © {{ new Date().getFullYear() }} Nice To Meet You
    </p>
  </div>
</template>
