<!-- app/pages/dashboard/qr.vue -->
<script setup lang="ts">
import QRCode from 'qrcode'

definePageMeta({ layout: 'dashboard', ssr: false, middleware: 'profile-required' })

const { username, loadProfile } = useProfile()
const config = useRuntimeConfig()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const profileUrl = computed(() => `${config.public.appUrl}/${username.value}`)

async function renderQR() {
  if (!canvasRef.value || !username.value) return
  await QRCode.toCanvas(canvasRef.value, profileUrl.value, {
    width: 300,
    errorCorrectionLevel: 'M',
  })
}

function downloadPNG() {
  if (!canvasRef.value) return
  const a = document.createElement('a')
  a.download = `nicetomeetyou-${username.value}.png`
  a.href = canvasRef.value.toDataURL('image/png')
  a.click()
}

onMounted(async () => {
  await loadProfile()
  await renderQR()
})
</script>

<template>
  <div class="flex h-[calc(100vh-56px)] items-center justify-center">
    <div class="flex flex-col items-center gap-6 rounded-2xl border border-warm-border bg-warm-card p-10 shadow-sm">
      <h1 class="text-2xl font-bold text-warm-text">Your QR Code</h1>
      <canvas ref="canvasRef" class="rounded-lg" />
      <p v-if="username" class="text-sm text-warm-muted">{{ profileUrl }}</p>
      <button
        class="rounded-lg bg-gray-900 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-700"
        @click="downloadPNG"
      >
        Download PNG
      </button>
    </div>
  </div>
</template>
