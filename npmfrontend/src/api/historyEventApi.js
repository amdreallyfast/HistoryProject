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
  if (!resp.ok) throw new Error(`Create failed: ${resp.status}`)
  return resp.json()
}
