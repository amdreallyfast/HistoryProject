import { getLatestRevisions } from "./getLatestRevisions"

// Decide which revision's geometry the globe should draw for each event.
//
// The globe normally shows the latest revision of every event. But when the user is
// browsing revisions (RevisionStack), the *selected* event should show the geometry of the
// revision they picked — which may be an older one — not its latest. Everyone else keeps
// showing their latest. Returns lat/long sources (no Three.js); Scene converts them to
// sphere points. Events without a primary location are dropped (nothing to anchor).
export function buildDisplayRegions(allEvents, selectedEvent) {
  const latest = getLatestRevisions(allEvents) || []
  return latest
    .map((latestEvent) => {
      const isSelected = !!selectedEvent && latestEvent.eventId === selectedEvent.eventId
      const source = isSelected ? selectedEvent : latestEvent
      return {
        eventId: latestEvent.eventId,
        primaryLoc: source.primaryLoc,
        regionBoundaries: source.regionBoundaries || [],
        isSelected,
      }
    })
    .filter((e) => e.primaryLoc)
}
