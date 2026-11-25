import { describe, it, expect, vi, afterEach } from "vitest"
import { createEvent, getImageDataUrl } from "./historyEventApi"

// createEvent must surface the backend's rejection reason so the edit panel can show a
// useful inline error (e.g. the 422 from image validation) rather than a bare status code.

afterEach(() => {
  vi.unstubAllGlobals()
})

function stubFetch(impl) {
  vi.stubGlobal("fetch", vi.fn(impl))
}

describe("createEvent", () => {
  it("resolves with the parsed JSON on a 2xx response", async () => {
    stubFetch(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ Id: "abc" }),
    }))
    await expect(createEvent({})).resolves.toEqual({ Id: "abc" })
  })

  it("throws with the status AND the response body on a 422", async () => {
    stubFetch(async () => ({
      ok: false,
      status: 422,
      text: async () => "Image exceeds 5MB limit.",
    }))
    await expect(createEvent({})).rejects.toThrow(/422.*Image exceeds 5MB limit\./)
  })

  it("falls back to just the status when the body is empty", async () => {
    stubFetch(async () => ({
      ok: false,
      status: 500,
      text: async () => "",
    }))
    await expect(createEvent({})).rejects.toThrow(/Create failed: 500$/)
  })

  it("propagates a network-level rejection", async () => {
    stubFetch(async () => { throw new Error("Failed to fetch") })
    await expect(createEvent({})).rejects.toThrow(/Failed to fetch/)
  })
})

describe("getImageDataUrl", () => {
  // GetImage returns raw bytes; the client turns them into the same data URL shape the rest of
  // the app uses (MIME sniffed from the magic bytes).
  it("turns raw PNG bytes into a PNG data URL", async () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    stubFetch(async () => ({ ok: true, status: 200, arrayBuffer: async () => png.buffer }))
    await expect(getImageDataUrl("img-1")).resolves.toBe("data:image/png;base64,iVBORw0KGgo=")
  })

  it("handles multi-MB images (no call-stack overflow)", async () => {
    const big = new Uint8Array(3 * 1024 * 1024)
    big.set([0xff, 0xd8, 0xff, 0xe0])
    stubFetch(async () => ({ ok: true, status: 200, arrayBuffer: async () => big.buffer }))
    const url = await getImageDataUrl("img-big")
    expect(url.startsWith("data:image/jpeg;base64,/9j/4")).toBe(true)
    expect(url.length).toBeGreaterThan(4 * 1024 * 1024)
  })

  it("returns null when the event has no image (204)", async () => {
    stubFetch(async () => ({ ok: true, status: 204 }))
    await expect(getImageDataUrl("img-none")).resolves.toBeNull()
  })

  it("throws on other errors", async () => {
    stubFetch(async () => ({ ok: false, status: 404 }))
    await expect(getImageDataUrl("nope")).rejects.toThrow("GetImage failed: 404")
  })
})
