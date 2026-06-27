import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { editEventStateActions } from "../../AppState/stateSliceEditEvent";
import { dataUrlToImageBinary, validateImageBase64 } from "../../api/imageDataUrl";

export function EditEventImage() {
  const editState = useSelector((state) => state.editEventReducer)
  const reduxDispatch = useDispatch()
  const [uploadError, setUploadError] = useState(null)

  const imageUpload = (e) => {
    // console.log({ "read image file": e })
    if (!e?.target?.files || e.target.files.length == 0) {
      throw Error("Function 'imageUpload' called without target files. Check that you called it _after_ the user selected a file to upload.")
    }

    let file = e.target.files[0]  // Only loading 1 file.
    const reader = new FileReader()
    reader.onload = () => {
      // Validate the actual bytes (magic-byte signature + size), not the client-side
      // "accept" filter or the file extension — both are trivially spoofable.
      const base64 = dataUrlToImageBinary(reader.result)
      const result = validateImageBase64(base64)
      if (!result.ok) {
        setUploadError(result.reason)
        return
      }

      setUploadError(null)
      let payload = {
        filename: file.name,
        dataUrl: reader.result
      }
      reduxDispatch(editEventStateActions.setImageDataUrl(payload))
    }

    reader.readAsDataURL(file)
  }

  return (
    <div className="m-1 p-2 rounded-md border-2 border-gray-600">
      {editState.imageDataUrl ?
        <img data-testid="edit-image-preview" style={{ "maxWidth": "100%", "maxHeight": "200px", display: "block", margin: "auto" }} src={editState.imageDataUrl} alt="ERROR: Bad dataUrl." />
        :
        <span>No image</span>
      }
      <div className="items-start flex mt-auto">
        {/* To load multiple, add the "multiple" field. */}
        <input data-testid="image-upload-input" className="m-2" type="file" onInput={(e) => imageUpload(e)} accept="image/png, image/jpeg" />
      </div>
      {uploadError &&
        <div data-testid="image-upload-error" className="m-2 text-red-400 text-sm">{uploadError}</div>
      }
    </div>
  )
}
