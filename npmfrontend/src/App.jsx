import { useEffect, useState } from 'react'
import { SearchSection } from "./SearchSection"
import './App.css'

// TODO: consider using Flowbit instead of plain Tailwind
//  https://flowbite.com/docs/getting-started/introduction/


function GlobeSection({ displayItemsJson, itemSelectedCallback }) {
  const [selectedItem, setSelectedItem] = useState()

  const onItemSelected = (e) => {
    setSelectedItem(item)
    itemSelectedCallback(item)
  }

  if (displayItemsJson) console.log(displayItemsJson[0])

  let asHtml = displayItemsJson?.map((json, index) => (
    <p key={index} className='text-white' onClick={(e) => itemSelectedCallback(json)}>
      {json.capital ? json.capital[0] : "no capital"}
    </p>
  ))

  return (
    <div>
      {asHtml}
    </div>
  )
}

function App() {
  const [searchResultsJson, setSearchResultsJson] = useState()
  /*
  TODO:
    Search -> fetch data -> 
      error: 
        error in search results
      ok: 
        display in search results
        display all on globe
        display all on timeline
    select search result ->
      highlight in globe
      highlight in timeline
      display in details
  */

  const successfulSearchCallback = (jsonResults) => {
    console.log({ msg: "App(): successfulSearchCallback()", value: jsonResults })
    setSearchResultsJson(jsonResults)
  }
  const itemSelectedCallback = (selectedJson) => {
    console.log({ msg: "App(): itemSelectedCallback()", value: selectedJson })
  }

  return (
    <>
      <div className='grid grid-rows-5 grid-cols-10 w-screen h-screen bg-black border-4 border-yellow-500'>
        <div className='row-span-4 col-span-2 border-2 border-red-500 text-white'>
          <SearchSection
            successfulSearchCallback={successfulSearchCallback}
            searchResultSelectedCallback={itemSelectedCallback} />
        </div>
        <div className='row-span-4 col-span-6 border-2 border-amber-500 text-white'>
          Globe
          <GlobeSection
            displayItemsJson={searchResultsJson}
            itemSelectedCallback={itemSelectedCallback} />
        </div>
        <div className='row-span-4 col-span-2 border-2 border-emerald-500 text-white'>
          Details
        </div>
        <div className='row-span-1 col-span-12 border-2 border-fuchsia-500 text-white'>
          Timeline
        </div>
      </div>
    </>
  )
}

export default App
