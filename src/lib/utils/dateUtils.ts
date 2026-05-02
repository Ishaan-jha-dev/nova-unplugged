import { formatInTimeZone } from 'date-fns-tz'

/**
 * Formats a given date string or Date object directly into Indian Standard Time (Asia/Kolkata).
 * Prevents Vercel server components from defaulting to UTC format.
 */
export function formatIST(date: string | Date | null | undefined, fmt: string = 'PPp', fallback: string = 'Unknown Date'): string {
  if (!date) return fallback
  
  try {
    return formatInTimeZone(new Date(date), 'Asia/Kolkata', fmt)
  } catch (error) {
    console.error('Date formatting error:', error)
    return fallback
  }
}
