import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { roundFloat } from "../RoundFloat";
import axios from "axios";
import { EditHeader } from "./EditHeader"
import { EditImage } from "./EditImage";


//TODO: change to "RegionDetailsEditMode" + "RegionDetails"

export function ShowRegion() {
  const selectedPoiState = useSelector((state) => state.selectedPoiReducer)

  const [latLongReactElements, setLatLongReactElements] = useState()
  const htmlClassPrimaryPin = "w-full text-red-400 text-left border-2 border-gray-400 rounded-md mb-1"
  const htmlClassBoundaryPin = "w-full text-yellow-300 text-left border-2 border-gray-400 rounded-md mb-1"

  // Display pin locations.
  useEffect(() => {
    // console.log({ msg: "EditRegion()/useEffect()/pin position changed", primaryPin: selectedPoiState.primaryPin, regionBoundaries: selectedPoiState.regionBoundaries })
    if (!selectedPoiState.primaryPin || !selectedPoiState.regionBoundaries) {
      // Wait for both to load (or just do nothing if they were set to null/empty)
      return
    }

    // TODO: rename pinArr -> locationArr
    // TODO: rename primaryPin -> primaryLocation

    // Gather all pin locations together
    let pinArr = []
    if (selectedPoiState.primaryPin) {
      pinArr.push(selectedPoiState.primaryPin)
      for (let i = 0; i < selectedPoiState.regionBoundaries.length; i++) {
        pinArr.push(selectedPoiState.regionBoundaries[i])
      }
    }

    // And make HTML elements out of them
    let htmlElements = pinArr.map((pin) => {
      let roundedLat = roundFloat(pin.lat, 4)
      let roundedLong = roundFloat(pin.long, 4)
      // console.log({ lat: roundedLat, long: roundedLong })

      if (pin.id == selectedPoiState.primaryPin.id) {
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
  }, [selectedPoiState.primaryPin, selectedPoiState.regionBoundaries])

  return (
    <div className="flex flex-col items-start border-2 border-gray-600 m-1 h-1/4 overflow-auto">
      {latLongReactElements}
    </div>
  )
}
