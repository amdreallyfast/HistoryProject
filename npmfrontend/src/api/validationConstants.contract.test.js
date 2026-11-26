/* eslint-env node */
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { describe, it, expect } from "vitest"

// Limits that are enforced on BOTH tiers and coupled only by "keep in sync" comments.
// If they drift, a payload can pass client validation and then be rejected by the server
// with a 422. This test reads the real source files and asserts the constants match, so
// drift fails CI instead of users.
//
// Covered here: the image size cap and PNG/JPEG magic bytes (frontend api/imageDataUrl.js
// vs backend Validation/EventValidation.cs), and the region boundary-point cap (frontend
// GlobeSection/constValues.jsx vs the same backend file).
//
// NOT covered: latitude/longitude ranges. Those are enforced only on the backend — the
// frontend has no corresponding constant — so there is no duplication to guard. Adding a
// frontend constant purely to have something to compare would be inventing a contract
// rather than protecting one.

const here = dirname(fileURLToPath(import.meta.url))
const jsSource = readFileSync(join(here, "imageDataUrl.js"), "utf8")
const csSource = readFileSync(
  join(here, "../../../WebAPI/WebAPI/Validation/EventValidation.cs"),
  "utf8",
)
const constValuesSource = readFileSync(join(here, "../GlobeSection/constValues.jsx"), "utf8")

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

// Handles both C# `Name = 128;` and a JS object property `name: 128,`.
function extractNumber(src, namePattern) {
  const m = src.match(new RegExp(`${namePattern}\\s*[:=]\\s*([0-9*\\s]+?)\\s*[;,\\n]`))
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

describe("frontend/backend region limits stay in sync", () => {
  it("regionInfo.maxBoundaryPoints (JS) === MaxRegionPoints (C#)", () => {
    // The UI cap exists for drag performance; the backend cap exists because a tampered
    // client is not bound by the UI at all. They must agree, or a region a user can build
    // in the editor gets rejected on submit.
    expect(extractNumber(constValuesSource, "maxBoundaryPoints")).toBe(
      extractNumber(csSource, "MaxRegionPoints"),
    )
  })
})
