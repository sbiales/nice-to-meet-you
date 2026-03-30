import { describe, it, expect } from 'vitest'
import { parseVideoUrl } from '../../app/utils/video'

describe('parseVideoUrl', () => {
  it('parses a YouTube watch URL', () => {
    const result = parseVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    expect(result).toEqual({ platform: 'youtube', videoId: 'dQw4w9WgXcQ' })
  })

  it('parses a YouTube short URL', () => {
    const result = parseVideoUrl('https://youtu.be/dQw4w9WgXcQ')
    expect(result).toEqual({ platform: 'youtube', videoId: 'dQw4w9WgXcQ' })
  })

  it('parses a Vimeo URL', () => {
    const result = parseVideoUrl('https://vimeo.com/123456789')
    expect(result).toEqual({ platform: 'vimeo', videoId: '123456789' })
  })

  it('returns null for an unrecognised URL', () => {
    const result = parseVideoUrl('https://example.com/video')
    expect(result).toBeNull()
  })

  it('returns null for an empty string', () => {
    const result = parseVideoUrl('')
    expect(result).toBeNull()
  })
})
