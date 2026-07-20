/**
 * The timezone the pool operates in.
 *
 * Lesson times are stored as UTC instants, but every calendar question about
 * them (what day is this lesson on, which lessons fall on the 20th, what day of
 * the week is it) has to be answered in the pool's local time. The server runs
 * in UTC, so leaving a timezone unspecified silently answers those questions in
 * UTC and shifts evening lessons onto the following day.
 */
export const ORG_TIMEZONE = 'America/Denver'
