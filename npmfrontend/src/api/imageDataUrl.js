// Helpers for moving event images between the frontend (base64 data URLs used by
// <img src>) and the backend (raw bytes; Newtonsoft serializes byte[] as a bare
// base64 string). The backend stores only raw bytes — no MIME type — so the image
// kind is sniffed from the leading magic bytes on the way back out.

// Cap upload size. Base64 inflates ~33%, so the encoded string is larger than this,
// but the cap is expressed against the decoded byte length (what is actually stored).
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

// Supported image signatures (first bytes of the decoded binary).
//   PNG:  89 50 4E 47
//   JPEG: FF D8 FF
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47]
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff]

// Decode just the leading bytes of a base64 string into a number[] for signature
// checks. atob yields a binary string; charCodeAt gives each byte.
function leadingBytes(base64, count) {
  // A base64 quartet encodes 3 bytes, so decode enough quartets to cover `count`.
  const quartets = Math.ceil(count / 3)
  const head = base64.slice(0, quartets * 4)
  const binary = atob(head)
  const bytes = []
  for (let i = 0; i < Math.min(count, binary.length); i++) {
    bytes.push(binary.charCodeAt(i) & 0xff)
  }
  return bytes
}

function startsWith(bytes, signature) {
  if (bytes.length < signature.length) return false
  return signature.every((b, i) => bytes[i] === b)
}

// Returns the MIME type ("image/png" | "image/jpeg") for the decoded leading bytes,
// or null if they match no supported signature.
function sniffMime(bytes) {
  if (startsWith(bytes, PNG_SIGNATURE)) return "image/png"
  if (startsWith(bytes, JPEG_SIGNATURE)) return "image/jpeg"
  return null
}

// Decoded byte length of a base64 string (without allocating the full buffer).
function base64ByteLength(base64) {
  if (!base64) return 0
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0
  return Math.floor((base64.length * 3) / 4) - padding
}

// frontend data URL ("data:image/png;base64,AAAA") → bare base64 body ("AAAA").
// Null/empty → "" (the backend's "no image" sentinel; ImageBinary becomes empty bytes).
export function dataUrlToImageBinary(dataUrl) {
  if (!dataUrl) return ""
  const commaIndex = dataUrl.indexOf(",")
  return commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : dataUrl
}

// backend base64 body → frontend data URL, with the MIME sniffed from magic bytes.
// Empty (no image) → null. Unrecognized bytes → null (do not surface garbage to <img>).
export function imageBinaryToDataUrl(base64) {
  if (!base64) return null
  let mime
  try {
    mime = sniffMime(leadingBytes(base64, 4))
  } catch {
    return null
  }
  if (!mime) return null
  return `data:${mime};base64,${base64}`
}

// Validate a base64 image body for storage: must be a non-empty PNG/JPEG within the
// size cap. Empty is treated as "no image" (valid, nothing to store).
// Returns { ok, mime, reason }.
export function validateImageBase64(base64) {
  if (!base64) return { ok: true, mime: null, reason: "no image" }

  const byteLength = base64ByteLength(base64)
  if (byteLength > MAX_IMAGE_BYTES) {
    return { ok: false, mime: null, reason: `Image exceeds ${Math.round(MAX_IMAGE_BYTES / (1024 * 1024))}MB limit.` }
  }

  let mime
  try {
    mime = sniffMime(leadingBytes(base64, 4))
  } catch {
    return { ok: false, mime: null, reason: "Could not read image data." }
  }
  if (!mime) {
    return { ok: false, mime: null, reason: "Only PNG or JPEG images are allowed." }
  }

  return { ok: true, mime, reason: null }
}
