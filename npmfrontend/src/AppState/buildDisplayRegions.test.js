import { describe, it, expect } from "vitest"
import { buildDisplayRegions } from "./buildDisplayRegions"

// buildDisplayRegions decides which revision's geometry the globe draws per event. The
// selected event must use the selected revision's coordinates (so browsing revisions moves
// the region on the globe); every other event uses its latest.

const evtLatest = {
  eventId: "a",
  revision: 2,
  primaryLoc: { lat: 10, long: 20 },
  regionBoundaries: [{ lat: 1, long: 1 }, { lat: 2, long: 2 }],
}
const evtOlderSelected = {
  eventId: "a",
  revision: 1,
  primaryLoc: { lat: 11, long: 21 },
  regionBoundaries: [{ lat: 5, long: 5 }, { lat: 6, long: 6 }, { lat: 7, long: 7 }],
}
const otherEvent = {
  eventId: "b",
  revision: 1,
  primaryLoc: { lat: 30, long: 40 },
  regionBoundaries: [{ lat: 3, long: 3 }],
}

describe("buildDisplayRegions", () => {
  it("uses the selected revision's geometry for the selected event, latest for others", () => {
    const out = buildDisplayRegions([evtLatest, otherEvent], evtOlderSelected)

    const a = out.find((e) => e.eventId === "a")
    const b = out.find((e) => e.eventId === "b")
    // Selected event "a" shows the older (selected) revision's coordinates.
    expect(a.isSelected).toBe(true)
    expect(a.primaryLoc).toEqual({ lat: 11, long: 21 })
    expect(a.regionBoundaries).toHaveLength(3)
    // Other event "b" shows its latest and is not selected.
    expect(b.isSelected).toBe(false)
    expect(b.regionBoundaries).toEqual([{ lat: 3, long: 3 }])
  })

  it("uses latest for every event when nothing is selected", () => {
    const out = buildDisplayRegions([evtLatest, otherEvent], null)
    expect(out.every((e) => e.isSelected === false)).toBe(true)
    const a = out.find((e) => e.eventId === "a")
    expect(a.primaryLoc).toEqual({ lat: 10, long: 20 })
    expect(a.regionBoundaries).toHaveLength(2)
  })

  it("drops events without a primary location", () => {
    const noLoc = { eventId: "c", revision: 1, primaryLoc: null, regionBoundaries: [] }
    const out = buildDisplayRegions([evtLatest, noLoc], null)
    expect(out.map((e) => e.eventId)).toEqual(["a"])
  })

  it("returns an empty array for null allEvents", () => {
    expect(buildDisplayRegions(null, null)).toEqual([])
  })
})
