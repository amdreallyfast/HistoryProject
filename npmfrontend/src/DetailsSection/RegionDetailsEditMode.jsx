import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { editStateActions } from "../AppState/stateSliceEditPoi";
import { roundFloat } from "../RoundFloat";
import axios from "axios";
import { EditHeader } from "./EditHeader"
import { EditImage } from "./EditImage";


//TODO: change to "RegionDetailsEditMode" + "RegionDetails"

export function EditRegion() {
  const editState = useSelector((state) => state.editPoiReducer)
  const reduxDispatch = useDispatch()

  const [latLongReactElements, setLatLongReactElements] = useState()
  const htmlClassPrimaryPin = "w-full text-red-400 text-left border-2 border-gray-400 rounded-md mb-1"
  const htmlClassPrimaryPinHighlighted = "w-full text-red-500 text-left border-2 border-gray-400 rounded-md mb-1 font-bold"
  const htmlClassBoundaryPin = "w-full text-yellow-300 text-left border-2 border-gray-400 rounded-md mb-1"
  const htmlClassBoundaryPinHighlighted = "w-full text-yellow-300 text-left border-2 border-gray-400 rounded-md mb-1 font-bold"

  // Display pin locations.
  useEffect(() => {
    // console.log({ msg: "EditRegion()/useEffect()/pin position changed", primaryPin: editState.primaryPin, regionBoundaries: editState.regionBoundaries })
    if (!editState.primaryPin || !editState.regionBoundaries) {
      // Wait for both to load (or just do nothing if they were set to null/empty)
      return
    }

    // Callback
    const onPinLocationClicked = (e, pin) => {
      // If already selected, de-select.
      // Note: Using bold text as a proxy for "is selected".
      //??how to do with pin.id vs editState.selectedPinId??
      if (e.target.className.includes("font-bold")) {
        reduxDispatch(editStateActions.setSelectedPinId(null))
      }
      else {
        reduxDispatch(editStateActions.setSelectedPinId(pin.id))
      }
    }

    // TODO: rename pinArr -> locArr
    // TODO: rename primaryPin -> primaryLoc

    // Gather all pin locations together
    let pinArr = []
    pinArr.push(editState.primaryPin)
    for (let i = 0; i < editState.regionBoundaries.length; i++) {
      pinArr.push(editState.regionBoundaries[i])
    }

    // And make HTML elements out of them
    let htmlElements = pinArr.map((pin) => {
      let roundedLat = roundFloat(pin.lat, 4)
      let roundedLong = roundFloat(pin.long, 4)
      // console.log({ lat: roundedLat, long: roundedLong })

      if (pin.id == editState.primaryPin.id) {
        return (
          <p id={pin.id} key={pin.id} className={htmlClassPrimaryPin} onClick={(e) => onPinLocationClicked(e, pin)}>
            {`${roundedLat}, ${roundedLong}`}
          </p>
        )
      }
      else {
        return (
          <p id={pin.id} key={pin.id} className={htmlClassBoundaryPin} onClick={(e) => onPinLocationClicked(e, pin)}>
            {`${roundedLat}, ${roundedLong}`}
          </p>
        )
      }
    })

    // Notify this component to re-render with the new values.
    setLatLongReactElements(htmlElements)
  }, [editState.primaryPin, editState.regionBoundaries])

  // If selected pin changes, change highlighted latlong text block.
  useEffect(() => {
    // console.log({ "EditRegion useEffect selectedPinId changes": edit })

    // ??how to scroll to the selected item??

    if (editState.selectedPinId) {
      let htmlElement = document.getElementById(editState.selectedPinId)
      if (editState.selectedPinId == editState.primaryPin.id) {
        htmlElement.className = htmlClassPrimaryPinHighlighted
      }
      else {
        htmlElement.className = htmlClassBoundaryPinHighlighted
      }
    }

    if (editState.selectedPinId == editState.prevSelectedPinId) {
      // Skip "previous pin" processing. The same pin was selected again.
    }
    else if (editState.prevSelectedPinId) {
      let htmlElement = document.getElementById(editState.prevSelectedPinId)
      if (editState.prevSelectedPinId == editState.primaryPin.id) {
        htmlElement.className = htmlClassPrimaryPin
      }
      else {
        htmlElement.className = htmlClassBoundaryPin
      }
    }
  }, [editState.selectedPinId])

  return (
    <div className="flex flex-col items-start border-2 border-gray-600 m-1 h-1/4 overflow-auto">
      {latLongReactElements}
    </div>
  )
}
