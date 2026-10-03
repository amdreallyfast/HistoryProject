import { describe, it, expect } from "vitest"
import { backendToFrontend, frontendToBackend } from "./eventMapper"

// 1x1 PNG (valid signature) used to assert the image survives the round trip.
const PNG_B64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMCAQDJ/IAYAAAAAElFTkSuQmCC"

describe("backendToFrontend", () => {
  it("reconstructs imageDataUrl from EventImage.ImageBinary (magic-byte MIME)", () => {
    const fe = backendToFrontend({ EventImage: { ImageBinary: PNG_B64 } })
    expect(fe.imageDataUrl).toBe(`data:image/png;base64,${PNG_B64}`)
  })

  it("maps empty/missing image to null", () => {
    expect(backendToFrontend({ EventImage: { ImageBinary: "" } }).imageDataUrl).toBeNull()
    expect(backendToFrontend({}).imageDataUrl).toBeNull()
  })

  it("carries EventIsCreationOfSource through", () => {
    expect(backendToFrontend({ EventIsCreationOfSource: true }).eventIsCreationOfSource).toBe(true)
    expect(backendToFrontend({ EventIsCreationOfSource: false }).eventIsCreationOfSource).toBe(false)
    expect(backendToFrontend({}).eventIsCreationOfSource).toBe(false)
  })

  it("carries RevisionDateTime through (for the revision-history table)", () => {
    expect(backendToFrontend({ RevisionDateTime: "2026-06-28T14:30:00Z" }).revisionDateTime).toBe("2026-06-28T14:30:00Z")
    expect(backendToFrontend({}).revisionDateTime).toBeNull()
  })
})

describe("frontendToBackend", () => {
  it("strips the data-URL prefix into EventImage.ImageBinary", () => {
    const be = frontendToBackend({ imageDataUrl: `data:image/png;base64,${PNG_B64}` })
    expect(be.EventImage.ImageBinary).toBe(PNG_B64)
  })

  it("sends empty ImageBinary when there is no image", () => {
    expect(frontendToBackend({ imageDataUrl: null }).EventImage.ImageBinary).toBe("")
  })

  it("carries EventIsCreationOfSource through", () => {
    expect(frontendToBackend({ eventIsCreationOfSource: true }).EventIsCreationOfSource).toBe(true)
    expect(frontendToBackend({}).EventIsCreationOfSource).toBe(false)
  })
})

describe("image round trip", () => {
  it("backend -> frontend -> backend preserves the stored bytes", () => {
    const fe = backendToFrontend({ EventImage: { ImageBinary: PNG_B64 } })
    const be = frontendToBackend(fe)
    expect(be.EventImage.ImageBinary).toBe(PNG_B64)
  })
})

describe("frontendToBackend normalizes region winding", () => {
  // The orientation EarClipping accepts — same fixture used as the oracle in
  // tests/region-winding.spec.ts and regionSignedArea.test.js.
  const ccw = [
    { lat: 42.0, long: 12.0 },
    { lat: 42.0, long: 13.0 },
    { lat: 43.0, long: 13.0 },
    { lat: 43.0, long: 12.0 },
  ]

  const eventWith = (regionBoundaries) => ({
    eventId: "e1",
    revision: 1,
    title: "t",
    summary: "s",
    primaryLoc: { lat: 42.5, long: 12.5 },
    regionBoundaries,
  })

  const latLongs = (backend) => backend.Region.map(r => [r.Latitude, r.Longitude])

  it("leaves a counterclockwise boundary in its original order", () => {
    const out = frontendToBackend(eventWith(ccw))
    expect(latLongs(out)).toEqual(ccw.map(p => [p.lat, p.long]))
  })

  it("reverses a clockwise boundary so the stored ring is counterclockwise", () => {
    const cw = [...ccw].reverse()
    const out = frontendToBackend(eventWith(cw))

    // Reversing a merely-clockwise ring yields the same shape wound the right way.
    expect(latLongs(out)).toEqual(ccw.map(p => [p.lat, p.long]))
  })

  it("assigns OrderIndex from the normalized sequence, not the input order", () => {
    // OrderIndex — not list position — is what the backend winding check and
    // backendToFrontend both treat as the ring order. If OrderIndex were assigned before
    // reversing, the stored ring would still be clockwise and the backend would 422 it.
    const out = frontendToBackend(eventWith([...ccw].reverse()))

    expect(out.Region.map(r => r.OrderIndex)).toEqual([0, 1, 2, 3])
    const byOrder = [...out.Region].sort((a, b) => a.OrderIndex - b.OrderIndex)
    expect(byOrder.map(r => [r.Latitude, r.Longitude])).toEqual(ccw.map(p => [p.lat, p.long]))
  })

  it("leaves a degenerate boundary untouched rather than reordering it", () => {
    // Collinear points have no orientation to correct. Silently reordering them would
    // disguise bad data as good; the triangulation gate blocks Submit anyway, and the
    // backend rejects it if one ever gets through.
    const collinear = [
      { lat: 10, long: 0 },
      { lat: 20, long: 0 },
      { lat: 30, long: 0 },
    ]
    const out = frontendToBackend(eventWith(collinear))
    expect(latLongs(out)).toEqual(collinear.map(p => [p.lat, p.long]))
  })

  it("passes through boundaries too short to enclose anything", () => {
    expect(frontendToBackend(eventWith([])).Region).toEqual([])
    const two = [{ lat: 1, long: 2 }, { lat: 3, long: 4 }]
    expect(latLongs(frontendToBackend(eventWith(two)))).toEqual(two.map(p => [p.lat, p.long]))
  })
})
