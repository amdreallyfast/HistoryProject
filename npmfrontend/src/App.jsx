import { useEffect, useRef, useState } from 'react'
import { SearchSection } from "./SearchSection"
import './App.css'
import { useThree } from '@react-three/fiber'

// TODO: consider using Flowbit instead of plain Tailwind
//  https://flowbite.com/docs/getting-started/introduction/


function GlobeSection({ displayItemsJson, itemSelectedCallback, currSelectedUniqueId }) {
  // const [selectedItem, setSelectedItem] = useState()
  // const threeJsStateModelRef = useRef()
  // threeJsStateModelRef.current = useThree((state) => state)
  const prevSelectedJsonRef = useRef()
  const prevSelectedHtmlElementRef = useRef()
  const globeItemsDivRef = useRef()
  const reactFiberNodeKeyRef = useRef()

  const prevSelectUniqueId = useRef()

  // const [displayItemsHtml, setDisplayItemsHtml] = useState()

  useEffect(() => {
    // After first render, if a "currently selected" item was passed in, find it and record it.
    console.log({ msg: "GlobeSection(): useEffect()", globeItemsDivRef: globeItemsDivRef.current })
    if (globeItemsDivRef.current) {
      // Ex: "__reactFiber$f3b01kuphko"
      // Note 9/13/2023: Extracted by trial and error. Feels brittle. Hopefully stable though.
      let reactFiberKey = (Object.entries(globeItemsDivRef.current))[0][0]
      reactFiberNodeKeyRef.current = reactFiberKey
    }

    // if (reactFiberNodeKeyRef.current && currSelectedUniqueId) {
    //   console.log({ "globeItemsDivRef.children": globeItemsDivRef.current.children })
    //   for (let index = 0; index < globeItemsDivRef.current.children.length; index++) {
    //     const htmlElement = globeItemsDivRef.current.children[index];
    //     const correspondingJson = displayItemsJson[index]

    //     // htmlElement.className.replace(" font-bold", "")

    //     let reactFiberNode = htmlElement[reactFiberNodeKeyRef.current]
    //     if (reactFiberNode.key === currSelectedUniqueId) {
    //       // console.log({ msg: "currently selected", key: reactFiberNode.key })
    //       // htmlElement.className += " font-bold"
    //       prevSelectedHtmlElementRef.current = htmlElement
    //       prevSelectedJsonRef.current = correspondingJson
    //     }

    //     // console.log({ thing: thing })
    //   }
    //   // globeItemsDivRef.current.children.forEach(htmlElement => {
    //   //   // htmlElement.className.replace(" font-bold", "")
    //   //   console.log({ msg: "htmlElement[fiberkey]", value: htmlElement[reactFiberKeyRef.current] })
    //   // })
    // }
  })

  // console.log({ msg: "GlobeSection()", displayItemsJson: displayItemsJson })
  // console.log({ msg: "GlobeSection()", currSelectedUniqueId: currSelectedUniqueId })
  // console.log({ msg: "GlobeSection()", set: prevSelectedHtmlElementRef.current })

  const onItemSelected = (htmlElement, json) => {
    // if (prevSelectedJsonRef.current) {
    //   // TODO: de-select item
    // }

    // // TODO: do the thing for the newly selected item
    // prevSelectedJsonRef.current = json

    // // TODO: Replace HTML stuff with proper globe stuff
    // // De-bold current item, make new selection bold.
    // // Note: If same item, this logic will cause no change.
    // if (prevSelectedHtmlElementRef.current) {
    //   // console.log({ msg: "GlobeSection(): onItemSelected()", prevSelectedHtmlElementRef: prevSelectedHtmlElementRef.current })

    //   let newClassName = prevSelectedHtmlElementRef.current.className.replace("font-bold", "")
    //   prevSelectedHtmlElementRef.current.className = newClassName
    // }

    // htmlElement.className += " font-bold"
    // prevSelectedHtmlElementRef.current = htmlElement

    itemSelectedCallback(json)
  }

  let displayItemsAsHtml = displayItemsJson?.map((jsonValue, index) => {
    let isCurrSelected = jsonValue.myUniqueId === currSelectedUniqueId
    let className = `text-white${isCurrSelected ? " font-bold" : ""}`
    let html = (
      <p key={jsonValue.myUniqueId}
        className={className}
        onClick={(e) => onItemSelected(e.target, jsonValue)}
      >
        {jsonValue.capital ? jsonValue.capital[0] : "<no capital>"}
      </p>
    )

    // if (isCurrSelected) {
    //   prevSelectedJsonRef.current = jsonValue
    //   prevSelectedHtmlElementRef.current = html
    // }
    return html
  })
  // let asHtml = displayItemsJson?.map((jsonValue) => {
  //   let html = (
  //     <p key={jsonValue.myUniqueId}
  //       className="break-words text-ellipsis"
  //       onClick={(e) => onItemSelected(e.target, jsonValue)}
  //     >
  //       {jsonValue.name.official}
  //     </p>
  //   )
  //   return html
  // })
  // if (asHtml) {
  //   prevSelectedHtmlElementRef.current = asHtml[0]
  // }

  // console.log({ msg: "GlobeSection()", prevSelectedJsonRef: prevSelectedJsonRef.current })
  // console.log({ msg: "GlobeSection()", prevSelectedHtmlElementRef: prevSelectedHtmlElementRef.current?.className })

  return (
    <div className='flex flex-col h-full'>
      <div ref={globeItemsDivRef} name='GlobeItems' className='flex flex-col h-full overflow-auto'>
        {displayItemsAsHtml}
      </div>
    </div>
  )
}

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
          <GlobeSection
            displayItemsJson={searchResultsJson}
            itemSelectedCallback={itemSelectedCallback}
            currSelectedUniqueId={selectedItemJson?.myUniqueId} />
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
