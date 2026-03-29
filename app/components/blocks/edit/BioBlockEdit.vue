<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import type { BioBlockData } from '~/types/blocks'

const props = defineProps<{ data: BioBlockData }>()
const emit = defineEmits<{ 'update:data': [data: BioBlockData] }>()

const editor = useEditor({
  content: props.data.content,
  extensions: [StarterKit, Link.configure({ openOnClick: false })],
  onUpdate({ editor }) {
    emit('update:data', { content: editor.getHTML() })
  },
})

onBeforeUnmount(() => editor.value?.destroy())
</script>

<template>
  <div>
    <!-- Minimal toolbar -->
    <div class="mb-2 flex gap-1 border-b border-warm-border pb-2">
      <button
        :class="['rounded px-2 py-1 text-xs font-bold transition-colors', editor?.isActive('bold') ? 'bg-sage-100 text-sage-800' : 'text-warm-muted hover:bg-warm-bg']"
        @click="editor?.chain().focus().toggleBold().run()"
      >B</button>
      <button
        :class="['rounded px-2 py-1 text-xs italic transition-colors', editor?.isActive('italic') ? 'bg-sage-100 text-sage-800' : 'text-warm-muted hover:bg-warm-bg']"
        @click="editor?.chain().focus().toggleItalic().run()"
      >I</button>
    </div>
    <!-- Tiptap editor area -->
    <EditorContent
      :editor="editor"
      class="min-h-[80px] text-sm text-warm-text [&_.ProseMirror]:min-h-[80px] [&_.ProseMirror]:outline-none"
    />
  </div>
</template>
