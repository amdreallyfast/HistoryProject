import { describe, it, expect, vi, afterEach } from "vitest"
import { createEvent } from "./historyEventApi"

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
