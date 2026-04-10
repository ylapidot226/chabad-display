// Fetch YouTube video duration from the embed page
const durationCache: Record<string, number> = {}

export async function getYouTubeDuration(videoId: string): Promise<number> {
  if (durationCache[videoId]) return durationCache[videoId]

  try {
    // Fetch YouTube video page and extract duration from HTML
    const res = await fetch('https://www.youtube.com/watch?v=' + videoId, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    const html = await res.text()

    // Try to find "lengthSeconds":"123" in the page
    const match = html.match(/"lengthSeconds"\s*:\s*"(\d+)"/)
    if (match) {
      const seconds = parseInt(match[1])
      if (seconds > 0) {
        durationCache[videoId] = seconds
        return seconds
      }
    }

    // Fallback: try approxDurationMs
    const match2 = html.match(/"approxDurationMs"\s*:\s*"(\d+)"/)
    if (match2) {
      const seconds = Math.ceil(parseInt(match2[1]) / 1000)
      if (seconds > 0) {
        durationCache[videoId] = seconds
        return seconds
      }
    }
  } catch (e) {
    // Failed to fetch, use default
  }

  return 180 // 3 minute default fallback
}

export function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}
