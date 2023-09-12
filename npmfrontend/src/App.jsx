import { useEffect, useState } from 'react'
import './App.css'

const fetchData = async (callbackFunc) => {
  const response = await fetch("https://restcountries.com/v3.1/all")
  console.log({ response: response })
  // TODO: handle error
  // TODO: show error in modal

  const json = await response.json()
  callbackFunc({
    error: null,
    json: json
  })
}

function SearchSection({ countryData }) {
  const [searchText, setSearchText] = useState()
  const [searchDateLowerBound, setSearchDateLowerBound] = useState()
  const [searchDateUpperBound, setSearchDateUpperBound] = useState()
  const [searchResults, setSearchResults] = useState()

  const searchAndDisplay = () => {
    console.log({ searchAndDisplay: `searching for '${searchText}' from '${searchDateLowerBound}' to '${searchDateUpperBound}'` })
    // TODO: fetch results from countries
    // TODO: set results and display

    const itemClick = (e) => {
      console.log({ itemClick: e })
    }
    let results = [{ title: "one" }, { title: "two" }, { title: "three" }]
    let htmlResults = results.map((value, index) => (
      <div key={index} onClick={(e) => itemClick(e)}>
        {value.title}
      </div>
    ))

    setSearchResults(htmlResults)
    console.log({ searchAndDisplay: htmlResults })
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
    <>
      {/* Search text */}
      <div className='flex flex-col items-start m-1'>
        <span >Search:</span>
        <span >(titles, descriptions, sources, tags)</span>

        {/* allow null */}
        <input type='text'
          className='w-full bg-gray-700'
          onChange={(e) => onSearchTextChanged(e)}
          onKeyUp={(e) => onSearchTextKeyUp(e)} ></input>
      </div>

      {/* Search dates (lower bounds) */}
      {/* TODO: change to text boxes for year, month, day */}
      <div className='flex flex-col items-start m-1'>
        <span>Lower bound</span>
        <input type='datetime-local' className='w-full bg-gray-700' onChange={(e) => onSearchLowerBoundDateChanged(e)}></input>
      </div>

      {/* Search dates (upper bounds) */}
      {/* TODO: change to text boxes for year, month, day */}
      <div className='flex flex-col items-start m-1'>
        <span>Upper bound</span>
        <input type='datetime-local' className='w-full bg-gray-700' onChange={(e) => onSearchUpperBoundDateChanged(e)}></input>
      </div>

      {/* Search button */}
      <div className='border-2 border-white'>
        <input type='button' className='text-white border-2 border-red-300' value={"Search"} onClick={(e) => onSearchClicked(e)}></input>
      </div>

      {/* Search results */}
      <div className='w-full flex flex-col items-start border-2 border-blue-600 m-1'>
        {searchResults}
      </div>
    </>
  )
}

function App() {
  const [countryData, setCountryData] = useState()
  useEffect(() => {
    console.log("App:useEffect()")

    let resultData = null
    let callback = (result) => {
      if (result.error == null) {
        setCountryData(result.json)
        console.log({ msg: "setting country data", data: result.json })
      }
      else {
        //??what to do about the bad??
        console.log("oh no the bad fetch!")
      }
    }
    // Initial data fetch
    fetchData(callback)
  }, [])

  return (
    <div className='grid grid-rows-5 grid-cols-10 w-screen h-screen bg-black border-4 border-yellow-500'>
      <div className='row-span-4 col-span-2 border-2 border-red-500 text-white'>
        <SearchSection countryData={countryData} />
      </div>
      <div className='row-span-4 col-span-6 border-2 border-amber-500 text-white'>
        Globe
      </div>
      <div className='row-span-4 col-span-2 border-2 border-emerald-500 text-white'>
        Details
      </div>
      <div className='row-span-1 col-span-12 border-2 border-fuchsia-500 text-white'>
        Timeline
      </div>
    </div>
  )
}

export default App
