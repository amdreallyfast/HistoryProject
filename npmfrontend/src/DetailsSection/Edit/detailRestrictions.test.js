import { describe, it, expect } from "vitest"
import { isExactDate } from "./detailRestrictions"

// isExactDate is the proxy that drives the "Exact date" UI: begin == end means a single
// exact point in time (no boolean column). These cases pin down the edge behavior the
// editors rely on — especially that a blank new event is NOT exact (range mode default)
// and that partial dates (year only) still count as exact.
describe("isExactDate", () => {
  it("returns true when all earliest/latest bounds are equal (full date)", () => {
    expect(isExactDate({
      earliestYear: "603", earliestMonth: "4", earliestDay: "21",
      latestYear: "603", latestMonth: "4", latestDay: "21",
    })).toBe(true)
  })

  it("returns true for a year-only exact date (month/day both null)", () => {
    expect(isExactDate({
      earliestYear: "603", earliestMonth: null, earliestDay: null,
      latestYear: "603", latestMonth: null, latestDay: null,
    })).toBe(true)
  })

  it("returns false when bounds differ (a real range)", () => {
    expect(isExactDate({
      earliestYear: "603", earliestMonth: null, earliestDay: null,
      latestYear: "610", latestMonth: null, latestDay: null,
    })).toBe(false)
    expect(isExactDate({
      earliestYear: "603", earliestMonth: "4", earliestDay: "21",
      latestYear: "603", latestMonth: "4", latestDay: "22",
    })).toBe(false)
  })

  it("returns false when the year is empty/null (blank new event → range mode)", () => {
    expect(isExactDate({
      earliestYear: null, earliestMonth: null, earliestDay: null,
      latestYear: null, latestMonth: null, latestDay: null,
    })).toBe(false)
    expect(isExactDate({
      earliestYear: "", earliestMonth: "", earliestDay: "",
      latestYear: "", latestMonth: "", latestDay: "",
    })).toBe(false)
  })

  it("normalizes string vs number and blank vs null when comparing", () => {
    // 603 (number) vs "603" (string) are equal; "" and null are both "no value".
    expect(isExactDate({
      earliestYear: 603, earliestMonth: null, earliestDay: "",
      latestYear: "603", latestMonth: "", latestDay: null,
    })).toBe(true)
  })

  it("returns false for missing/undefined input", () => {
    expect(isExactDate(null)).toBe(false)
    expect(isExactDate(undefined)).toBe(false)
  })
})
