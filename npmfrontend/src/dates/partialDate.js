// Comparing partial dates (year required; month and day optional; negative years are BC).
//
// A bound with a missing month or day is a span, not a point. To compare bounds, each is
// expanded to the widest point it could be:
//   - an EARLIEST bound → the start of its period (missing month → 1, missing day → 1)
//   - a LATEST bound    → the end of its period   (missing month → 12, missing day → 31)
// so a comparison only reports a problem when every reading of the dates is impossible.
// Day 31 for every month is deliberately simple; real month lengths and leap years belong
// to the JulianCalendar TODO item, which can swap them in here without changing callers.
//
// Mirrored in WebAPI/WebAPI/Validation/PartialDate.cs. Both are checked against the same
// cases in npmfrontend/tests/fixtures/partialDateContract.json (partialDate.contract.test.js
// and PartialDateContractTests.cs), so keep them in step.

// "" / null / undefined → null (missing). Anything else must be an integer or the bound has
// no verdict (NaN); other validators already report malformed fields.
function part(value) {
  if (value === null || value === undefined) return null
  const s = String(value).trim()
  if (s === "") return null
  const n = Number(s)
  return Number.isInteger(n) ? n : NaN
}

// Comparable number for a bound, or null when the year is missing or any part is malformed.
// month*100 + day stays below 10000, so year*10000 orders correctly for BC years too.
function key(year, month, day, fillMonth, fillDay) {
  const y = part(year), m = part(month), d = part(day)
  if (y === null || Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return null
  return y * 10000 + (m ?? fillMonth) * 100 + (d ?? fillDay)
}

export const earliestKey = (year, month, day) => key(year, month, day, 1, 1)
export const latestKey = (year, month, day) => key(year, month, day, 12, 31)

// True when the range's earliest bound is after its latest bound. No verdict → false.
export function isRangeInverted(range) {
  const lo = earliestKey(range?.earliestYear, range?.earliestMonth, range?.earliestDay)
  const hi = latestKey(range?.latestYear, range?.latestMonth, range?.latestDay)
  return lo !== null && hi !== null && lo > hi
}

// True when the source was written entirely before the event could have happened: the
// source's latest date is before the event's earliest date. Overlap and "event before
// source" are both allowed (claudePlans/10). No verdict → false.
export function isSourceBeforeEvent(eventTime, publicationTime) {
  const eventEarliest = earliestKey(eventTime?.earliestYear, eventTime?.earliestMonth, eventTime?.earliestDay)
  const sourceLatest = latestKey(publicationTime?.latestYear, publicationTime?.latestMonth, publicationTime?.latestDay)
  return eventEarliest !== null && sourceLatest !== null && sourceLatest < eventEarliest
}
