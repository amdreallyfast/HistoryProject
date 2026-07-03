import { describe, it, expect } from "vitest"
import { formatRevisionDate } from "./formatRevisionDate"

// formatRevisionDate renders a revision's UTC submittal time. The stored value is UTC, so
// these cases pin down that the output is the UTC instant regardless of how the timezone is
// (or isn't) expressed in the serialized string, and is stable across the runner's timezone.
describe("formatRevisionDate", () => {
  it("formats an ISO string with Z as UTC", () => {
    expect(formatRevisionDate("2026-06-28T14:30:00Z")).toBe("2026-06-28 14:30 UTC")
  })

  it("treats a timezone-less string as UTC (append-Z normalization)", () => {
    expect(formatRevisionDate("2026-06-28T14:30:00")).toBe("2026-06-28 14:30 UTC")
  })

  it("converts an offset timestamp to UTC", () => {
    // 14:30 at +02:00 is 12:30 UTC.
    expect(formatRevisionDate("2026-06-28T14:30:00+02:00")).toBe("2026-06-28 12:30 UTC")
  })

  it("pads single-digit month/day/hour/minute", () => {
    expect(formatRevisionDate("2026-01-05T09:05:00Z")).toBe("2026-01-05 09:05 UTC")
  })

  it("returns empty string for falsy input", () => {
    expect(formatRevisionDate(null)).toBe("")
    expect(formatRevisionDate(undefined)).toBe("")
    expect(formatRevisionDate("")).toBe("")
  })

  it("returns empty string for an unparseable value", () => {
    expect(formatRevisionDate("not a date")).toBe("")
  })
})
