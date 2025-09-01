import { useSelector } from "react-redux"
import axios from "axios";
import { EditEventHeader } from "./EditEventHeader";
import { EditEventType } from "./EditEventType";
import { EditEventImage } from "./EditEventImage";
import { EditEventRegion } from "./EditEventRegion";
import { EditEventSummary } from "./EditEventSummary";
import { EditEventSources } from "./EditEventSources";


export function EditEvent({ }) {
  const editModeOn = useSelector((state) => state.editPoiReducer.editModeOn)

  const onSubmitClick = (e) => {
    console.log("onSubmitClick")
    // reduxDispatch(editStateActions.endEditMode())
    let data = {
      eventId: editState.eventId,
      imageDataUrl: editState.imageDataUrl
    }
    axios.post("https://localhost:7121/api/HistoricalEvent/Create2", data)
      .then((response) => {
        console.log({ response })
      })
      .catch((error) => {
        console.error({ msg: "oh no!", error })
      })
      .finally(() => {
        console.log("finally")
      })
  }

  // TODO: RevisionAuthor
  // TODO: Sources
  // TODO: Summary
  // TODO: "Edit" button in "show" mode"

  return (
    <div className="flex flex-col h-full">
      <EditEventHeader />
      <EditEventType />
      {/* <EditEventImage /> */}
      {/* <EditEventRegion /> */}
      {/* <EditEventSummary /> */}
      <div className="m-1">
        <EditEventSources />
      </div>

      {/* Revision author fixed by whoever is logged in */}
      <input className="m-2 text-black text-left" type="text" maxLength={128} placeholder="Revision author" />

      {/* Use "mt-auto" to auto grow the top margin until it fills the space. 
    Source:
      https://stackoverflow.com/questions/31000885/align-an-element-to-bottom-with-flexbox
  */}
      <div className="items-end flex m-2 h-full">
        <button className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded " onClick={(e) => onSubmitClick(e)}>
          Submit
        </button>
      </div>
    </div>
  )
}