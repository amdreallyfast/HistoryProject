import { describe, it, expect } from "vitest"
import { buildSelectedEventPayload } from "./selectEvent"
import { globeInfo } from "../GlobeSection/constValues"

// buildSelectedEventPayload converts a frontend event's lat/long primary location and
// region boundaries into sphere points for the details/globe display, passing all other
// fields through. These cases pin down the conversion the post-submit selection relies on.

function onSphere(p) {
  // Sphere points are rescaled to globeInfo.radius; verify x/y/z land on that sphere.
  const r = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z)
  return Math.abs(r - globeInfo.radius) < 1e-6
}

describe("buildSelectedEventPayload", () => {
  it("converts primaryLoc lat/long to a sphere point on the globe radius", () => {
    const out = buildSelectedEventPayload({ primaryLoc: { lat: 41.9, long: 12.5 }, regionBoundaries: [] })
    expect(out.primaryLoc.lat).toBe(41.9)
    expect(out.primaryLoc.long).toBe(12.5)
    expect(typeof out.primaryLoc.x).toBe("number")
    expect(onSphere(out.primaryLoc)).toBe(true)
  })

  it("converts every region boundary, preserving count and lat/long", () => {
    const boundaries = [
      { lat: 42.0, long: 12.0 },
      { lat: 42.0, long: 13.0 },
      { lat: 43.0, long: 13.0 },
    ]
    const out = buildSelectedEventPayload({ primaryLoc: null, regionBoundaries: boundaries })
    expect(out.regionBoundaries).toHaveLength(3)
    out.regionBoundaries.forEach((p, i) => {
      expect(p.lat).toBe(boundaries[i].lat)
      expect(p.long).toBe(boundaries[i].long)
      expect(onSphere(p)).toBe(true)
    })
  })

  it("maps a null primaryLoc to null", () => {
    const out = buildSelectedEventPayload({ primaryLoc: null, regionBoundaries: [] })
    expect(out.primaryLoc).toBeNull()
  })

  it("treats missing regionBoundaries as an empty array", () => {
    const out = buildSelectedEventPayload({ primaryLoc: null })
    expect(out.regionBoundaries).toEqual([])
  })

  it("passes scalar fields through unchanged", () => {
    const out = buildSelectedEventPayload({
      eventId: "evt-1",
      revision: 3,
      title: "Founding of Rome",
      imageDataUrl: "data:image/png;base64,iVBOR",
      primaryLoc: null,
      regionBoundaries: [],
    })
    expect(out.eventId).toBe("evt-1")
    expect(out.revision).toBe(3)
    expect(out.title).toBe("Founding of Rome")
    expect(out.imageDataUrl).toBe("data:image/png;base64,iVBOR")
  })
})
