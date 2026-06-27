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
