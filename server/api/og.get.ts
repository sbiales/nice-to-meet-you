import { parseOgMetadata } from '../utils/og'

export default defineEventHandler(async (event) => {
  const { url } = getQuery(event)

  if (!url || typeof url !== 'string') {
    throw createError({ statusCode: 400, message: 'Missing url query param' })
  }

  // Basic URL validation
  try {
    new URL(url)
  } catch {
    throw createError({ statusCode: 400, message: 'Invalid URL' })
  }

  const html = await $fetch<string>(url, {
    headers: { 'User-Agent': 'NiceToMeetYou-OGBot/1.0' },
    responseType: 'text',
  }).catch(() => {
    throw createError({ statusCode: 502, message: 'Could not fetch URL' })
  })

  return parseOgMetadata(html)
})
