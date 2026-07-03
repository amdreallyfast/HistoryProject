const baseUrl = import.meta.env.VITE_API_BASE_URL

export async function getFirst100() {
  const resp = await fetch(`${baseUrl}/api/HistoricalEvent/GetFirst100`)
  if (!resp.ok) throw new Error(`GetFirst100 failed: ${resp.status}`)
  return resp.json()
}

export async function getAllRevisions(eventId) {
  const resp = await fetch(`${baseUrl}/api/HistoricalEvent/GetAllRevisions/${eventId}`)
  if (!resp.ok) throw new Error(`GetAllRevisions failed: ${resp.status}`)
  return resp.json()
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
