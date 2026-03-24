import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { mouseStateActions } from "../../AppState/stateSliceMouseInfo"
import { roundFloat } from "../RoundFloat";

export function EditEventRegion() {
  const editState = useSelector((state) => state.editEventReducer)
  const mouseState = useSelector((state) => state.mouseInfoReducer)
  const reduxDispatch = useDispatch()

  const [error, setError] = useState(null)

  // Validation function
  const isComplete = (primaryLoc) => {
    if (!primaryLoc || primaryLoc.lat === undefined || primaryLoc.long === undefined) {
      setError("Missing required value: 'Primary location'")
      return false
    }
    if (primaryLoc.lat === null || primaryLoc.long === null) {
      setError("Primary location must have valid latitude and longitude")
      return false
    }
    setError(null)
    return true
  }

  // Determine border color based on validation state
  const getBorderClass = () => {
    if (error) {
      return "border-red-500 border-opacity-80 border-2"
    } else {
      return "border-green-600 border-opacity-80 border-2"
    }
  }

  const htmlClass = {
    PrimaryLoc: "w-full text-red-400 text-left border-2 border-gray-400 rounded-md mb-1 pl-2",
    PrimaryLocHighlighted: "w-full text-red-500 text-left border-2 border-gray-400 rounded-md mb-1 font-bold pl-2",
    RegionBoundary: "w-full text-yellow-300 text-left border-2 border-gray-400 rounded-md mb-1 pl-2",
    RegionBoundaryHighlighted: "w-full text-yellow-300 text-left border-2 border-gray-400 rounded-md mb-1 font-bold pl-2"
  }

  useEffect(() => {
    isComplete(editState.primaryLoc)
  }, [editState.primaryLoc])

  // Scroll to selected location when selection changes
  useEffect(() => {
    if (mouseState.selectedLocId) {
      let htmlElement = document.getElementById(mouseState.selectedLocId)
      if (htmlElement) {
        htmlElement.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }
  }, [mouseState.selectedLocId])

  const onLocationTextClicked = (loc) => {
    // If already selected, de-select.
    if (mouseState.selectedLocId === loc.id) {
      reduxDispatch(mouseStateActions.setSelectedLocId(null))
    }
    else {
      reduxDispatch(mouseStateActions.setSelectedLocId(loc.id))
    }
  }

  const buildLocationRows = () => {
    if (!editState.primaryLoc) return null

    let locArr = [editState.primaryLoc, ...editState.regionBoundaries]

    return locArr.map((location) => {
      let roundedLat = roundFloat(location.lat, 4)
      let roundedLong = roundFloat(location.long, 4)
      let isPrimary = location.id === editState.primaryLoc.id
      let isSelected = mouseState.selectedLocId === location.id

      let className = isPrimary
        ? (isSelected ? htmlClass.PrimaryLocHighlighted : htmlClass.PrimaryLoc)
        : (isSelected ? htmlClass.RegionBoundaryHighlighted : htmlClass.RegionBoundary)

      return (
        <p id={location.id} key={location.id} className={className} onClick={() => onLocationTextClicked(location)}>
          {`${roundedLat}, ${roundedLong}`}
        </p>
      )
    })
  }

  const locationRows = buildLocationRows()

  return (
    <div className={`flex flex-col m-1 rounded-md ${getBorderClass()}`}>
      {/* Header: title and note - always visible */}
      <div className="w-full">
        <h3 className="text-white font-medium w-full text-center">Where</h3>
        <span className="text-white text-sm text-left block mb-2 pl-1">Lat, long. Red == primary location.</span>
      </div>

      {/* Region items - renders only if there are items */}
      {locationRows && locationRows.length > 0 && (
        <div className="w-full">
          {locationRows}
        </div>
      )}

      {/* Error display - renders only if there's an error */}
      {error && (
        <label className="text-red-500 text-sm m-1 block text-left">{error}</label>
      )}
    </div>
  )
}
