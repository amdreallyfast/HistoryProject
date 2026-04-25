import { useMemo } from "react"
import { useSelector, useDispatch } from "react-redux"
import { EditEventHeader } from "./EditEventHeader";
import { EditEventType } from "./EditEventType";
import { EditEventImage } from "./EditEventImage";
import { EditEventTime } from "./EditEventTime";
import { EditEventRegion } from "./EditEventRegion";
import { EditEventSummary } from "./EditEventSummary";
import { EditEventSources } from "./EditEventSources";
import { editEventStateActions } from "../../AppState/stateSliceEditEvent";
import { eventStateActions } from "../../AppState/stateSliceEvent";
import { createEvent } from "../../api/historyEventApi";
import { frontendToBackend } from "../../api/eventMapper";


export function EditEvent({ }) {
  const reduxDispatch = useDispatch()
  const editState = useSelector((state) => state.editEventReducer)
  const allEvents = useSelector((state) => state.eventReducer.allEvents)
  const editSources = useSelector((state) => state.editSources)

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

  const onSubmitClick = async (e) => {

    // Find max revision for this eventId
    let maxRevision = 0
    allEvents.forEach(ev => {
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

    // Append new revision to allEvents; SearchSectionMain useEffect handles re-syncing display
    reduxDispatch(eventStateActions.appendEvent(newEvent))

    // Exit edit mode
    reduxDispatch(editEventStateActions.endEditMode())

    // Persist to backend (non-blocking: UI is already updated via Redux above)
    try {
      await createEvent(frontendToBackend(newEvent))
    } catch (err) {
      console.error({ "EditEvent.onSubmitClick[create]": err.message })
    }
  }

  const onCancelClick = () => {
    reduxDispatch(editEventStateActions.endEditMode())
  }

  return (
    <div className="flex flex-col h-full">
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

      {/* Use "mt-auto" to auto grow the top margin until it fills the space. 
    Source:
      https://stackoverflow.com/questions/31000885/align-an-element-to-bottom-with-flexbox
  */}
      <div className="flex justify-end gap-2 mt-auto m-2">
        <button
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          onClick={onCancelClick}
        >
          Cancel
        </button>
        <button
          className={`font-bold py-2 px-4 rounded text-white ${hasChanges ? "bg-gray-500 hover:bg-gray-700" : "bg-gray-700 opacity-50 cursor-not-allowed"}`}
          onClick={(e) => onSubmitClick(e)}
          disabled={!hasChanges}
        >
          Submit
        </button>
      </div>
    </div>
  )
}