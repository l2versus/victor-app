// In-memory rate limiter for serverless (per-instance state)
// Each instance maintains its own map — provides basic protection, not global enforcement

const rateLimitStore = new Map<string, number[]>()

// Cleanup interval: remove expired entries every 60s
let cleanupInterval: ReturnType<typeof setInterval> | null = null

function ensureCleanup(windowMs: number) {
  if (cleanupInterval) return
  cleanupInterval = setInterval(() => {
    const now = Date.now()
    for (const [key, timestamps] of rateLimitStore) {
      const valid = timestamps.filter(t => now - t < windowMs)
      if (valid.length === 0) {
        rateLimitStore.delete(key)
      } else {
        rateLimitStore.set(key, valid)
      }
    }
  }, 60_000)
  // Allow process to exit without waiting for cleanup
  if (cleanupInterval && typeof cleanupInterval === "object" && "unref" in cleanupInterval) {
    cleanupInterval.unref()
  }
}

/**
 * Check if a request from the given IP is within rate limits.
 *
 * @param ip - Client IP address (key for tracking)
 * @param limit - Max requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns { success, remaining } — success=false means rate limited
 */
export function checkRateLimit(
  ip: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number } {
  ensureCleanup(windowMs)

  const now = Date.now()
  const timestamps = rateLimitStore.get(ip) || []

  // Filter to only timestamps within the current window
  const valid = timestamps.filter(t => now - t < windowMs)

  if (valid.length >= limit) {
    rateLimitStore.set(ip, valid)
    return { success: false, remaining: 0 }
  }

  valid.push(now)
  rateLimitStore.set(ip, valid)

  return { success: true, remaining: limit - valid.length }
}
