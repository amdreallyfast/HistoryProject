import { useEffect } from "react"
import { useRef, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { setAllPois, setSelectedPoi } from "./AppState/stateSlicePoi"
import { v4 as uuidv4 } from "uuid"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import _ from "lodash"

async function getSearchResults(url) {
  let response = await fetch(url)
  if (!response.ok) {
    throw Error(`${response.status} (${response.statusText}): '${response.url}'`)
  }
  return response.json()
}

export function SearchSection() {
  const [searchUri, setSearchUri] = useState()
  const allCurrentPois = useSelector((state) => state.poiReducer.allPois)
  const selectedPoi = useSelector((state) => state.poiReducer.selectedPoi)
  const prevSelectedPoi = useSelector((state) => state.poiReducer.prevSelectedPoi)
  const reduxDispatch = useDispatch()

  // Not strictly HTML.
  const [searchResultReactElements, setSearchResultsReactElements] = useState()
  const searchResultHtmlClassNameNormal = "w-full text-white text-left border-2 border-gray-400 rounded-md mb-1"
  const searchResultHtmlClassNameHighlighted = "w-full text-white text-left border-2 border-gray-400 rounded-md mb-1 font-bold"

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

  const forceResetSearchResults = () => {
    // Reset the query cache
    queryClient.resetQueries({ queryKey: ["getSearchResults"] })

    // Reset the POI collection.
    // Problem: If it is _not_ set to null, then clicking "search" when the searchQuery has not
    // changed will result in the same search results as are current, and therefore the search 
    // result comparison in the "getSearchResultsQuery"-dependent useEffect() will determine 
    // that there is no change, and therefore the UI will not update, giving no indication that
    //  anything was done. This appearance of unresponsiveness is bad. 
    // Solution: reset the search results and start again, because that's what the user wants.
    reduxDispatch(setAllPois(null))
  }

  // console.log({
  //   status: getSearchResultsQuery.status,
  //   fetching: getSearchResultsQuery.isFetching,
  //   error: getSearchResultsQuery.error,
  //   data: getSearchResultsQuery.data
  // })

  // If searchUri changes, then the query will run, but _only_ if it hasn't seen that result before. It's caching the result. ??work with caching? circumvent it??

  useEffect(() => {
    // console.log({ msg: "SearchSection()/useEffect()/getSearchResultsQuery.status", value: getSearchResultsQuery.status })

    if (!searchUri) {
      // Startup, no search results. The "useQuery" hook defaults to (for some reason) 
      // isLoading = true, but it is _not_ loading (and so I argue that it should be false), so 
      // ignore the query status and don't print anything.
    }
    else if (getSearchResultsQuery.isLoading) {
      // console.log("Loading...")
      setSearchResultsReactElements((<h1>Loading...</h1>))
    }
    else if (getSearchResultsQuery.isError) {
      // console.log("Error...")
      setSearchResultsReactElements((<pre>{JSON.stringify(getSearchResultsQuery.error)}</pre>))
    }
    else if (getSearchResultsQuery.isFetching) {
      // console.log("Refreshing...")
      // setSearchResultsReactElements((<h1>Refreshing...</h1>))

      // Ignore. Carry on.
    }
    else if (getSearchResultsQuery.isSuccess) {
      // console.log("Success...")
      let rawJson = getSearchResultsQuery.data
      let sortedJson = rawJson
        .sort((a, b) => a.name.official.localeCompare(b.name.official))
        .map((jsonValue) => {
          // Note 9/13/2023: It took me an hour to figure out, but apparently the fetch processing
          // adds an immutable "key" field. So make your own key field to store this uniqueId.
          jsonValue.myUniqueId = uuidv4()
          return jsonValue
        })

      // Figure out if the new data is actually a change.
      // Note: Data refreshes may or may not result in a change. Recursively compare the two 
      // arrays (except for the myUniqueId field, which I am creating) to see if anything changed.
      // If nothing changes, then don't bother re-creating everything and changing the POI.
      //TODO: ??how to handle the case that there is a change server-side? I don't want to stomp all over the user's current experience, but how do I handle this??
      let searchResultsChanged = !_.isEqualWith(allCurrentPois, sortedJson, (value1, value2, key) => {
        // Note: Returning "true" for a given JSON key without any other logic is effectively 
        // skipping it. 
        // Also Note: Returning undefined will cause the comparison to be handled by 
        // "isEqualWith(...)" itself, which will default to recursing through the object.
        return key === "myUniqueId" ? true : undefined
      })

      if (searchResultsChanged) {
        // Re-create the POIs.

        // Callback
        const onSearchResultClicked = (e, poiJson) => {
          // If already selected, de-select.
          if (e.target.className.includes("font-bold")) {
            reduxDispatch(setSelectedPoi(null))
          }
          else {
            reduxDispatch(setSelectedPoi(poiJson))
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
        reduxDispatch(setAllPois(sortedJson))
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

  }, [getSearchResultsQuery.isLoading,
  getSearchResultsQuery.isError,
  getSearchResultsQuery.isSuccess,
  getSearchResultsQuery.isFetching,
  getSearchResultsQuery.data])

  // selectedPoi changes => highlight
  useEffect(() => {
    // console.log({ msg: "SearchSection()/useEffect()/selectedPoi", value: selectedPoi })

    if (selectedPoi) {
      let selectedPoiHtml = document.getElementById(selectedPoi.myUniqueId)
      selectedPoiHtml.className = searchResultHtmlClassNameHighlighted
    }

    if (prevSelectedPoi) {
      let prevSelectedPoiHtml = document.getElementById(prevSelectedPoi.myUniqueId)
      prevSelectedPoiHtml.classList = searchResultHtmlClassNameNormal
    }
  }, [selectedPoi])

  const searchFunc = async ({ searchText, lowerBoundYear, lowerBoundMon, lowerBoundDay, upperBoundYear, upperBoundMon, upperBoundDay }) => {
    // Fetch all results.
    // const defaultQuery = "https://restcountries.com/v3.1/all"
    const defaultQuery = "./countryData.json"

    let searchUri = defaultQuery
    if (searchText) {
      searchUri = `https://restcountries.com/v3.1/name/${searchText}`
    }

    // console.log({ searchUri: searchUri })
    setSearchUri(searchUri)
    forceResetSearchResults()
  }

  const searchAndDisplay = async () => {
    // console.log({ searchAndDisplay: `searching for '${searchTextRef.current}'` })
    searchFunc({ searchText: searchTextRef.current })
  }

  const onSearchClicked = (e) => {
    // console.log({ onSearchClicked: e })
    searchAndDisplay()
    // TODO: perform search, set results
  }

  const onSearchTextChanged = (e) => {
    // TODO: auto-complete
    // console.log({ onSearchTextChanged: e.target.value })
    searchTextRef.current = e.target.value

    // TODO: if input is return, search instantly
  }

  const onSearchTextKeyUp = (e) => {
    // console.log({ onSearchTextKeyup: e.key })
    if (e.key == "Enter") {
      searchAndDisplay()
    }
  }

  const onSearchLowerBoundDateChanged = (e) => {
    // TODO: set default value in the far past
    console.log({ onSearchLowerBoundDateChanged: e.target.value })
    // TODO: set state value
  }

  const onSearchUpperBoundDateChanged = (e) => {
    // TODO: set default value today
    console.log({ onSearchUpperBoundDateChanged: e.target.value })
    // TODO: set state value
  }



  return (
    <div className="flex flex-col h-full border-2 border-green-500">
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
          <span>Date: Lower bound</span>
          <input type='datetime-local'
            className='w-full bg-gray-700'
            onChange={onSearchLowerBoundDateChanged}></input>
        </div>

        <div className="flex flex-col items-start m-1">
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

      <div className='flex flex-col items-start border-2 border-gray-600 m-1 h-full overflow-auto'>
        {searchResultReactElements}
      </div>
    </div>
  )
}

