export function usePhotoUpload() {
  const uploading = ref(false)
  const error = ref<string | null>(null)

  async function upload(file: File, profileId: string): Promise<{ id: string; storageKey: string } | null> {
    uploading.value = true
    error.value = null

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('profileId', profileId)

      const result = await $fetch<{ id: string; storageKey: string }>('/api/photos', {
        method: 'POST',
        body: formData,
      })

      return result
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Upload failed'
      return null
    } finally {
      uploading.value = false
    }
  }

  async function remove(photoId: string): Promise<boolean> {
    try {
      await $fetch(`/api/photos/${photoId}`, { method: 'DELETE' })
      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Delete failed'
      return false
    }
  }

  return { uploading, error, upload, remove }
}
