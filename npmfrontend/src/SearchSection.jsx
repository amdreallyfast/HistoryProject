import { useEffect } from "react"
import { useRef, useState } from "react"
import { v4 as uuidv4 } from "uuid"
import { useSelector, useDispatch } from "react-redux"
import { setPointsOfInterest } from "./AppState/stateSlicePointsOfInterest"
import { setSelectedPoi } from "./AppState/StateSliceSelectedPoi"

export function SearchSection() {
  const pointsOfInterest = useSelector((state) => state.pointsOfInterestReducer.pointsOfInterest)
  const selectedPoi = useSelector((state) => state.selectedPoiReducer.selectedPoi)
  const prevSelectedPoi = useSelector((state) => state.selectedPoiReducer.prevSelectedPoi)
  const reduxDispatch = useDispatch()

  // Not strictly HTML.
  const [poiReactElements, setPoiReactElements] = useState()

  const prevSelectedPoiHtmlRef = useRef()
  const searchResultHtmlClassNameNormal = "w-full text-white text-left border-2 border-gray-400 rounded-md mb-1"
  const searchResultHtmlClassNameHighlighted = "w-full text-white text-left border-2 border-gray-400 rounded-md mb-1 font-bold"

  const [searchErrorHtml, setSearchErrorHtml] = useState()
  const searchTextRef = useRef()

  useEffect(() => {
    // Create interactable HTML elements out of the JSON objects.
    console.log({ msg: "SearchSection()/useEffect()/pointsOfInterest" })

    const onSearchResultClicked = (e, poiJson) => {
      // If already selected, de-select.
      if (e.target.className.includes("font-bold")) {
        reduxDispatch(setSelectedPoi(null))
      }
      else {
        reduxDispatch(setSelectedPoi(poiJson))
      }
    }

    setPoiReactElements(
      pointsOfInterest?.map(
        (poiJson) => (
          <p id={poiJson.myUniqueId} key={poiJson.myUniqueId}
            className={searchResultHtmlClassNameNormal}
            onClick={(e) => onSearchResultClicked(e, poiJson)}
          >
            {poiJson.name.official}
          </p>
        )
      )
    )

  }, [pointsOfInterest])

  useEffect(() => {
    console.log({ msg: "SearchSection()/useEffect()/selectedPoi" })
    // let thing = document.getElementsByName("pointsOfInterestSearchResults")
    // console.log({ selectedPoiId: selectedPoi?.myUniqueId })
    if (selectedPoi) {
      let selectedPoiHtml = document.getElementById(selectedPoi.myUniqueId)
      selectedPoiHtml.className = searchResultHtmlClassNameHighlighted
    }

    if (prevSelectedPoi) {
      let prevSelectedPoiHtml = document.getElementById(prevSelectedPoi.myUniqueId)
      prevSelectedPoiHtml.classList = searchResultHtmlClassNameNormal
    }

    // console.log(thing.className)
    // console.log(poiHtmlDiv.getElementsByName("children"))
    // console.log(document.getElementsByName("_reactFiber*"))

    // poiReactElements?.forEach((poiReactElement) => {
    //   // Highlight selected item
    //   if (poiReactElement.key == selectedPoi?.myUniqueId) {
    //     console.log(poiReactElement)
    //     poiReactElement.props.className = searchResultHtmlClassNameHighlighted
    //   }

    //   // De-highlight previous item
    //   if (poiReactElement.key == prevSelectedPoi?.myUniqueId) {
    //     poiReactElement.props.className = searchResultHtmlClassNameNormal
    //   }
    // })
  }, [selectedPoi])

  // useEffect(() => {
  //   // TODO: refector: "poiJsonValue" -> "poiJson"
  //   console.log({ msg: "SearchSection()/useEffect()/setPointsOfInterestHtml" })

  //   const onSearchResultClicked = (e, poiJson) => {
  //     // Always de-highlight the previous item.
  //     if (prevSelectedPoiHtmlRef.current) {
  //       prevSelectedPoiHtmlRef.current.className = searchResultHtmlClassNameNormal
  //     }

  //     // Note: This function will only store the values of any external variables used in it (that 
  //     // is, does _not_ store a reference). That means that I cannot rely on the "selectedPoi" state
  //     // variable in this event handler. This is stupid, but so be it. 
  //     // Also Note: A stand-in for "is selected" is the highlighted object's text being bold.
  //     if (e.target.className.includes("font-bold")) {
  //       // De-select. Already de-highlighted.
  //       console.log({ msg: "onSearchResultClicked() - de-select" })
  //       prevSelectedPoiHtmlRef.current = null
  //       reduxDispatch(setSelectedPoi(null))
  //     }
  //     else {
  //       // New selection. Highlight.
  //       console.log({ msg: "onSearchResultClicked() - new selection" })
  //       e.target.className = searchResultHtmlClassNameHighlighted
  //       prevSelectedPoiHtmlRef.current = e.target
  //       reduxDispatch(setSelectedPoi(poiJson))
  //     }
  //   }

  //   setPointsOfInterestHtml(
  //     pointsOfInterest?.map(
  //       (poiJson) => (
  //         <p key={poiJson.myUniqueId}
  //           className={searchResultHtmlClassNameNormal}
  //           onClick={(e) => onSearchResultClicked(e, poiJson)}
  //         >
  //           {poiJson.name.official}
  //         </p>
  //       )
  //     )
  //   )
  // }, [pointsOfInterest])

  const searchFunc = async ({ searchText, lowerBoundYear, lowerBoundMon, lowerBoundDay, upperBoundYear, upperBoundMon, upperBoundDay }) => {
    try {
      let rawJson = null

      // TODO: when using a "perspectives" dataset, search by other fields like time
      if (searchText) {
        // Reference:
        //  Fetch Data from API in React JS | Learn ReactJS
        //  https://www.youtube.com/watch?v=9vvtO0S1KlY
        let response = await fetch(`https://restcountries.com/v3.1/name/${searchText}`)
        if (!response.ok) {
          // Note: For the country dataset, a 404 means "no results"
          throw Error(`${response.status} (${response.statusText}): '${response.url}'`)
        }
        rawJson = await response.json()
      }
      else {
        let response = await fetch("https://restcountries.com/v3.1/all")
        if (!response.ok) {
          throw Error(`${response.status} (${response.statusText}): '${response.url}'`)
        }
        rawJson = await response.json()
      }

      let sortedJson = rawJson
        .sort((a, b) => a.name.official.localeCompare(b.name.official))
        .map((jsonValue) => {
          // Note 9/13/2023: It took me an hour to figure out, but apparently the fetch processing
          // adds an immutable "key" field. So make your own key field to store this uniqueId.
          jsonValue.myUniqueId = uuidv4()
          return jsonValue
        })

      reduxDispatch(setPointsOfInterest(sortedJson))
      setSearchErrorHtml(null)
    } catch (error) {
      let errorAsHtml = (
        <p className="font-bold text-red-500 text-left">
          {error.stack}
        </p>
      )
      setSearchErrorHtml(errorAsHtml)
    }
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
        <div>
          {searchErrorHtml}
        </div>
        <div name="pointsOfInterestSearchResults">
          {poiReactElements}
        </div>
      </div>
    </div>
  )
}

