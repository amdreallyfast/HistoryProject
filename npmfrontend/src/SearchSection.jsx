import { useRef, useState } from "react"
import { v4 as uuidv4 } from "uuid"

export function SearchSection({ displayItemsJson, searchResultsCallback, itemSelectedCallback, currSelectedUniqueId }) {
  const [searchErrorHtml, setSearchErrorHtml] = useState()
  const searchTextRef = useRef()

  const searchFunc = async ({ searchText, lowerBoundYear, lowerBoundMon, lowerBoundDay, upperBoundYear, upperBoundMon, upperBoundDay }) => {
    try {
      let rawJson = null

      // TODO: when using a "perspectives" dataset, search by other fields like time
      if (searchText) {
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

      searchResultsCallback(sortedJson)
      setSearchErrorHtml(null)
    } catch (error) {
      let errorAsHtml = (
        // TODO: format error better (left-justify somehow; long, strings always word-wrap and center for some reason)
        <p className="font-bold text-red-500 align-">
          {error.stack}
        </p>
      )
      setSearchErrorHtml(errorAsHtml)
    }
  }

  const searchAndDisplay = async () => {
    console.log({ searchAndDisplay: `searching for '${searchTextRef.current}'` })
    searchFunc({ searchText: searchTextRef.current })
  }

  const onSearchClicked = (e) => {
    console.log({ onSearchClicked: e })
    searchAndDisplay()
    // TODO: perform search, set results
  }

  const onSearchTextChanged = (e) => {
    // TODO: auto-complete
    console.log({ onSearchTextChanged: e.target.value })
    searchTextRef.current = e.target.value

    // TODO: if input is return, search instantly
  }

  const onSearchTextKeyUp = (e) => {
    console.log({ onSearchTextKeyup: e.key })
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

  let displayItemsAsHtml = displayItemsJson?.map((jsonValue) => {
    let isCurrSelected = jsonValue.myUniqueId === currSelectedUniqueId
    let className = `text-white${isCurrSelected ? " font-bold" : ""}`
    let html = (
      <p key={jsonValue.myUniqueId}
        className={className}
        onClick={(e) => itemSelectedCallback(jsonValue)}
      >
        {jsonValue.name.official}
      </p>
    )

    return html
  })

  return (
    <div className="flex flex-col h-full border-2 border-green-500">
      <div className="flex flex-col border-2 border-gray-600">
        <div className="flex flex-col items-start m-1">
          <span >Search:</span>
          <span >(titles, descriptions, sources, tags)</span>
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
        {searchErrorHtml ? searchErrorHtml : displayItemsAsHtml}
      </div>
    </div>
  )
}

