<script setup lang="ts">
import type { PhotoCarouselBlockData } from '~/types/blocks'

const props = defineProps<{ data: PhotoCarouselBlockData }>()
const emit = defineEmits<{ (e: 'update', data: PhotoCarouselBlockData): void }>()

const { uploading, error, upload, remove } = usePhotoUpload()
const config = useRuntimeConfig()

function imageUrl(storageKey: string): string {
  return `${config.public.storagePublicUrl}/${storageKey}`
}

async function onFilesChange(event: Event) {
  const files = Array.from((event.target as HTMLInputElement).files ?? [])
  if (!files.length || !props.data.profileId) return

  const uploads = await Promise.all(
    files.map((file) => upload(file, props.data.profileId))
  )

  const newPhotos = uploads
    .filter((r): r is { id: string; storageKey: string } => r !== null)
    .map((r) => ({ id: r.id, storageKey: r.storageKey }))

  emit('update', {
    ...props.data,
    photos: [...props.data.photos, ...newPhotos],
  })
}

async function removePhoto(photoId: string) {
  await remove(photoId)
  emit('update', {
    ...props.data,
    photos: props.data.photos.filter((p) => p.id !== photoId),
  })
}
</script>

<template>
  <div class="space-y-3">
    <!-- Photo grid -->
    <div v-if="data.photos.length > 0" class="grid grid-cols-3 gap-2">
      <div
        v-for="photo in data.photos"
        :key="photo.id"
        class="relative aspect-square"
      >
        <img
          :src="imageUrl(photo.storageKey)"
          alt="Carousel photo"
          class="h-full w-full rounded object-cover"
        />
        <button
          class="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white text-xs hover:bg-red-500"
          @click="removePhoto(photo.id)"
        >
          &times;
        </button>
      </div>
    </div>

    <!-- Upload more -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Add photos</label>
      <input
        type="file"
        accept="image/*"
        multiple
        class="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm"
        :disabled="uploading"
        @change="onFilesChange"
      />
      <p v-if="uploading" class="text-xs text-gray-400 mt-1">Uploading&hellip;</p>
      <p v-if="error" class="text-xs text-red-500 mt-1">{{ error }}</p>
    </div>
  </div>
</template>
