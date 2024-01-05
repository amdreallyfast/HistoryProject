import { useEffect, useRef, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import _ from "lodash"
import { poiStateActions } from "../AppState/stateSlicePoi"
import { v4 as uuid } from "uuid"
import { damp } from "three/src/math/MathUtils"

async function getSearchResults(url) {
  let response = await fetch(url)
  if (!response.ok) {
    throw Error(`${response.status} (${response.statusText}): '${response.url}'`)
  }
  return response.json()
}

async function writeSearchResults(url, jsonData) {
  let response = await fetch(url, {
    method: "POST",
    body: JSON.stringify(jsonData, null, 4)
  })
  if (!response.ok) {
    throw Error(`${response.status} (${response.statusText}): '${response.url}'`)
  }
  return response.json()
}

function ParseDateTimeStr(str) {
  // Parse the datetime string manually.
  // Ex: "2023-11-17T15:44"
  // Note: Yes, the date selector outputs a single string. N, the JavaScript "Date" constructor can't parse it into a Date object.
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/Date
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
  // const [startNewSearch, setStartNewSearch] = useState(false)
  // const [runningSearch, setRunningSearch] = useState(false)
  const [searchUri, setSearchUri] = useState()

  // const [startWrite, setStartWrite] = useState(false)
  // const [runningWrite, setRunningWrite] = useState(false)
  const [writeUri, setWriteUri] = useState(import.meta.env.BASE_URL + "countryData.json")

  const [searchText, setSearchText] = useState()
  const [lowerBoundYear, setLowerBoundYear] = useState()
  const [lowerBoundMon, setLowerBoundMon] = useState()
  const [lowerBoundDay, setLowerBoundDay] = useState()
  const [upperBoundYear, setUpperBoundYear] = useState()
  const [upperBoundMon, setUpperBoundMon] = useState()
  const [upperBoundDay, setUpperBoundDay] = useState()

  // Not strictly HTML, but still a state.
  const [searchResultReactElements, setSearchResultsReactElements] = useState()
  const searchResultHtmlClassNameNormal = "w-full text-white text-left border-2 border-gray-400 rounded-md mb-1"
  const searchResultHtmlClassNameHighlighted = "w-full text-white text-left border-2 border-gray-400 rounded-md mb-1 font-bold"

  const allCurrentPois = useSelector((state) => state.poiReducer.allPois)
  const selectedPoi = useSelector((state) => state.poiReducer.selectedPoi)
  const prevSelectedPoi = useSelector((state) => state.poiReducer.prevSelectedPoi)
  const reduxDispatch = useDispatch()

  const searchTextRef = useRef()

  // Keep this around to reset the query cache and force a re-search.
  // Note: Without reset, the query will forever use the cached results. The cached 
  // results are useful when dealing with cached or sleeping browser tabs, but when the user 
  // clicks "Search", it _should_ perform the search again. In that case, we'll need to force a
  // re-search.
  const queryClient = useQueryClient()

  // Construct query hook as dependant on searchUri (that is, will re-run whenever it changes).
  const getSearchResultsQuery = useQuery({
    queryKey: ["getSearchResults", searchUri],
    queryFn: () => getSearchResults(searchUri),
    enabled: !!searchUri  // only run once searchUri is set
  })

  const writeSearchResultsQuery = useQuery({
    queryKey: ["writeSearchResults", writeUri, allCurrentPois],
    queryFn: () => writeSearchResults(writeUri, allCurrentPois),
    enabled: !!writeUri && !!allCurrentPois
  })

  useEffect(() => {
    if (writeSearchResultsQuery.isLoading) {
      console.log("Write loading...")
    }
    else if (writeSearchResultsQuery.isError) {
      console.log("Write error...")
    }
    else if (writeSearchResultsQuery.isFetching) {
      console.log("Write refreshing...")
    }
    else if (writeSearchResultsQuery.isSuccess) {
      console.log("Write success...")
    }
    else {
      console.log({ msg: "Unknown query status", error: writeSearchResultsQuery.status })
    }
  }, [
    writeSearchResultsQuery.isLoading,
    writeSearchResultsQuery.isError,
    writeSearchResultsQuery.isFetching,
    writeSearchResultsQuery.isSuccess,
    writeSearchResultsQuery.status
  ])

  // react to search
  useEffect(() => {
    // console.log({ msg: "SearchSection()/useEffect()/getSearchResultsQuery.status", value: getSearchResultsQuery.status })

    if (!searchUri) {
      // Ignore
      // Note: Per the docs, the status is "loading" if there's no cached data and no query 
      // attempt has been finished. Consequently, this means that "never tried searching at all" 
      // is indistinguishable from "started my first search, but haven't cached the results". If
      // we don't catch this, then the default test in the search area will be "Loading", even 
      // though it isn't loading anything.
    }
    else if (getSearchResultsQuery.isLoading) {
      console.log("Search loading...")
      setSearchResultsReactElements((<h1>Loading...</h1>))
    }
    else if (getSearchResultsQuery.isError) {
      console.log("Search error...")
      setSearchResultsReactElements((<pre>{JSON.stringify(getSearchResultsQuery.error)}</pre>))
    }
    else if (getSearchResultsQuery.isFetching) {
      console.log("Search refreshing...")
      // Ignore. Let it finish. Only update when there is success.
    }
    else if (getSearchResultsQuery.isSuccess) {
      console.log("Search success...")

      let rawJson = getSearchResultsQuery.data
      let sortedJson = rawJson
        .sort((a, b) => a.name.official.localeCompare(b.name.official))
        .map((jsonValue) => {
          // Note 9/13/2023: It took me an hour to figure out, but apparently the fetch processing
          // adds an immutable "key" field. So make your own key field to store this uniqueId.
          jsonValue.myUniqueId = uuid()
          return jsonValue
        })

      // Figure out if the new data is actually a change.
      // Note: Data refreshes may or may not result in a change. Recursively compare the two 
      // arrays (except for the myUniqueId field, which I am creating) to see if anything changed.
      // If nothing changes, then don't bother re-creating everything and changing the POI.
      //TODO: ??how to handle the case that there is a change server-side? I don't want to stomp all over the user's current experience, but how do I handle this??
      let searchResultsChanged = !_.isEqualWith(allCurrentPois, sortedJson, (value1, value2, key) => {
        // Note: Returning "true" for a given JSON key without any other logic is effectively 
        // skipping it. Skip "myUniqueId", which should never change.
        // Also Note: Returning undefined will cause the comparison to be handled by 
        // "isEqualWith(...)" itself, which will default to recursing through the object.
        return key === "myUniqueId" ? true : undefined
      })

      if (searchResultsChanged) {
        // Create/re-create the POIs.

        // Callback
        const onSearchResultClicked = (e, poiJson) => {
          // If already selected, de-select.
          // Note: Using bold text as a proxy for "is selected".
          if (e.target.className.includes("font-bold")) {
            reduxDispatch(poiStateActions.setSelectedPoi(null))
          }
          else {
            reduxDispatch(poiStateActions.setSelectedPoi(poiJson))
          }
        }

        // Construct HTML for the search results.
        let htmlReactElements = sortedJson?.map(
          (poiJson) => (
            <p
              id={poiJson.myUniqueId}
              key={poiJson.myUniqueId}
              className={searchResultHtmlClassNameNormal}
              onClick={(e) => onSearchResultClicked(e, poiJson)}
            >
              {poiJson.name.official}
            </p>
          )
        )

        // Notify this component to re-render with the new values.
        setSearchResultsReactElements(htmlReactElements)

        // Finally, notify the global state of the change in available POIs.
        reduxDispatch(poiStateActions.setAllPois(sortedJson))
      }
    }
    else {
      console.log({ msg: "Unknown query status", error: getSearchResultsQuery.status })
      setSearchResultsReactElements((
        <p className="font-bold text-red-500 text-left">
          Unknown query status: '{getSearchResultsQuery.status}'
        </p>
      ))
    }

  }, [
    searchUri,
    getSearchResultsQuery.isLoading,
    getSearchResultsQuery.isError,
    getSearchResultsQuery.isSuccess,
    getSearchResultsQuery.isFetching,
    getSearchResultsQuery.status
  ])

  // selectedPoi changes => highlight
  useEffect(() => {
    // console.log({ msg: "SearchSection()/useEffect()/selectedPoi", value: selectedPoi })

    if (selectedPoi) {
      let selectedHtmlElement = document.getElementById(selectedPoi.myUniqueId)
      selectedHtmlElement.className = searchResultHtmlClassNameHighlighted
    }

    if (prevSelectedPoi) {
      let prevSelectedHtmlElement = document.getElementById(prevSelectedPoi.myUniqueId)
      prevSelectedHtmlElement.className = searchResultHtmlClassNameNormal
    }
  }, [selectedPoi])

  const onSearchClicked = async (e) => {
    console.log({ searchAndDisplay: `searching for '${searchTextRef.current}'` })

    // Fetch all results.

    // TODO: ??incorporate these somehow??
    // lowerBoundYear
    // lowerBoundMon
    // lowerBoundDay
    // upperBoundYear
    // upperBoundMon
    // upperBoundDay

    const defaultQuery = "https://restcountries.com/v3.1/all"
    let searchUri = defaultQuery
    if (searchText) {
      searchUri = `https://restcountries.com/v3.1/name/${searchText}`
    }
    // searchUri = import.meta.env.BASE_URL + "countryData.json"
    // console.log({ searchUri: searchUri })

    console.log("Search starting...")
    setSearchUri(searchUri)
    // setRunningSearch(true)

    // Reset the query cache so that the next run of the query won't simply update the cache.
    queryClient.resetQueries({ queryKey: ["getSearchResults"] })

    // Reset the POI collection.
    // Problem: If it is _not_ set to null, then clicking "search" when the searchQuery has not
    // changed will result in the same search results as are current, and therefore the search 
    // result comparison in the "getSearchResultsQuery"-dependent useEffect() will determine 
    // that there is no change, and therefore the UI will not update, giving no indication that
    // anything was done. This appearance of unresponsiveness is bad. 
    // Solution: reset the search results and start again, because that's what the user wants.
    reduxDispatch(poiStateActions.setAllPois(null))
  }

  const onSearchTextChanged = (e) => {
    // console.log({ onSearchTextChanged: e.target.value })
    setSearchText(e.target.value)

    // TODO: auto-complete
  }

  const onSearchTextKeyUp = (e) => {
    // console.log({ onSearchTextKeyup: e.key })
    if (e.key == "Enter") {
      searchAndDisplay()
    }
  }

  const onSearchLowerBoundDateChanged = (e) => {
    // console.log({ onSearchLowerBoundDateChanged: e.target.value })
    let parsedDateTime = ParseDateTimeStr(e.target.value)
    setLowerBoundYear(parsedDateTime.year)
    setLowerBoundMon(parsedDateTime.month)
    setLowerBoundDay(parsedDateTime.day)
  }

  const onSearchUpperBoundDateChanged = (e) => {
    // console.log({ onSearchUpperBoundDateChanged: e.target.value })
    let parsedDateTime = ParseDateTimeStr(e.target.value)
    setUpperBoundYear(parsedDateTime.year)
    setUpperBoundMon(parsedDateTime.month)
    setUpperBoundDay(parsedDateTime.day)
  }

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
            value={"Search button"}
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

