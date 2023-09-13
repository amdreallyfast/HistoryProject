import { useState } from "react"


export function SearchSection({ successfulSearchCallback, searchResultSelectedCallback }) {
  const [searchText, setSearchText] = useState()
  const [searchResultsHtml, setSearchResultsHtml] = useState()
  const [searchErrorHtml, setSearchErrorHtml] = useState()

  const searchFunc = async ({ searchText, lowerBoundYear, lowerBoundMon, lowerBoundDay, upperBoundYear, upperBoundMon, upperBoundDay }) => {
    console.log({
      searchText: searchText
    })
    try {
      let json = null

      // TODO: when using a "perspectives" dataset, search by other fields like time
      if (searchText) {
        const response = await fetch(`https://restcountries.com/v3.1/name/${searchText}`)
        if (!response.ok) {
          // Note: For the country dataset, a 404 means "no results"
          throw Error(`${response.status} (${response.statusText}): '${response.url}'`)
        }
        json = await response.json()
      }
      else {
        const response = await fetch("https://restcountries.com/v3.1/all")
        if (!response.ok) {
          throw Error(`${response.status} (${response.statusText}): '${response.url}'`)
        }
        json = await response.json()
      }

      let sorted = json.sort((a, b) => a.name.official.localeCompare(b.name.official))
      let asHtml = sorted.map((value, index) => (
        <p key={index} className="break-words text-ellipsis" onClick={(e) => searchResultSelectedCallback(value)}>
          {value.name.official}
        </p>
      ))
      setSearchResultsHtml(asHtml)
      successfulSearchCallback(sorted)
      setSearchErrorHtml(null)
    } catch (error) {
      setSearchResultsHtml(null)

      let asHtml = (
        // TODO: format error better (left-justify somehow; long, strings always word-wrap and center for some reason)
        <p className="font-bold text-red-500 align-">
          {error.stack}
        </p>
      )
      setSearchErrorHtml(asHtml)
    }
  }

  const searchAndDisplay = async () => {
    console.log({ searchAndDisplay: `searching for '${searchText}'` })
    searchFunc({ searchText: searchText })
  }

  const onSearchClicked = (e) => {
    console.log({ onSearchClicked: e })
    searchAndDisplay()
    // TODO: perform search, set results
  }

  const onSearchTextChanged = (e) => {
    // TODO: auto-complete
    console.log({ onSearchTextChanged: e.target.value })
    setSearchText(e.target.value)

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

  return (
    <div className="h-full border-2 border-green-600">
      {/* Search */}
      <div className="h-auto flex flex-col border-2 border-gray-600 m-1">
        {/* Keyword */}
        <div className='flex flex-col items-start m-1'>
          <span >Search:</span>
          <span >(titles, descriptions, sources, tags)</span>
          <input type='text'
            className='w-full bg-gray-700'
            onChange={(e) => onSearchTextChanged(e)}
            onKeyUp={(e) => onSearchTextKeyUp(e)} ></input>
        </div>

        {/* Date: Lower bound */}
        {/* TODO: change to text boxes for year, month, day */}
        <div className='flex flex-col items-start m-1'>
          <span>Date: Lower bound</span>
          <input type='datetime-local' className='w-full bg-gray-700' onChange={(e) => onSearchLowerBoundDateChanged(e)}></input>
        </div>

        {/* Date: Upper bound */}
        {/* TODO: change to text boxes for year, month, day */}
        <div className='flex flex-col items-start m-1'>
          <span>Date: Upper bound</span>
          <input type='datetime-local' className='w-full bg-gray-700' onChange={(e) => onSearchUpperBoundDateChanged(e)}></input>
        </div>

        {/* Search button */}
        <div className='flex flex-row-reverse'>
          <input type='button' className='w-1/4 text-white border-2 border-red-300' value={"Search"} onClick={(e) => onSearchClicked(e)}></input>
        </div>
      </div>

      {/* Results */}
      <div className='flex flex-col items-start border-2 border-gray-600 m-1 overflow-auto'>
        {searchErrorHtml}
        {searchResultsHtml}
      </div>
    </div>
  )
}

