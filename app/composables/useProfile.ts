// app/composables/useProfile.ts
import { v4 as uuid } from 'uuid'
import type { AnyBlock, BlockType } from '~/types/blocks'
import type { Theme } from '~/types/theme'
import { DEFAULT_THEME } from '~/types/theme'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function useProfile() {
  const profile = ref<Record<string, unknown> | null>(null)
  const blocks = ref<AnyBlock[]>([])
  const theme = ref<Theme>({ ...DEFAULT_THEME })
  const displayName = ref<string>('')
  const taglinePrefix = ref<string | null>(null)
  const headerImageKey = ref<string | null>(null)
  const username = ref<string>('')
  const status = ref<'active' | 'paused' | 'taken'>('active')
  const headerUploading = ref(false)
  const saveStatus = ref<SaveStatus>('idle')
  let saveTimer: ReturnType<typeof setTimeout> | null = null

  async function loadProfile() {
    const data = await $fetch<Record<string, unknown>>('/api/profiles/me')
    profile.value = data
    blocks.value = Array.isArray(data.blocks) ? (data.blocks as AnyBlock[]) : []
    theme.value = data.theme && Object.keys(data.theme as object).length
      ? (data.theme as Theme)
      : { ...DEFAULT_THEME }
    displayName.value = typeof data.displayName === 'string' ? data.displayName : ''
    taglinePrefix.value = typeof data.taglinePrefix === 'string' ? data.taglinePrefix : null
    headerImageKey.value = typeof data.headerImageKey === 'string' ? data.headerImageKey : null
    username.value = typeof data.username === 'string' ? data.username : ''
    status.value = (typeof data.status === 'string' && ['active', 'paused', 'taken'].includes(data.status))
      ? (data.status as 'active' | 'paused' | 'taken')
      : 'active'
  }

  async function save() {
    if (!displayName.value.trim()) return
    saveStatus.value = 'saving'
    try {
      await $fetch('/api/profiles/me', {
        method: 'PATCH',
        body: {
          blocks: blocks.value,
          theme: theme.value,
          taglinePrefix: taglinePrefix.value,
          displayName: displayName.value.trim(),
          status: status.value,
        },
      })
      saveStatus.value = 'saved'
      setTimeout(() => {
        if (saveStatus.value === 'saved') saveStatus.value = 'idle'
      }, 2000)
    } catch {
      saveStatus.value = 'error'
    }
  }

  function scheduleSave() {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(save, 1500)
  }

  watch(blocks, scheduleSave, { deep: true })
  watch(theme, scheduleSave, { deep: true })
  watch(taglinePrefix, scheduleSave)
  watch(displayName, scheduleSave)
  watch(status, scheduleSave)

  async function uploadHeaderImage(file: File) {
    headerUploading.value = true
    try {
      const form = new FormData()
      form.append('file', file)
      const result = await $fetch<{ storageKey: string }>('/api/profiles/header-image', {
        method: 'POST',
        body: form,
      })
      headerImageKey.value = result.storageKey
    } finally {
      headerUploading.value = false
    }
  }

  function addBlock(block: AnyBlock) {
    blocks.value = [...blocks.value, block]
  }

  function updateBlockData(id: string, data: AnyBlock['data']) {
    blocks.value = blocks.value.map(b =>
      b.id === id ? ({ ...b, data }) as AnyBlock : b
    )
  }

  function updateBlockWidth(id: string, width: 'full' | 'half') {
    blocks.value = blocks.value.map(b =>
      b.id === id ? { ...b, width } : b
    )
  }

  function removeBlock(id: string) {
    blocks.value = blocks.value.filter(b => b.id !== id)
  }

  function reorderBlocks(newOrder: AnyBlock[]) {
    blocks.value = newOrder
  }

  function setTheme(t: Theme) {
    theme.value = t
  }

  function setTaglinePrefix(value: string | null) {
    taglinePrefix.value = value
  }

  function setDisplayName(value: string) {
    displayName.value = value
  }

  function existingBlockTypes(): BlockType[] {
    return blocks.value.map(b => b.type)
  }

  function newBlockId(): string {
    return uuid()
  }

  return {
    profile,
    blocks,
    theme,
    displayName,
    taglinePrefix,
    headerImageKey,
    username,
    status,
    headerUploading,
    saveStatus,
    loadProfile,
    uploadHeaderImage,
    addBlock,
    updateBlockData,
    updateBlockWidth,
    removeBlock,
    reorderBlocks,
    setTheme,
    setTaglinePrefix,
    setDisplayName,
    existingBlockTypes,
    newBlockId,
  }
}
