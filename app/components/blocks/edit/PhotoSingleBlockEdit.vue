<script setup lang="ts">
import type { PhotoSingleBlockData } from '~/types/blocks'

const props = defineProps<{ data: PhotoSingleBlockData }>()
const emit = defineEmits<{ 'update:data': [data: PhotoSingleBlockData] }>()

const { uploading, error, upload } = usePhotoUpload()
const config = useRuntimeConfig()

const imageUrl = computed(() =>
  props.data.storageKey
    ? `${config.public.storagePublicUrl}/${props.data.storageKey}`
    : null
)

const caption = ref(props.data.caption ?? '')

async function onFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const result = await upload(file)
  if (result) {
    emit('update:data', {
      ...props.data,
      storageKey: result.storageKey,
    })
  }
}

function onCaptionInput(value: string) {
  caption.value = value
  emit('update:data', { ...props.data, caption: value })
}
</script>

<template>
  <div class="space-y-3">
    <!-- Current photo preview -->
    <div v-if="imageUrl" class="relative">
      <img :src="imageUrl" alt="Current photo" class="w-full rounded-lg object-cover max-h-48" />
    </div>

    <!-- Upload input -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        {{ imageUrl ? 'Replace photo' : 'Upload photo' }}
      </label>
      <input
        type="file"
        accept="image/*"
        class="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm"
        :disabled="uploading"
        @change="onFileChange"
      />
      <p v-if="uploading" class="text-xs text-gray-400 mt-1">Uploading…</p>
      <p v-if="error" class="text-xs text-red-500 mt-1">{{ error }}</p>
    </div>

    <!-- Caption input -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Caption (optional)</label>
      <input
        :value="caption"
        type="text"
        placeholder="Add a caption…"
        class="w-full rounded-md border px-3 py-2 text-sm"
        @input="onCaptionInput(($event.target as HTMLInputElement).value)"
      />
    </div>
  </div>
</template>
