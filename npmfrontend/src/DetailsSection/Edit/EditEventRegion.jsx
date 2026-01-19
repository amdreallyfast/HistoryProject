import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { mouseStateActions } from "../../AppState/stateSliceMouseInfo"
import { roundFloat } from "../RoundFloat";

export function EditEventRegion() {
  const editState = useSelector((state) => state.editPoiReducer)
  const mouseState = useSelector((state) => state.mouseInfoReducer)
  const reduxDispatch = useDispatch()

  const [latLongReactElements, setLatLongReactElements] = useState()
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

  const createLatLongReactElements = () => {
    // Callback
    const onLocationTextClicked = (e, loc) => {
      // If already selected, de-select.
      // Note: Using bold text as a proxy for "is selected".
      if (e.target.className.includes("font-bold")) {
        // de-select
        reduxDispatch(mouseStateActions.setSelectedLocId(null))
      }
      else {
        // select
        reduxDispatch(mouseStateActions.setSelectedLocId(loc.id))
      }
    }

    // Minimum need the primary location
    if (!editState.primaryLoc) {
      return
    }


    // TODO: ??onhover??


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
          <p id={location.id} key={location.id} className={htmlClass.PrimaryLoc} onClick={(e) => onLocationTextClicked(e, location)}>
            {`${roundedLat}, ${roundedLong}`}
          </p>
        )
      }
      else {
        return (
          <p id={location.id} key={location.id} className={htmlClass.RegionBoundary} onClick={(e) => onLocationTextClicked(e, location)}>
            {`${roundedLat}, ${roundedLong}`}
          </p>
        )
      }
    })

    // Notify this component to re-render with the new values.
    setLatLongReactElements(htmlElements)
  }

  // Update HTML elements if the primary location changes.
  useEffect(() => {
    console.log({ "EditEventRegion.useEffect[editState.primaryLoc]": editState.primaryLoc })

    createLatLongReactElements()
    isComplete(editState.primaryLoc)
    // if (!latLongReactElements && !editState.primaryLoc) {
    //   // null on first load; skip
    // }
    // else {
    // }
  }, [editState.primaryLoc])

  // Update HTML elements if the region boundaries change.
  // Note: This array object should be changed as a whole (as opposed to updating individual 
  // objects within it) whenever a single region boundary pin changes, so this should be able to react to any changes to any of them.
  useEffect(() => {
    console.log({ "EditEventRegion.useEffect[editState.regionBoundaries]": editState.regionBoundaries })
    // if (!latLongReactElements && !editState.regionBoundaries) {
    //   // null on first load; skip
    // }

    createLatLongReactElements()
  }, [editState.regionBoundaries])



  // If selected pin changes, change highlighted latlong text block.
  useEffect(() => {
    // console.log({ "EditEventRegion.useEffect[mouseState.selectedLocId]": edit })

    // Highlight selected.
    if (mouseState.selectedLocId) {
      let htmlElement = document.getElementById(mouseState.selectedLocId)
      if (mouseState.selectedLocId == editState.primaryLoc.id) {
        htmlElement.className = htmlClass.PrimaryLocHighlighted
      }
      else {
        htmlElement.className = htmlClass.RegionBoundaryHighlighted
      }

      // Scroll to selected
      htmlElement.scrollIntoView({ behavior: "smooth", block: "center" })
    }

    // De-highlight previous.
    if (mouseState.prevSelectedLocId) {
      if (mouseState.selectedLocId == mouseState.prevSelectedLocId) {
        // Same pin selected again. Leave highlighted.
      }
      else {
        let htmlElement = document.getElementById(mouseState.prevSelectedLocId)
        if (mouseState.prevSelectedLocId == editState.primaryLoc.id) {
          htmlElement.className = htmlClass.PrimaryLoc
        }
        else {
          htmlElement.className = htmlClass.RegionBoundary
        }
      }
    }
  }, [mouseState.selectedLocId])

  return (
    <div className={`flex flex-col m-1 rounded-md ${getBorderClass()}`}>
      {/* Header: title and note - always visible */}
      <div className="w-full">
        <h3 className="text-white font-medium w-full text-center">Where</h3>
        <span className="text-white text-sm text-left block mb-2 pl-1">Lat, long. Red == primary location.</span>
      </div>

      {/* Region items - renders only if there are items */}
      {latLongReactElements && latLongReactElements.length > 0 && (
        <div className="w-full">
          {latLongReactElements}
        </div>
      )}

      {/* Error display - renders only if there's an error */}
      {error && (
        <label className="text-red-500 text-sm m-1 block text-left">{error}</label>
      )}
    </div>
  )
}
