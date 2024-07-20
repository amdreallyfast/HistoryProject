import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { editStateActions } from "../AppState/stateSliceEditPoi";
import { roundFloat } from "../RoundFloat";
import axios from "axios";

// TODO: move the latlong display into its own object
// TODO: move the image handling + display into its own object

export function DetailsEdit() {
  const editState = useSelector((state) => state.editPoiReducer)
  const selectedLatLong = useSelector((state) => state.editPoiReducer.selectedLatLong)
  const prevSelectedLatLong = useSelector((state) => state.editPoiReducer.prevSelectedLatLong)
  const reduxDispatch = useDispatch()

  const [latLongReactElements, setLatLongReactElements] = useState()
  const latLongHtmlClassNameNormal = "w-full text-white text-left border-2 border-gray-400 rounded-md mb-1"
  const latLongHtmlClassNameHighlighted = "w-full text-white text-left border-2 border-gray-400 rounded-md mb-1 font-bold"

  const [selectImageModelVisible, setSelectImageModelVisible] = useState(false)
  const [imageData, setImageDate] = useState()

  // Display pin locations.
  // TODO: Change so that the items are clearly labeled as "primaryPin", "regionPin0", "regionPin1", etc.
  useEffect(() => {
    // console.log({ msg: "DetailsEdit()/useEffect()/pin position changed", primaryPin: editState.primaryPin, regionBoundaries: editState.regionBoundaries })

    // Callback
    const onPinLocationClicked = (e, pin) => {
      // If already selected, de-select.
      // Note: Using bold text as a proxy for "is selected".
      if (e.target.className.includes("font-bold")) {
        reduxDispatch(editStateActions.setSelectedPin(null))
      }
      else {
        reduxDispatch(editStateActions.setSelectedPin(pin))
      }
    }

    // Gather all pin locations together
    let pinArr = []
    if (editState.primaryPin) {
      pinArr.push(editState.primaryPin)
      for (let i = 0; i < editState.regionBoundaries.length; i++) {
        pinArr.push(editState.regionBoundaries[i])
      }
    }

    // And make HTML elements out of them
    let htmlReactElements = pinArr.map((pin) => {
      let roundedLat = roundFloat(pin.lat, 4)
      let roundedLong = roundFloat(pin.long, 4)
      // console.log({ lat: roundedLat, long: roundedLong })

      // PARENTHESIS PARENTHESIS PARENTHESIS (not curly braces)
      return (
        <p id={pin.id}
          key={pin.id}
          className={latLongHtmlClassNameNormal}
          onClick={(e) => onPinLocationClicked(e, pin)}
        >
          {`${roundedLat}, ${roundedLong}`}
        </p>
      )
    })

    // Notify this component to re-render with the new values.
    setLatLongReactElements(htmlReactElements)
  }, [editState.primaryPin, editState.regionBoundaries])

  // If selected latLong changes, change highlight.
  useEffect(() => {
    // console.log({ "DetailsEdit_useEffect_selectedLatLongChanged": selectedLatLong })

    if (selectedLatLong) {
      let selectedHtmlElement = document.getElementById(selectedLatLong.id)
      selectedHtmlElement.className = latLongHtmlClassNameHighlighted
      // console.log({ selectedLatLong: selectedLatLong })
    }

    if (prevSelectedLatLong) {
      let prevSelectedHtmlElement = document.getElementById(prevSelectedLatLong.id)
      prevSelectedHtmlElement.className = latLongHtmlClassNameNormal
      // console.log({ prevSelectedLatLong: prevSelectedLatLong })
    }
  }, [selectedLatLong, prevSelectedLatLong])

  const onSubmitClick = (e) => {
    console.log("onSubmitClick")
    // reduxDispatch(editStateActions.endEditMode())
    let data = {
      poiId: editState.poiId,
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
      reduxDispatch(
        editStateActions.setImageDataUrl(payload)
      )
    }

    reader.readAsDataURL(file)
  }

  return (
    <div className="flex flex-col h-full">
      <span className="border-2 border-gray-600 bg-gray-400 m-1">
        Titleahdlfhlaskh
      </span>

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

      <div className="flex flex-col items-start border-2 border-gray-600 m-1 h-1/4 overflow-auto">
        {latLongReactElements}
      </div>

      {/* Use "mt-auto" to auto grow the top margin until it fills the space. 
        Source:
          https://stackoverflow.com/questions/31000885/align-an-element-to-bottom-with-flexbox
      */}
      <div className="items-start flex mt-auto ">
        <button
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded "
          onClick={(e) => onSubmitClick(e)}
        >
          Submit
        </button>
      </div>

    </div>
  )
}
