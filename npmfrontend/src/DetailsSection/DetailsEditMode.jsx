import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { EditHeader } from "./EditHeader"
import { EditImage } from "./EditImage";
import { EditRegion } from "./EditRegion";

// TODO: move the latlong display into its own object
// TODO: move the image handling + display into its own object

export function DetailsEdit() {
  const editState = useSelector((state) => state.editPoiReducer)
  const reduxDispatch = useDispatch()

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

  return (
    <div className="flex flex-col h-full">
      <EditHeader />
      <EditImage />
      <EditRegion />

      {/* Revision author fixed by whoever is logged in */}
      <input className="m-2 text-black text-left" type="text" maxLength={128} placeholder="Revision author" />

      {/* Use "mt-auto" to auto grow the top margin until it fills the space. 
        Source:
          https://stackoverflow.com/questions/31000885/align-an-element-to-bottom-with-flexbox
      */}
      <div className="items-end flex mt-auto h-full">
        <button className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded " onClick={(e) => onSubmitClick(e)}>
          Submit
        </button>
      </div>
    </div>
  )
}
