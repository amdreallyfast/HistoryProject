import { useMemo, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { useQueryClient } from "@tanstack/react-query"
import { EditEventHeader } from "./EditEventHeader";
import { EditEventType } from "./EditEventType";
import { EditEventImage } from "./EditEventImage";
import { EditEventTime } from "./EditEventTime";
import { EditEventRegion } from "./EditEventRegion";
import { EditEventSummary } from "./EditEventSummary";
import { EditEventSources } from "./EditEventSources";
import { editEventStateActions } from "../../AppState/stateSliceEditEvent";
import { eventStateActions } from "../../AppState/stateSliceEvent";
import { selectEvent } from "../../AppState/selectEvent";
import { getLatestRevisions } from "../../AppState/getLatestRevisions";
import { createEvent, getAllRevisions } from "../../api/historyEventApi";
import { frontendToBackend, backendToFrontend } from "../../api/eventMapper";
import { isDateRangeInverted, isMonthOutOfRange, isDayOutOfRange } from "./detailRestrictions";


export function EditEvent() {
  const reduxDispatch = useDispatch()
  const queryClient = useQueryClient()
  const editState = useSelector((state) => state.editEventReducer)
  const allEvents = useSelector((state) => state.eventReducer.allEvents)
  const editSources = useSelector((state) => state.editSources)

  // Submit is confirm-before-commit: while the backend Create is in flight we show a scrim
  // and keep the edit panel open; only on success do we append/select/exit. A failure
  // leaves the panel open with an inline error (and nothing appended → no phantom event).
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  // Compare current edit state against original snapshot to detect changes.
  // Compares the fields that the user can edit (not sphere point ids/xyz, just lat/long).
  const hasChanges = useMemo(() => {
    let orig = editState.originalEvent
    if (!orig) return false

    if (editState.title !== orig.title) return true
    if (editState.summary !== orig.summary) return true
    if (editState.eventIsCreationOfSource !== orig.eventIsCreationOfSource) return true
    if (editState.imageDataUrl !== orig.imageDataUrl) return true
    if (JSON.stringify(editState.tags) !== JSON.stringify(orig.tags)) return true
    if (JSON.stringify(editState.eventTime) !== JSON.stringify(orig.eventTime)) return true

    // Compare primary location (lat/long only)
    let editLat = editState.primaryLoc?.lat
    let editLong = editState.primaryLoc?.long
    let origLat = orig.primaryLoc?.lat
    let origLong = orig.primaryLoc?.long
    if (editLat !== origLat || editLong !== origLong) return true

    // Compare region boundaries (lat/long only)
    if (editState.regionBoundaries.length !== orig.regionBoundaries.length) return true
    for (let i = 0; i < editState.regionBoundaries.length; i++) {
      if (editState.regionBoundaries[i].lat !== orig.regionBoundaries[i].lat) return true
      if (editState.regionBoundaries[i].long !== orig.regionBoundaries[i].long) return true
    }

    // Compare sources from editSources slice (extract only comparable fields)
    let editSourceKeys = Object.keys(editSources)
    if (editSourceKeys.length !== orig.sources.length) return true
    let editSourcesArr = editSourceKeys.map(k => {
      let s = editSources[k]
      return {
        title: s.title,
        isbn: s.isbn,
        whereInSource: s.whereInSource,
        publicationTime: s.publicationTime,
        authors: s.authors,
      }
    })
    for (let i = 0; i < editSourcesArr.length; i++) {
      if (JSON.stringify(editSourcesArr[i]) !== JSON.stringify(orig.sources[i])) return true
    }

    return false
  }, [editState, editSources])

  const hasDateErrors = useMemo(() => {
    const et = editState.eventTime
    if (isDateRangeInverted(et.earliestYear, et.earliestMonth, et.earliestDay,
                            et.latestYear,   et.latestMonth,   et.latestDay)) return true
    if (isMonthOutOfRange(et.earliestMonth) || isMonthOutOfRange(et.latestMonth)) return true
    if (isDayOutOfRange(et.earliestDay)     || isDayOutOfRange(et.latestDay))     return true

    for (const key of Object.keys(editSources)) {
      const pt = editSources[key].publicationTime
      if (isDateRangeInverted(pt.earliestYear, pt.earliestMonth, pt.earliestDay,
                              pt.latestYear,   pt.latestMonth,   pt.latestDay)) return true
      if (isMonthOutOfRange(pt.earliestMonth) || isMonthOutOfRange(pt.latestMonth)) return true
      if (isDayOutOfRange(pt.earliestDay)     || isDayOutOfRange(pt.latestDay))     return true
    }
    return false
  }, [editState.eventTime, editSources])

  // Block submit when the region boundary can't actually be triangulated. Rather than
  // recompute that here (which would re-run mesh generation), we read the regionValid
  // flag that EditRegionMesh publishes — it already triangulates to build the mesh and
  // knows valid vs. red. This catches both whole-polygon clockwise winding AND a local
  // single-pin twist that keeps global winding positive but still makes EarClipping
  // throw. Submitting either would persist a region whose display mesh can't render.
  // (Edge-crossing self-intersection that triangulates *silently wrong* without throwing
  // is out of scope by decision.)
  const hasRegionError = !editState.regionValid

  const onSubmitClick = async () => {

    // Find max revision for this eventId. allEvents is null until the user runs
    // Search at least once, so guard against it (a brand-new event submitted from
    // a fresh session has no prior revisions anyway → maxRevision stays 0).
    let maxRevision = 0
    allEvents?.forEach(ev => {
      if (ev.eventId === editState.eventId && ev.revision > maxRevision) {
        maxRevision = ev.revision
      }
    })

    // Reassemble sources from editSources slice (keyed object -> array)
    let sourcesArray = Object.keys(editSources).map(editId => {
      let src = editSources[editId]
      return {
        title: src.title,
        isbn: src.isbn,
        whereInSource: src.whereInSource,
        publicationTime: { ...src.publicationTime },
        authors: src.authors || [],
      }
    })

    // If no sources were in editSources, fall back to what was in editState
    if (sourcesArray.length === 0 && editState.sources?.length > 0) {
      sourcesArray = editState.sources
    }

    // Build the new revision (stored in allEvents with just lat/long)
    let newEvent = {
      eventId: editState.eventId,
      revision: maxRevision + 1,
      revisionAuthor: "amdreallyfast",
      title: editState.title,
      tags: editState.tags,
      summary: editState.summary,
      eventIsCreationOfSource: editState.eventIsCreationOfSource,
      imageDataUrl: editState.imageDataUrl,
      eventTime: { ...editState.eventTime },
      primaryLoc: editState.primaryLoc
        ? { lat: editState.primaryLoc.lat, long: editState.primaryLoc.long }
        : null,
      regionBoundaries: editState.regionBoundaries.map(rb => ({
        lat: rb.lat,
        long: rb.long,
      })),
      sources: sourcesArray,
    }

    // Confirm with the backend BEFORE committing to local state. Keep the edit panel open
    // (under a scrim) until Create resolves so a rejection never leaves a phantom event.
    setSubmitError(null)
    setSubmitting(true)
    try {
      await createEvent(frontendToBackend(newEvent))
    } catch (err) {
      // Create failed: drop the scrim, stay in edit mode, surface the reason so the user
      // can fix and retry. Nothing was committed, so there is no phantom to clean up.
      setSubmitting(false)
      setSubmitError(err.message || "Submit failed. Please try again.")
      return
    }

    // Create succeeded — confirm with an authoritative re-fetch of THIS event's revisions
    // and update it in place (rather than trusting the locally-built optimistic event).
    // The scrim stays up across this second round-trip; on resolve the details, search
    // list, globe, and revision-history list are all in sync with the server.
    try {
      const fresh = (await getAllRevisions(newEvent.eventId)).map(backendToFrontend)
      if (!fresh.length) throw new Error("no revisions returned")
      reduxDispatch(eventStateActions.upsertEventRevisions({ eventId: newEvent.eventId, revisions: fresh }))
      // Seed RevisionStack's query cache from the same fetch so its list is correct the
      // instant the panel opens (no separate refetch delay).
      queryClient.setQueryData(["revisions", newEvent.eventId], fresh)
      const latest = getLatestRevisions(fresh).find(e => e.eventId === newEvent.eventId) ?? fresh[0]
      selectEvent(reduxDispatch, latest)
    } catch (refetchErr) {
      // Create succeeded but the confirming re-fetch failed (e.g. a network blip on the
      // second call). Fall back to the optimistic local event so the successful submit is
      // not lost, and let RevisionStack refetch on its own.
      console.error({ "EditEvent.onSubmitClick[refetch]": refetchErr.message })
      reduxDispatch(eventStateActions.appendEvent(newEvent))
      selectEvent(reduxDispatch, newEvent)
      queryClient.invalidateQueries({ queryKey: ["revisions", newEvent.eventId] })
    }
    reduxDispatch(editEventStateActions.endEditMode())
  }

  const onCancelClick = () => {
    reduxDispatch(editEventStateActions.endEditMode())
  }

  return (
    <div className="relative flex flex-col h-full">
      <EditEventHeader />
      <EditEventType />
      <EditEventImage />
      <EditEventTime />
      <EditEventRegion />
      <EditEventSummary />
      <div>
        <EditEventSources />
      </div>
      {/* Revision author fixed by whoever is logged in */}
      <input className="m-2 text-black text-left" type="text" maxLength={128} placeholder="Revision author" />

      {/* Inline error when the backend rejects the submit (panel stays open to retry). */}
      {submitError && (
        <div data-testid="submit-error" className="text-red-500 text-sm text-left m-2">{submitError}</div>
      )}

      {/* Use "mt-auto" to auto grow the top margin until it fills the space.
    Source:
      https://stackoverflow.com/questions/31000885/align-an-element-to-bottom-with-flexbox
  */}
      <div className="flex justify-end gap-2 mt-auto m-2">
        <button
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onCancelClick}
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          data-testid="submit-event-button"
          className={`font-bold py-2 px-4 rounded text-white ${hasChanges && !hasDateErrors && !hasRegionError && !submitting ? "bg-gray-500 hover:bg-gray-700" : "bg-gray-700 opacity-50 cursor-not-allowed"}`}
          onClick={onSubmitClick}
          disabled={!hasChanges || hasDateErrors || hasRegionError || submitting}
        >
          Submit
        </button>
      </div>

      {/* Pending overlay: scrim + orbiting comet while the backend Create is in flight. */}
      {submitting && (
        <div
          data-testid="submit-overlay"
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-gray-500/60"
        >
          <div className="relative w-12 h-12 animate-spin">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_2px_rgba(255,255,255,0.8)]" />
          </div>
          <span className="text-white font-medium">Submitting...</span>
        </div>
      )}
    </div>
  )
}