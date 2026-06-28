// Format a revision's submittal timestamp as "YYYY-MM-DD HH:MM UTC".
//
// The stored value is UTC — frontendToBackend writes new Date().toISOString(). We render
// the UTC components so the displayed time is the same for every viewer regardless of
// their local timezone. If the serialized string lost its timezone designator (no trailing
// Z or +/-hh:mm offset), we append "Z" so new Date() reads it as UTC rather than as the
// runner's local time. Returns "" for empty or unparseable input.
export function formatRevisionDate(iso) {
  if (!iso) return ""

  let s = String(iso)
  const hasTimezone = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(s)
  if (!hasTimezone) {
    s = s + "Z"
  }

  const d = new Date(s)
  if (isNaN(d.getTime())) return ""

  const pad = (n) => String(n).padStart(2, "0")
  const date = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
  const time = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
  return `${date} ${time} UTC`
}
