/* eslint-env node */
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { describe, it, expect } from "vitest"
import {
  MAX_IMAGE_BYTES,
  dataUrlToImageBinary,
  imageBinaryToDataUrl,
  validateImageBase64,
} from "./imageDataUrl"

// Load the real Playwright fixture images so the magic-byte checks run against
// genuine bytes (a real PNG/JPEG, a real SVG, and HTML disguised as a .png).
const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "../../tests/fixtures/images")
const asBase64 = (name) => readFileSync(join(fixturesDir, name)).toString("base64")

const pngB64 = asBase64("colloseumStockPhoto.png")
const jpegB64 = asBase64("colloseumStockPhoto.jpg")
const svgB64 = asBase64("atomBohrModel.svg")
const disguisedB64 = asBase64("perfectlyNormalPng.png") // actually HTML+script

describe("validateImageBase64", () => {
  it("accepts a real PNG", () => {
    expect(validateImageBase64(pngB64)).toMatchObject({ ok: true, mime: "image/png" })
  })

  it("accepts a real JPEG", () => {
    expect(validateImageBase64(jpegB64)).toMatchObject({ ok: true, mime: "image/jpeg" })
  })

  it("rejects an SVG (not PNG/JPEG)", () => {
    expect(validateImageBase64(svgB64).ok).toBe(false)
  })

  it("rejects HTML/script disguised with a .png name (byte-based, not extension-based)", () => {
    // The file is named *.png and passes any extension/accept filter, but its bytes
    // start with "<!DOCTYPE html>", so the magic-byte check must reject it.
    expect(validateImageBase64(disguisedB64).ok).toBe(false)
  })

  it("rejects an oversized image", () => {
    // Build an oversized buffer that still carries a valid PNG signature.
    const big = Buffer.alloc(MAX_IMAGE_BYTES + 1)
    big[0] = 0x89; big[1] = 0x50; big[2] = 0x4e; big[3] = 0x47
    const result = validateImageBase64(big.toString("base64"))
    expect(result.ok).toBe(false)
    expect(result.reason).toMatch(/limit/i)
  })

  it("treats empty (no image) as valid", () => {
    expect(validateImageBase64("")).toMatchObject({ ok: true })
  })
})

describe("dataUrlToImageBinary", () => {
  it("strips the data-URL prefix", () => {
    expect(dataUrlToImageBinary("data:image/png;base64,AAAA")).toBe("AAAA")
  })

  it("maps null/empty to empty string (the no-image sentinel)", () => {
    expect(dataUrlToImageBinary(null)).toBe("")
    expect(dataUrlToImageBinary(undefined)).toBe("")
    expect(dataUrlToImageBinary("")).toBe("")
  })
})

describe("imageBinaryToDataUrl", () => {
  it("wraps PNG bytes with the sniffed image/png MIME", () => {
    expect(imageBinaryToDataUrl(pngB64)).toBe(`data:image/png;base64,${pngB64}`)
  })

  it("wraps JPEG bytes with the sniffed image/jpeg MIME", () => {
    expect(imageBinaryToDataUrl(jpegB64)).toBe(`data:image/jpeg;base64,${jpegB64}`)
  })

  it("returns null for empty input", () => {
    expect(imageBinaryToDataUrl("")).toBeNull()
    expect(imageBinaryToDataUrl(null)).toBeNull()
  })

  it("returns null for unrecognized bytes", () => {
    expect(imageBinaryToDataUrl(svgB64)).toBeNull()
  })

  it("round-trips data URL -> binary -> data URL for PNG and JPEG", () => {
    const pngUrl = `data:image/png;base64,${pngB64}`
    expect(imageBinaryToDataUrl(dataUrlToImageBinary(pngUrl))).toBe(pngUrl)
    const jpegUrl = `data:image/jpeg;base64,${jpegB64}`
    expect(imageBinaryToDataUrl(dataUrlToImageBinary(jpegUrl))).toBe(jpegUrl)
  })
})
