import { imageBinaryToDataUrl } from "./imageDataUrl"

const baseUrl = import.meta.env.VITE_API_BASE_URL

export async function getFirst100() {
  const resp = await fetch(`${baseUrl}/api/HistoricalEvent/GetFirst100`)
  if (!resp.ok) throw new Error(`GetFirst100 failed: ${resp.status}`)
  return resp.json()
}

// Revisions come without image bytes: each has EventImage { Id, ImageBinary: "" }. Show an
// image by fetching it with getImageDataUrl(EventImage.Id) (see useEventImageDataUrl).
export async function getAllRevisions(eventId) {
  const resp = await fetch(`${baseUrl}/api/HistoricalEvent/GetAllRevisions/${eventId}`)
  if (!resp.ok) throw new Error(`GetAllRevisions failed: ${resp.status}`)
  return resp.json()
}

// One image's bytes as a data URL, by image row Id. null if the event has no image (204).
// The backend marks the response cacheable forever (image rows never change).
export async function getImageDataUrl(imageId) {
  const resp = await fetch(`${baseUrl}/api/HistoricalEvent/GetImage/${imageId}`)
  if (resp.status === 204) return null
  if (!resp.ok) throw new Error(`GetImage failed: ${resp.status}`)
  return imageBinaryToDataUrl(bytesToBase64(new Uint8Array(await resp.arrayBuffer())))
}

function bytesToBase64(bytes) {
  // Chunked: String.fromCharCode(...bigArray) overflows the call stack for multi-MB images.
  let binary = ""
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

export async function createEvent(backendEvent) {
  const resp = await fetch(`${baseUrl}/api/HistoricalEvent/Create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(backendEvent),
  })
  if (!resp.ok) {
    // Include the response body so callers can show the backend's reason — e.g. a 422
    // from image validation ("Image exceeds 5MB limit.") — instead of a bare status code.
    const body = await resp.text().catch(() => "")
    throw new Error(body ? `Create failed: ${resp.status} — ${body}` : `Create failed: ${resp.status}`)
  }
  return resp.json()
}
