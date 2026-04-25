import { useState, useEffect, useRef } from "react"
import { useSelector, useDispatch } from "react-redux"
import { eventStateActions } from "../AppState/stateSliceEvent"
import { selectedEventStateActions } from "../AppState/stateSliceSelectedEvent"
import { getLatestRevisions } from "../AppState/getLatestRevisions"
import { editEventStateActions } from "../AppState/stateSliceEditEvent"
import { mouseStateActions } from "../AppState/stateSliceMouseInfo"
import { createSpherePointFromLatLong } from "../GlobeSection/createSpherePoint"
import { globeInfo } from "../GlobeSection/constValues"
import { getFirst100 } from "../api/historyEventApi"
import { backendToFrontend } from "../api/eventMapper"

function ParseDateTimeStr(str) {
  let dateTimePair = str.split("T")
  let dateArr = dateTimePair[0].split("-")
  let timeArr = dateTimePair[1].split(":")
  return {
    year: dateArr[0],
    month: dateArr[1],
    day: dateArr[2],
    hour: timeArr[0],
    min: timeArr[1]
  }
}

export function SearchSectionMain() {
  const [searchText, setSearchText] = useState()
  const [lowerBoundYear, setLowerBoundYear] = useState()
  const [lowerBoundMon, setLowerBoundMon] = useState()
  const [lowerBoundDay, setLowerBoundDay] = useState()
  const [upperBoundYear, setUpperBoundYear] = useState()
  const [upperBoundMon, setUpperBoundMon] = useState()
  const [upperBoundDay, setUpperBoundDay] = useState()
  const [searchError, setSearchError] = useState(null)
  const searchResultHtmlClassNameNormal = "w-full text-white text-left border-2 border-gray-400 rounded-md mb-1"
  const searchResultHtmlClassNameHighlighted = "w-full text-white text-left border-2 border-gray-400 rounded-md mb-1 font-bold"

  const selectedEvent = useSelector((state) => state.eventReducer.selectedEvent)
  const allEvents = useSelector((state) => state.eventReducer.allEvents)
  const editModeOn = useSelector((state) => state.editEventReducer.editModeOn)
  const pendingGlobeEventSelection = useSelector((state) => state.mouseInfoReducer.pendingGlobeEventSelection)
  const reduxDispatch = useDispatch()

  const onEventClicked = (eventId) => {
    // Guard: if in edit mode, confirm before switching
    if (editModeOn) {
      let confirmed = window.confirm("You have unsaved changes. Discard and load the new event?")
      if (!confirmed) return
      reduxDispatch(editEventStateActions.endEditMode())
    }

    // If already selected, de-select.
    if (selectedEvent?.eventId === eventId) {
      reduxDispatch(eventStateActions.setSelectedEvent(null))
      reduxDispatch(selectedEventStateActions.clear())
      return
    }

    // Look up the latest revision from current allEvents
    let latestRevisions = getLatestRevisions(allEvents)
    let eventJson = latestRevisions.find(ev => ev.eventId === eventId)
    if (!eventJson) return

    // Select this event
    reduxDispatch(eventStateActions.setSelectedEvent(eventJson))

    // Convert lat/long to sphere points for the globe
    let primarySpherePoint = createSpherePointFromLatLong(
      eventJson.primaryLoc.lat,
      eventJson.primaryLoc.long,
      globeInfo.radius
    )

    let regionSpherePoints = eventJson.regionBoundaries.map((boundary) =>
      createSpherePointFromLatLong(boundary.lat, boundary.long, globeInfo.radius)
    )

    // Dispatch to selected event state (populates display components)
    reduxDispatch(selectedEventStateActions.load({
      eventId: eventJson.eventId,
      title: eventJson.title,
      tags: eventJson.tags,
      eventIsCreationOfSource: eventJson.eventIsCreationOfSource,
      imageDataUrl: eventJson.imageDataUrl,
      summary: eventJson.summary,
      eventTime: eventJson.eventTime,
      sources: eventJson.sources,
      primaryLoc: primarySpherePoint,
      regionBoundaries: regionSpherePoints,
      revisionAuthor: eventJson.revisionAuthor || "",
    }))
  }

  const onSearchTextChanged = (e) => {
    setSearchText(e.target.value)
  }

  const onSearchTextKeyUp = (e) => {
    if (e.key == "Enter") {
      onSearchClicked()
    }
  }

  const onSearchLowerBoundDateChanged = (e) => {
    let parsedDateTime = ParseDateTimeStr(e.target.value)
    setLowerBoundYear(parsedDateTime.year)
    setLowerBoundMon(parsedDateTime.month)
    setLowerBoundDay(parsedDateTime.day)
  }

  const onSearchUpperBoundDateChanged = (e) => {
    let parsedDateTime = ParseDateTimeStr(e.target.value)
    setUpperBoundYear(parsedDateTime.year)
    setUpperBoundMon(parsedDateTime.month)
    setUpperBoundDay(parsedDateTime.day)
  }

  const onSearchClicked = async () => {
    setSearchError(null)

    try {
      const rawEvents = await getFirst100()
      const frontendEvents = rawEvents.map(backendToFrontend)
      reduxDispatch(eventStateActions.setAllEvents(frontendEvents))
    }
    catch (error) {
      console.error({ "SearchSectionMain.onSearchClicked": error.message })
      setSearchError(error.message)
    }
  }

  // Bridge globe clicks to event selection. MouseHandler sets pendingGlobeEventSelection
  // with just the eventId; this component owns the full selection logic (sphere point
  // conversion, selectedEventStateActions.load), so it handles it here.
  useEffect(() => {
    if (!pendingGlobeEventSelection) return
    reduxDispatch(mouseStateActions.setPendingGlobeEventSelection(null))
    onEventClicked(pendingGlobeEventSelection)
  }, [pendingGlobeEventSelection])

  // Track previous allEvents reference so the re-sync below only fires when
  // allEvents itself changed (new submit), not when selectedEvent changes (user
  // browsing revision history).
  const prevAllEventsRef = useRef(null)

  // When allEvents changes (after an edit submit), re-sync selectedEvent to latest revision.
  useEffect(() => {
    const allEventsChanged = prevAllEventsRef.current !== allEvents
    prevAllEventsRef.current = allEvents
    if (!allEventsChanged || !allEvents || !selectedEvent) return

    const latest = getLatestRevisions(allEvents).find(e => e.eventId === selectedEvent.eventId)
    if (!latest || latest.revision === selectedEvent.revision) return

    reduxDispatch(eventStateActions.setSelectedEvent(latest))
    const primarySpherePoint = latest.primaryLoc
      ? createSpherePointFromLatLong(latest.primaryLoc.lat, latest.primaryLoc.long, globeInfo.radius)
      : null
    const regionSpherePoints = latest.regionBoundaries.map(rb =>
      createSpherePointFromLatLong(rb.lat, rb.long, globeInfo.radius)
    )
    reduxDispatch(selectedEventStateActions.load({
      ...latest,
      primaryLoc: primarySpherePoint,
      regionBoundaries: regionSpherePoints,
    }))
  }, [allEvents, selectedEvent])

  const latestEvents = allEvents ? getLatestRevisions(allEvents) : null

  return (
    <div className="flex flex-col h-full border-2 border-green-500">
      {/* Search info */}
      <div className="flex flex-col border-2 border-gray-600">
        <div className="flex flex-col items-start m-1">
          <span>Search:</span>
          <span>(titles, descriptions, sources, tags)</span>
          <input type='text'
            className='w-full bg-gray-700'
            onChange={onSearchTextChanged}
            onKeyUp={onSearchTextKeyUp}></input>
        </div>

        <div className="flex flex-col items-start m-1">
          {/* TODO: set default value in the far past */}
          <span>Date: Lower bound</span>
          <input type='datetime-local'
            className='w-full bg-gray-700'
            onChange={onSearchLowerBoundDateChanged}></input>
        </div>

        <div className="flex flex-col items-start m-1">
          {/* TODO: set default value today */}
          <span>Date: Upper bound</span>
          <input type='datetime-local'
            className='w-full bg-gray-700'
            onChange={onSearchUpperBoundDateChanged}></input>
        </div>

        <div className="flex flex-col items-end m-1">
          <input type='button'
            className='p-1 text-white border-2 border-red-300'
            value={"Search"}
            onClick={onSearchClicked}></input>
        </div>
      </div>

      {/* Search results */}
      <div className='flex flex-col items-start border-2 border-gray-600 m-1 h-full overflow-auto'>
        {searchError && (
          <p className="font-bold text-red-500 text-left">
            Error loading events: {searchError}
          </p>
        )}
        {latestEvents && latestEvents.map((eventJson) => (
          <p
            key={eventJson.eventId}
            className={eventJson.eventId === selectedEvent?.eventId
              ? searchResultHtmlClassNameHighlighted
              : searchResultHtmlClassNameNormal}
            onClick={() => onEventClicked(eventJson.eventId)}
          >
            {eventJson.title}
          </p>
        ))}
      </div>
    </div>
  )
}
