import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { roundFloat } from "../RoundFloat"

export function DisplayEventRegion() {
  const selectedEventState = useSelector((state) => state.selectedEventReducer)

  const [latLongReactElements, setLatLongReactElements] = useState()
  const htmlClass = {
    PrimaryLoc: "w-full text-red-400 text-left border-2 border-gray-400 rounded-md mb-1",
    RegionBoundary: "w-full text-yellow-300 text-left border-2 border-gray-400 rounded-md mb-1",
  }

  const createLatLongReactElements = () => {
    if (!selectedEventState.primaryLoc) {
      setLatLongReactElements(null)
      return
    }

    // Gather all pin locations together
    let locArr = []
    locArr.push(selectedEventState.primaryLoc)
    for (let i = 0; i < selectedEventState.regionBoundaries.length; i++) {
      locArr.push(selectedEventState.regionBoundaries[i])
    }

    // And make HTML elements out of them
    let htmlElements = locArr.map((location) => {
      let roundedLat = roundFloat(location.lat, 4)
      let roundedLong = roundFloat(location.long, 4)
      // console.log({ lat: roundedLat, long: roundedLong })

      if (location.id == selectedEventState.primaryLoc.id) {
        return (
          <p id={location.id} key={location.id} className={htmlClass.PrimaryLoc}>
            {`${roundedLat}, ${roundedLong}`}
          </p>
        )
      }
      else {
        return (
          <p id={location.id} key={location.id} className={htmlClass.RegionBoundary}>
            {`${roundedLat}, ${roundedLong}`}
          </p>
        )
      }
    })

    // Notify this component to re-render with the new values.
    setLatLongReactElements(htmlElements)
  }

  // Re-create HTML to list locations
  useEffect(() => {
    console.log({ "ShowRegionDetails.useEffect[selectedEventState.primaryLoc]": selectedEventState.primaryLoc })
    createLatLongReactElements()
  }, [selectedEventState.primaryLoc])

  // Re-create HTML to list locations
  useEffect(() => {
    console.log({ "ShowRegionDetails.useEffect[selectedEventState.regionBoundaries]": selectedEventState.regionBoundaries })
    createLatLongReactElements()
  }, [selectedEventState.regionBoundaries])

  return (
    <div className="flex flex-col items-start border-2 border-gray-600 m-1 h-1/4 overflow-auto">
      {latLongReactElements}
    </div>
  )
}
