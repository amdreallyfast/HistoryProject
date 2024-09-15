import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { roundFloat } from "../RoundFloat";

export function ShowRegionDetails() {
  const selectedPoiState = useSelector((state) => state.selectedPoiReducer)

  const [latLongReactElements, setLatLongReactElements] = useState()
  const htmlClass = {
    PrimaryLoc: "w-full text-red-400 text-left border-2 border-gray-400 rounded-md mb-1",
    RegionBoundary: "w-full text-yellow-300 text-left border-2 border-gray-400 rounded-md mb-1",
  }

  const createLatLongReactElements = () => {
    // Gather all pin locations together
    let locArr = []
    locArr.push(selectedPoiState.primaryLoc)
    for (let i = 0; i < selectedPoiState.regionBoundaries.length; i++) {
      locArr.push(selectedPoiState.regionBoundaries[i])
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
  }

  // Re-create HTML to list locations
  useEffect(() => {
    console.log({ "ShowRegionDetails.useEffect[selectedPoiState.primaryLoc]": selectedPoiState.primaryLoc })
    createLatLongReactElements()
  }, [selectedPoiState.primaryLoc])

  // Re-create HTML to list locations
  useEffect(() => {
    console.log({ "ShowRegionDetails.useEffect[selectedPoiState.regionBoundaries]": selectedPoiState.regionBoundaries })
    createLatLongReactElements()
  }, [selectedPoiState.regionBoundaries])

  return (
    <div className="flex flex-col items-start border-2 border-gray-600 m-1 h-1/4 overflow-auto">
      {latLongReactElements}
    </div>
  )
}
