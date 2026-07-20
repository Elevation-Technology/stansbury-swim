// Lesson times are wall-clock times at the pool, so they render in the
// organization's timezone regardless of the viewer's device setting.
export const ORG_TIMEZONE = 'America/Denver'

export function formatDateTime(dateTime: string, extraOptions: Intl.DateTimeFormatOptions = {}) {
  const date = new Date(dateTime)
  const options: Intl.DateTimeFormatOptions = {
    month: 'long', // 'January'
    day: 'numeric', // '27'
    hour: 'numeric', // '12 PM'
    minute: 'numeric', // '30'
    ...extraOptions,
    // Pinned last so a caller cannot accidentally unpin it.
    timeZone: ORG_TIMEZONE,
  }
  return date.toLocaleString('en-US', options)
}
