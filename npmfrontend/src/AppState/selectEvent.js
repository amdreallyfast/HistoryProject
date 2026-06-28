import { eventStateActions } from "./stateSliceEvent"
import { selectedEventStateActions } from "./stateSliceSelectedEvent"
import { createSpherePointFromLatLong } from "../GlobeSection/createSpherePoint"
import { globeInfo } from "../GlobeSection/constValues"

// The details panel reads sphere points (x/y/z) for the primary pin and region; a
// frontend event stores boundaries as lat/long. Convert them so the selected-event store
// has what the globe display expects. Pure (aside from the uuid each sphere point gets),
// so it is unit-testable on its own.
export function buildSelectedEventPayload(frontendEvent) {
  const primaryLoc = frontendEvent.primaryLoc
    ? createSpherePointFromLatLong(frontendEvent.primaryLoc.lat, frontendEvent.primaryLoc.long, globeInfo.radius)
    : null
  const regionBoundaries = (frontendEvent.regionBoundaries || []).map((b) =>
    createSpherePointFromLatLong(b.lat, b.long, globeInfo.radius)
  )
  return {
    ...frontendEvent,
    primaryLoc,
    regionBoundaries,
  }
}

// Make `frontendEvent` the active selection: highlight it on the globe / search list
// (eventReducer.selectedEvent) and populate the details panel (selectedEventReducer).
// Centralized here so the several call sites (search result click, globe click re-sync,
// revision click, submit) stay identical and can't drift apart.
export function selectEvent(reduxDispatch, frontendEvent) {
  reduxDispatch(eventStateActions.setSelectedEvent(frontendEvent))
  reduxDispatch(selectedEventStateActions.load(buildSelectedEventPayload(frontendEvent)))
}
