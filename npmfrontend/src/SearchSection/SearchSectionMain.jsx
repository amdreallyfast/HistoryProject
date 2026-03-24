import { useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { eventStateActions } from "../AppState/stateSliceEvent"
import { selectedEventStateActions } from "../AppState/stateSliceSelectedEvent"
import { getLatestRevisions } from "../AppState/getLatestRevisions"
import { editEventStateActions } from "../AppState/stateSliceEditEvent"
import { createSpherePointFromLatLong } from "../GlobeSection/createSpherePoint"
import { globeInfo } from "../GlobeSection/constValues"

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

async function fetchEvents(url) {
  let response = await fetch(url)
  if (!response.ok) {
    throw Error(`${response.status} (${response.statusText}): '${response.url}'`)
  }
  return response.json()
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
    console.log("Search: loading events.json...")
    setSearchError(null)

    try {
      let eventsJson = await fetchEvents(import.meta.env.BASE_URL + "events.json")
      reduxDispatch(eventStateActions.setAllEvents(eventsJson))
    }
    catch (error) {
      console.error({ "Search error": error })
      setSearchError(error.message)
    }
  }

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
