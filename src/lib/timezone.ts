// Brazil timezone utilities — all students are in BRT (UTC-3)
// Server runs in UTC, so we need to convert for date-based queries

const BRAZIL_TZ = "America/Fortaleza"

/**
 * Get the current day of week in Brazil timezone (0=Sunday, 6=Saturday)
 */
export function getBrazilDayOfWeek(): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: BRAZIL_TZ,
    weekday: "short",
  })
  const day = formatter.format(new Date())
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  return map[day] ?? new Date().getDay()
}

/**
 * Get start and end of "today" in Brazil timezone, as UTC Date objects
 * for use in Prisma date range queries (gte start, lt end)
 */
export function getBrazilTodayRange(): { start: Date; end: Date } {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: BRAZIL_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
  const dateStr = formatter.format(new Date()) // "2024-03-22"

  // Midnight BRT → UTC (BRT is UTC-3, so midnight BRT = 03:00 UTC)
  const start = new Date(dateStr + "T00:00:00.000-03:00")
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000) // +24h

  return { start, end }
}
