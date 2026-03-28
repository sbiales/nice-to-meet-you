<script setup lang="ts">
definePageMeta({ layout: 'dashboard', ssr: false, middleware: 'profile-required' })
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold">Dashboard</h1>
    <p class="mt-2 text-gray-500">Manage your profile here.</p>
  </div>
</template>
