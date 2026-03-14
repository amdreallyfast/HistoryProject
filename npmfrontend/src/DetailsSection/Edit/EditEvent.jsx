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
import { selectedEventStateActions } from "../../AppState/stateSliceSelectedEvent";
import { createSpherePointFromLatLong } from "../../GlobeSection/createSpherePoint";
import { globeInfo } from "../../GlobeSection/constValues";


export function EditEvent({ }) {
  const reduxDispatch = useDispatch()
  const editState = useSelector((state) => state.editEventReducer)
  const allEvents = useSelector((state) => state.eventReducer.allEvents)
  const editSources = useSelector((state) => state.editSources)

  const onSubmitClick = (e) => {
    console.log("onSubmitClick")

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

    // Append new revision to allEvents (preserves selection)
    reduxDispatch(eventStateActions.appendEvent(newEvent))

    // Build sphere points for selectedEvent (display + edit components need id/x/y/z)
    let primarySpherePoint = newEvent.primaryLoc
      ? createSpherePointFromLatLong(newEvent.primaryLoc.lat, newEvent.primaryLoc.long, globeInfo.radius)
      : null
    let regionSpherePoints = newEvent.regionBoundaries.map(rb =>
      createSpherePointFromLatLong(rb.lat, rb.long, globeInfo.radius)
    )

    let selectedEventData = {
      ...newEvent,
      primaryLoc: primarySpherePoint,
      regionBoundaries: regionSpherePoints,
    }

    // Load the new revision into display mode
    reduxDispatch(eventStateActions.setSelectedEvent(newEvent))
    reduxDispatch(selectedEventStateActions.load(selectedEventData))

    // Exit edit mode
    reduxDispatch(editEventStateActions.endEditMode())
  }

  const onCancelClick = () => {
    reduxDispatch(editEventStateActions.endEditMode())
  }

  // TODO: RevisionAuthor
  // TODO: Sources
  // TODO: Summary
  // TODO: "Edit" button in "show" mode"

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
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          onClick={(e) => onSubmitClick(e)}
        >
          Submit
        </button>
      </div>
    </div>
  )
}