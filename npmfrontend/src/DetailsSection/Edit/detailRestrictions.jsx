import { isRangeInverted } from "../../dates/partialDate"

export const detailRestrictions = {
  maxTitleLength: 128,
  maxTagLength: 32,
  maxSummaryLength: 2048,
  maxSourceTitleLength: 128,
  maxSourceIsbnLength: 13,
  maxWhereInSourceLength: 64,
  maxSourceAuthorLength: 128
}

// Returns true if the earliest date is chronologically later than the latest date. Missing
// month/day are read as the widest span (see dates/partialDate.js); no verdict → false.
export function isDateRangeInverted(eYear, eMonth, eDay, lYear, lMonth, lDay) {
  return isRangeInverted({
    earliestYear: eYear, earliestMonth: eMonth, earliestDay: eDay,
    latestYear: lYear, latestMonth: lMonth, latestDay: lDay,
  })
}

// Normalize a date field to either null ("no value") or a trimmed string, so that
// "603" / 603 compare equal and ""/null/undefined all collapse to null.
function normalizeDateField(value) {
  if (value === null || value === undefined) return null
  const s = String(value).trim()
  return s === "" ? null : s
}

// Returns true when a time range represents a single exact point in time, i.e. the
// earliest and latest bounds are equal across year/month/day. This is the proxy the
// "Exact date" UI uses (no boolean column): begin == end means "exact". A blank year
// (e.g. a brand-new event with nothing typed) is never "exact" — it defaults to range
// mode. Accepts an object with earliest{Year,Month,Day} / latest{Year,Month,Day}.
export function isExactDate(timeObj) {
  if (!timeObj) return false
  if (normalizeDateField(timeObj.earliestYear) === null) return false
  return (
    normalizeDateField(timeObj.earliestYear) === normalizeDateField(timeObj.latestYear) &&
    normalizeDateField(timeObj.earliestMonth) === normalizeDateField(timeObj.latestMonth) &&
    normalizeDateField(timeObj.earliestDay) === normalizeDateField(timeObj.latestDay)
  )
}

export function isMonthOutOfRange(month) {
  if (!month || month.toString().trim() === "") return false
  const m = Number(month)
  if (isNaN(m)) return false
  return m < 1 || m > 12
}

export function isDayOutOfRange(day) {
  if (!day || day.toString().trim() === "") return false
  const d = Number(day)
  if (isNaN(d)) return false
  return d < 1 || d > 31
}
