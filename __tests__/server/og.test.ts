import { describe, it, expect } from 'vitest'
import { parseOgMetadata } from '../../server/utils/og'

describe('parseOgMetadata', () => {
  it('extracts og:title and og:image from HTML', () => {
    const html = `
      <html>
        <head>
          <meta property="og:title" content="My Website" />
          <meta property="og:image" content="https://example.com/img.png" />
          <meta property="og:description" content="A description" />
        </head>
      </html>
    `
    const result = parseOgMetadata(html)
    expect(result.title).toBe('My Website')
    expect(result.image).toBe('https://example.com/img.png')
    expect(result.description).toBe('A description')
  })

  it('falls back to <title> tag if og:title is missing', () => {
    const html = `<html><head><title>Fallback Title</title></head></html>`
    const result = parseOgMetadata(html)
    expect(result.title).toBe('Fallback Title')
  })

  it('returns empty strings for missing fields', () => {
    const html = `<html><head></head></html>`
    const result = parseOgMetadata(html)
    expect(result.title).toBe('')
    expect(result.image).toBe('')
    expect(result.description).toBe('')
  })
})
