import { useDispatch, useSelector } from "react-redux";
import { editStateActions } from "../AppState/stateSliceEditPoi";

export function EditImageDetails() {
  const editState = useSelector((state) => state.editPoiReducer)
  const reduxDispatch = useDispatch()

  const imageUpload = (e) => {
    // console.log({ "read image file": e })
    if (!e?.target?.files || e.target.files.length == 0) {
      throw Error("Function 'imageUpload' called without target files. Check that you called it _after_ the user selected a file to upload.")
    }

    let file = e.target.files[0]  // Only loading 1 file.
    const reader = new FileReader()
    reader.onload = () => {
      let payload = {
        filename: file.name,
        dataUrl: reader.result
      }
      reduxDispatch(editStateActions.setImageDataUrl(payload))
    }

    reader.readAsDataURL(file)
  }

  return (
    <div>
      {editState.imageDataUrl ?
        <img style={{ "maxWidth": "100%", "maxHeight": "200px", display: "block", margin: "auto" }} src={editState.imageDataUrl} alt="ERROR: Bad dataUrl." />
        :
        <span>No image</span>
      }
      <div className="items-start flex mt-auto">
        {/* To load multiple, add the "multiple" field. */}
        <input className="m-2" type="file" onInput={(e) => imageUpload(e)} accept="image/png, image/jpeg" />
      </div>
    </div>
  )
}
