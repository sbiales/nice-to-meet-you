const store = new Map<string, number[]>()

export function checkRateLimit(ip: string, maxRequests = 3, windowMs = 10 * 60 * 1000): boolean {
  const now = Date.now()
  const windowStart = now - windowMs
  const timestamps = (store.get(ip) ?? []).filter(t => t > windowStart)
  if (timestamps.length >= maxRequests) return false
  store.set(ip, [...timestamps, now])
  return true
}
