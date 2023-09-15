import { useEffect, useRef, useState } from 'react'
import { SearchSection } from "./SearchSection"
import { GlobeSectionMain } from "./GlobeSection/GlobeSectionMain"
import { DetailsSection } from "./DetailsSection"
import './App.css'

// TODO: consider using Flowbit instead of plain Tailwind
//  https://flowbite.com/docs/getting-started/introduction/



function App() {
  const [searchResultsJson, setSearchResultsJson] = useState()
  const [selectedItemJson, setSelectedItemJson] = useState()

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

  const searchResultsCallback = (jsonResults) => {
    console.log({ msg: "App(): searchResultsCallback()", value: jsonResults })
    setSearchResultsJson(jsonResults)
  }
  const itemSelectedCallback = (selectedJson) => {
    console.log({ msg: "App(): itemSelectedCallback()", value: selectedJson })
    setSelectedItemJson(selectedJson)
  }

  return (
    <>
      <div className='grid grid-rows-5 grid-cols-10 w-screen h-screen bg-black border-4 border-yellow-500'>
        <div className='row-span-4 col-span-2 border-2 border-red-500 text-white'>
          <SearchSection
            displayItemsJson={searchResultsJson}
            searchResultsCallback={searchResultsCallback}
            itemSelectedCallback={itemSelectedCallback}
            currSelectedUniqueId={selectedItemJson?.myUniqueId}
          />
        </div>
        <div className='row-span-4 col-span-6 border-2 border-amber-500 text-white'>
          {/* Globe */}
          <GlobeSectionMain
            displayItemsJson={searchResultsJson}
            itemSelectedCallback={itemSelectedCallback}
            currSelectedUniqueId={selectedItemJson?.myUniqueId} />
        </div>
        <div className='row-span-4 col-span-2 border-2 border-emerald-500 text-white'>
          <DetailsSection currSelectedItemJson={selectedItemJson} />
        </div>
        <div className='row-span-1 col-span-12 border-2 border-fuchsia-500 text-white'>
          Timeline
        </div>
      </div>
    </>
  )
}

export default App
