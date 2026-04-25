import { useSelector, useDispatch } from "react-redux"
import { DisplayEventHeader } from "./DisplayEventHeader"
import { DisplayEventType } from "./DisplayEventType"
import { DisplayEventImage } from "./DisplayEventImage"
import { DisplayEventTime } from "./DisplayEventTime"
import { DisplayEventRegion } from "./DisplayEventRegion"
import { DisplayEventSummary } from "./DisplayEventSummary"
import { DisplayEventSources } from "./DisplayEventSources"
import { RevisionStack } from "./RevisionStack"
import { editEventStateActions } from "../../AppState/stateSliceEditEvent"

export function DisplayEvent({ }) {
  const selectedEvent = useSelector((state) => state.selectedEventReducer)
  const reduxDispatch = useDispatch()

  const onEditClick = () => {
    reduxDispatch(editEventStateActions.loadEvent(selectedEvent))
  }

  return (
    <div className="flex flex-col h-full">
      <DisplayEventHeader />
      <DisplayEventType />
      <DisplayEventImage />
      <DisplayEventTime />
      <DisplayEventRegion />
      <DisplayEventSummary />
      <DisplayEventSources />
      <RevisionStack eventId={selectedEvent.eventId} />

      <div className="m-2 text-left text-sm text-gray-400">
        Last edited by: {selectedEvent.revisionAuthor || "unknown"}
      </div>

      <div className="flex justify-end mt-auto m-2">
        <button
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          onClick={onEditClick}
        >
          Edit
        </button>
      </div>
    </div>
  )
}
