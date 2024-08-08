import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { editStateActions } from "../AppState/stateSliceEditPoi";
import { roundFloat } from "../RoundFloat";

export function RegionDetailsEditMode() {
  const editState = useSelector((state) => state.editPoiReducer)
  const reduxDispatch = useDispatch()

  const [latLongReactElements, setLatLongReactElements] = useState()
  const htmlClass = {
    PrimaryLoc: "w-full text-red-400 text-left border-2 border-gray-400 rounded-md mb-1",
    PrimaryLocHighlighted: "w-full text-red-500 text-left border-2 border-gray-400 rounded-md mb-1 font-bold",
    RegionBoundary: "w-full text-yellow-300 text-left border-2 border-gray-400 rounded-md mb-1",
    RegionBoundaryHighlighted: "w-full text-yellow-300 text-left border-2 border-gray-400 rounded-md mb-1 font-bold"
  }

  // Display pin locations.
  useEffect(() => {
    console.log({ "RegionDetailsEditMode useEffect: positions changed": { primaryLoc: editState.primaryLoc, regionBoundaries: editState.regionBoundaries } })
    if (!editState.primaryLoc || !editState.regionBoundaries) {
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

    // Gather all pin locations together
    let locArr = []
    locArr.push(editState.primaryLoc)
    for (let i = 0; i < editState.regionBoundaries.length; i++) {
      locArr.push(editState.regionBoundaries[i])
    }

    // And make HTML elements out of them
    let htmlElements = locArr.map((location) => {
      let roundedLat = roundFloat(location.lat, 4)
      let roundedLong = roundFloat(location.long, 4)
      // console.log({ lat: roundedLat, long: roundedLong })

      if (location.id == editState.primaryLoc.id) {
        return (
          <p id={location.id} key={location.id} className={htmlClass.PrimaryLoc} onClick={(e) => onPinLocationClicked(e, location)}>
            {`${roundedLat}, ${roundedLong}`}
          </p>
        )
      }
      else {
        return (
          <p id={location.id} key={location.id} className={htmlClass.RegionBoundary} onClick={(e) => onPinLocationClicked(e, location)}>
            {`${roundedLat}, ${roundedLong}`}
          </p>
        )
      }
    })

    // Notify this component to re-render with the new values.
    setLatLongReactElements(htmlElements)
  }, [editState.primaryLoc, editState.regionBoundaries])

  // If selected pin changes, change highlighted latlong text block.
  useEffect(() => {
    // console.log({ "EditRegion useEffect selectedPinId changes": edit })

    // ??how to scroll to the selected item??

    if (editState.selectedPinId) {
      let htmlElement = document.getElementById(editState.selectedPinId)
      if (editState.selectedPinId == editState.primaryLoc.id) {
        htmlElement.className = htmlClass.PrimaryLocHighlighted
      }
      else {
        htmlElement.className = htmlClass.RegionBoundaryHighlighted
      }
    }

    if (editState.selectedPinId == editState.prevSelectedPinId) {
      // Skip "previous pin" processing. The same pin was selected again.
    }
    else if (editState.prevSelectedPinId) {
      let htmlElement = document.getElementById(editState.prevSelectedPinId)
      if (editState.prevSelectedPinId == editState.primaryLoc.id) {
        htmlElement.className = htmlClass.PrimaryLoc
      }
      else {
        htmlElement.className = htmlClass.RegionBoundaryHighlighted
      }
    }
  }, [editState.selectedPinId])

  return (
    <div className="flex flex-col items-start border-2 border-gray-600 m-1 h-1/4 overflow-auto">
      {latLongReactElements}
    </div>
  )
}
