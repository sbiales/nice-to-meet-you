import { parse } from 'node-html-parser'

export interface OgMetadata {
  title: string
  image: string
  description: string
}

export function parseOgMetadata(html: string): OgMetadata {
  const root = parse(html)

  const getMeta = (property: string): string =>
    root.querySelector(`meta[property="${property}"]`)?.getAttribute('content') ?? ''

  const ogTitle = getMeta('og:title')
  const fallbackTitle = root.querySelector('title')?.text ?? ''

  return {
    title: ogTitle || fallbackTitle,
    image: getMeta('og:image'),
    description: getMeta('og:description'),
  }
}
