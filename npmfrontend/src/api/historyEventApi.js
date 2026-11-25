const baseUrl = import.meta.env.VITE_API_BASE_URL

export async function getFirst100() {
  const resp = await fetch(`${baseUrl}/api/HistoricalEvent/GetFirst100`)
  if (!resp.ok) throw new Error(`GetFirst100 failed: ${resp.status}`)
  return resp.json()
}

export async function getAllRevisions(eventId) {
  const resp = await fetch(`${baseUrl}/api/HistoricalEvent/GetAllRevisions/${eventId}`)
  if (!resp.ok) throw new Error(`GetAllRevisions failed: ${resp.status}`)
  return fillSharedRevisionImages(await resp.json())
}

// Revisions share an unchanged image, and GetAllRevisions sends each image's bytes only once
// (on the newest revision using it); the others come with the same EventImage.Id and empty
// ImageBinary. Copy the bytes across by Id so every revision has its image. A revision whose
// image has no bytes anywhere in the response genuinely has no image and stays empty.
export function fillSharedRevisionImages(revisions) {
  const bytesByImageId = new Map()
  for (const r of revisions) {
    if (r.EventImage?.Id && r.EventImage.ImageBinary) {
      bytesByImageId.set(r.EventImage.Id, r.EventImage.ImageBinary)
    }
  }
  return revisions.map((r) =>
    r.EventImage?.Id && !r.EventImage.ImageBinary && bytesByImageId.has(r.EventImage.Id)
      ? { ...r, EventImage: { ...r.EventImage, ImageBinary: bytesByImageId.get(r.EventImage.Id) } }
      : r
  )
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
