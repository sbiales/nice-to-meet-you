export interface VideoInfo {
  platform: 'youtube' | 'vimeo'
  videoId: string
}

export function parseVideoUrl(url: string): VideoInfo | null {
  if (!url) return null

  // YouTube: youtube.com/watch?v=ID or youtu.be/ID
  const ytWatch = url.match(/youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/)
  if (ytWatch?.[1]) return { platform: 'youtube', videoId: ytWatch[1] }

  const ytShort = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
  if (ytShort?.[1]) return { platform: 'youtube', videoId: ytShort[1] }

  // Vimeo: vimeo.com/ID
  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo?.[1]) return { platform: 'vimeo', videoId: vimeo[1] }

  return null
}

export function getEmbedUrl(info: VideoInfo): string {
  if (info.platform === 'youtube') {
    return `https://www.youtube-nocookie.com/embed/${info.videoId}`
  }
  return `https://player.vimeo.com/video/${info.videoId}`
}
