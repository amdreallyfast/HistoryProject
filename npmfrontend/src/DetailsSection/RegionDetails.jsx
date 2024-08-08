import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { roundFloat } from "../RoundFloat";

export function RegionDetails() {
  const selectedPoiState = useSelector((state) => state.selectedPoiReducer)

  const [latLongReactElements, setLatLongReactElements] = useState()
  const htmlClass = {
    PrimaryLoc: "w-full text-red-400 text-left border-2 border-gray-400 rounded-md mb-1",
    RegionBoundary: "w-full text-yellow-300 text-left border-2 border-gray-400 rounded-md mb-1",
  }

  // Display pin locations.
  useEffect(() => {
    console.log({ "RegionDetails useEffect: positions changed": { primaryLoc: selectedPoiState.primaryLoc, regionBoundaries: selectedPoiState.regionBoundaries } })
    if (!selectedPoiState.primaryLoc || !selectedPoiState.regionBoundaries) {
      // Wait for both to load (or just do nothing if they were set to null/empty)
      return
    }

    // Gather all pin locations together
    let locArr = []
    if (selectedPoiState.primaryLoc) {
      locArr.push(selectedPoiState.primaryLoc)
      for (let i = 0; i < selectedPoiState.regionBoundaries.length; i++) {
        locArr.push(selectedPoiState.regionBoundaries[i])
      }
    }

    // And make HTML elements out of them
    let htmlElements = locArr.map((location) => {
      let roundedLat = roundFloat(location.lat, 4)
      let roundedLong = roundFloat(location.long, 4)
      // console.log({ lat: roundedLat, long: roundedLong })

      if (location.id == selectedPoiState.primaryLoc.id) {
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
  }, [selectedPoiState.primaryLoc, selectedPoiState.regionBoundaries])

  return (
    <div className="flex flex-col items-start border-2 border-gray-600 m-1 h-1/4 overflow-auto">
      {latLongReactElements}
    </div>
  )
}
