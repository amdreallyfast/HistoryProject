import { useEffect, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { eventStateActions } from "../AppState/stateSliceEvent"
import { editEventStateActions } from "../AppState/stateSliceEditEvent"
import { editSourcesStateActions } from "../AppState/stateSliceEditSources"
import { selectedEventStateActions } from "../AppState/stateSliceSelectedEvent"
import { createSpherePointFromLatLong } from "../GlobeSection/createSpherePoint"
import { globeInfo } from "../GlobeSection/constValues"

async function fetchEvents(url) {
  let response = await fetch(url)
  if (!response.ok) {
    throw Error(`${response.status} (${response.statusText}): '${response.url}'`)
  }
  return response.json()
}

export function SearchSectionMain() {
  const [searchResultReactElements, setSearchResultsReactElements] = useState()
  const searchResultHtmlClassNameNormal = "w-full text-white text-left border-2 border-gray-400 rounded-md mb-1"
  const searchResultHtmlClassNameHighlighted = "w-full text-white text-left border-2 border-gray-400 rounded-md mb-1 font-bold"

  const selectedEvent = useSelector((state) => state.eventReducer.selectedEvent)
  const prevSelectedEvent = useSelector((state) => state.eventReducer.prevSelectedEvent)
  const reduxDispatch = useDispatch()

  // selectedEvent changes => highlight
  useEffect(() => {
    if (selectedEvent) {
      let selectedHtmlElement = document.getElementById(`event-${selectedEvent.eventId}`)
      if (selectedHtmlElement) {
        selectedHtmlElement.className = searchResultHtmlClassNameHighlighted
      }
    }

    if (prevSelectedEvent) {
      let prevSelectedHtmlElement = document.getElementById(`event-${prevSelectedEvent.eventId}`)
      if (prevSelectedHtmlElement) {
        prevSelectedHtmlElement.className = searchResultHtmlClassNameNormal
      }
    }
  }, [selectedEvent])

  const onEventClicked = (eventJson) => {
    // If already selected, de-select.
    if (selectedEvent?.eventId === eventJson.eventId) {
      reduxDispatch(eventStateActions.setSelectedEvent(null))
      return
    }

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

    // Dispatch to edit state (populates edit components)
    reduxDispatch(editEventStateActions.loadEvent({
      ...eventJson,
      primaryLoc: primarySpherePoint,
      regionBoundaries: regionSpherePoints,
    }))

    // Dispatch to sources state
    if (eventJson.sources) {
      reduxDispatch(editSourcesStateActions.loadSources(eventJson.sources))
    }

    // Dispatch to selected event state (populates show components)
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
      revisionAuthor: "",
    }))
  }

  const onSearchClicked = async () => {
    console.log("Search: loading events.json...")

    try {
      let eventsJson = await fetchEvents(import.meta.env.BASE_URL + "events.json")

      // Store all events
      reduxDispatch(eventStateActions.setAllEvents(eventsJson))

      // Build search result UI
      let htmlReactElements = eventsJson.map((eventJson) => (
        <p
          id={`event-${eventJson.eventId}`}
          key={eventJson.eventId}
          className={searchResultHtmlClassNameNormal}
          onClick={() => onEventClicked(eventJson)}
        >
          {eventJson.title}
        </p>
      ))

      setSearchResultsReactElements(htmlReactElements)
    }
    catch (error) {
      console.error({ "Search error": error })
      setSearchResultsReactElements(
        <p className="font-bold text-red-500 text-left">
          Error loading events: {error.message}
        </p>
      )
    }
  }

  return (
    <div className="flex flex-col h-full border-2 border-green-500">
      {/* Search info */}
      <div className="flex flex-col border-2 border-gray-600">
        <div className="flex flex-col items-end m-1">
          <input type='button'
            className='p-1 text-white border-2 border-red-300'
            value={"Search"}
            onClick={onSearchClicked}></input>
        </div>
      </div>

      {/* Search results */}
      <div className='flex flex-col items-start border-2 border-gray-600 m-1 h-full overflow-auto'>
        {searchResultReactElements}
      </div>
    </div>
  )
}
