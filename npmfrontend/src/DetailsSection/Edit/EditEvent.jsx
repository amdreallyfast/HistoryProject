import { useSelector, useDispatch } from "react-redux"
import { EditEventHeader } from "./EditEventHeader";
import { EditEventType } from "./EditEventType";
import { EditEventImage } from "./EditEventImage";
import { EditEventTime } from "./EditEventTime";
import { EditEventRegion } from "./EditEventRegion";
import { EditEventSummary } from "./EditEventSummary";
import { EditEventSources } from "./EditEventSources";
import { editEventStateActions } from "../../AppState/stateSliceEditEvent";


export function EditEvent({ }) {
  const reduxDispatch = useDispatch()

  const onSubmitClick = (e) => {
    console.log("onSubmitClick")
    // TODO: Step 4 will implement proper submit with revision tracking
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