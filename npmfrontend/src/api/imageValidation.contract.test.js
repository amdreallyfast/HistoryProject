/* eslint-env node */
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { describe, it, expect } from "vitest"

// The image size cap and PNG/JPEG magic-byte signatures are enforced in BOTH the
// frontend (api/imageDataUrl.js) and the backend (HistoricalEventController.cs).
// They are coupled only by "keep in sync" comments — if they drift, a file can pass
// client validation and then be rejected by the server with a 422 (and, given the
// optimistic-submit path, leave a phantom event). This test reads both source files
// and asserts the constants match, so drift fails CI instead of users.

const here = dirname(fileURLToPath(import.meta.url))
const jsSource = readFileSync(join(here, "imageDataUrl.js"), "utf8")
const csSource = readFileSync(
  join(here, "../../../WebAPI/WebAPI/Controllers/HistoricalEventController.cs"),
  "utf8",
)

// Evaluate an integer expression like "5 * 1024 * 1024" by multiplying its factors.
function product(expr) {
  const factors = expr.match(/\d+/g)
  if (!factors) throw new Error(`No integer factors found in: ${expr}`)
  return factors.reduce((acc, n) => acc * parseInt(n, 10), 1)
}

function extractMax(src, namePattern) {
  const m = src.match(new RegExp(`${namePattern}\\s*=\\s*([0-9*\\s]+?)\\s*[;\\n]`))
  if (!m) throw new Error(`Could not find ${namePattern} in source`)
  return product(m[1])
}

function extractSignature(src, namePattern) {
  // Matches both JS array literal [...] and C# initializer { ... }.
  const m = src.match(new RegExp(`${namePattern}\\s*=\\s*[[{]([^}\\]]*)[}\\]]`))
  if (!m) throw new Error(`Could not find ${namePattern} in source`)
  const bytes = m[1].match(/0x[0-9a-fA-F]+/g) ?? []
  return bytes.map((b) => parseInt(b, 16))
}

describe("frontend/backend image-validation constants stay in sync", () => {
  it("MAX_IMAGE_BYTES (JS) === MaxImageBytes (C#)", () => {
    expect(extractMax(jsSource, "MAX_IMAGE_BYTES")).toBe(extractMax(csSource, "MaxImageBytes"))
  })

  it("PNG signature matches", () => {
    expect(extractSignature(jsSource, "PNG_SIGNATURE")).toEqual(extractSignature(csSource, "PngSignature"))
  })

  it("JPEG signature matches", () => {
    expect(extractSignature(jsSource, "JPEG_SIGNATURE")).toEqual(extractSignature(csSource, "JpegSignature"))
  })
})
