import { describe, it, expect } from "vitest"
import { stateSliceEvent, eventStateActions } from "./stateSliceEvent"

const reducer = stateSliceEvent.reducer

// upsertEventRevisions replaces one event's revisions in place after a submit re-fetches
// the authoritative GetAllRevisions for the edited event. It must touch only that event.
describe("upsertEventRevisions", () => {
  it("replaces an existing event's revisions, leaving other events untouched", () => {
    const start = {
      allEvents: [
        { eventId: "a", revision: 1, title: "A r1" },
        { eventId: "b", revision: 1, title: "B r1" },
      ],
      selectedEvent: null,
      prevSelectedEvent: null,
    }
    const fresh = [
      { eventId: "a", revision: 1, title: "A r1" },
      { eventId: "a", revision: 2, title: "A r2" },
    ]
    const next = reducer(start, eventStateActions.upsertEventRevisions({ eventId: "a", revisions: fresh }))

    const aRevs = next.allEvents.filter(e => e.eventId === "a")
    const bRevs = next.allEvents.filter(e => e.eventId === "b")
    expect(aRevs).toHaveLength(2)
    expect(aRevs.map(r => r.revision).sort()).toEqual([1, 2])
    // Other events are preserved exactly.
    expect(bRevs).toEqual([{ eventId: "b", revision: 1, title: "B r1" }])
  })

  it("adds revisions when the eventId is not yet present", () => {
    const start = { allEvents: [{ eventId: "a", revision: 1 }], selectedEvent: null, prevSelectedEvent: null }
    const next = reducer(start, eventStateActions.upsertEventRevisions({
      eventId: "c",
      revisions: [{ eventId: "c", revision: 1 }],
    }))
    expect(next.allEvents).toHaveLength(2)
    expect(next.allEvents.some(e => e.eventId === "c")).toBe(true)
  })

  it("tolerates a null allEvents", () => {
    const start = { allEvents: null, selectedEvent: null, prevSelectedEvent: null }
    const next = reducer(start, eventStateActions.upsertEventRevisions({
      eventId: "a",
      revisions: [{ eventId: "a", revision: 1 }],
    }))
    expect(next.allEvents).toEqual([{ eventId: "a", revision: 1 }])
  })
})
