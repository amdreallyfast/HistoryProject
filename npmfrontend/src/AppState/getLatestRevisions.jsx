/**
 * Given an array of events (possibly with multiple revisions per eventId),
 * returns only the latest revision of each event.
 */
export function getLatestRevisions(events) {
  if (!events) return null

  let latestByEventId = {}
  events.forEach(event => {
    let existing = latestByEventId[event.eventId]
    if (!existing || (event.revision || 1) > (existing.revision || 1)) {
      latestByEventId[event.eventId] = event
    }
  })

  return Object.values(latestByEventId)
}
