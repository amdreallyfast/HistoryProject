import { useEffect, useRef, useState } from 'react'
import { SearchSectionMain } from './SearchSection/SearchSectionMain'
import { GlobeSectionMain } from "./GlobeSection/GlobeSectionMain"
import { DetailsSection } from "./DetailsSection"
import './App.css'

// TODO: consider using Flowbit instead of plain Tailwind
//  https://flowbite.com/docs/getting-started/introduction/

function App() {
  // const [searchResultsJson, setSearchResultsJson] = useState()
  const [selectedItemJson, setSelectedItemJson] = useState()
  // const selectedItemRef = useRef()

  // /*
  // TODO:
  //   Search -> fetch data -> 
  //     error: 
  //       error in search results
  //     ok: 
  //       display in search results
  //       display all on globe
  //       display all on timeline
  //   select search result ->
  //     highlight in globe
  //     highlight in timeline
  //     display in details
  // */

  // const searchResultsCallback = (jsonResults) => {
  //   // console.log({ msg: "App(): searchResultsCallback()", value: jsonResults })
  //   setSearchResultsJson(jsonResults)
  // }
  // const itemSelectedCallback = (selectedJson) => {
  //   console.log({ msg: "App(): itemSelectedCallback()", value: selectedJson?.name.common })
  //   setSelectedItemJson(selectedJson)
  //   selectedItemRef.current = selectedJson
  // }

  return (
    <>
      <div className='grid grid-rows-5 grid-cols-10 w-screen h-screen bg-black border-4 border-yellow-500'>
        <div className='row-span-4 col-span-2 border-2 border-red-500 text-white'>
          <SearchSectionMain />
        </div>
        <div className='row-span-4 col-span-6 border-2 border-amber-500 text-white'>
          {/* Globe */}
          <GlobeSectionMain />
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
