import { useEffect, useRef } from "react"
import { useThree } from '@react-three/fiber'

export function GlobeSection({ displayItemsJson, itemSelectedCallback, currSelectedUniqueId }) {
  // threeJsStateModelRef.current = useThree((state) => state)
  const globeItemsDivRef = useRef()
  const reactFiberNodeKeyRef = useRef()

  useEffect(() => {
    // After first render, if a "currently selected" item was passed in, find it and record it.
    console.log({ msg: "GlobeSection(): useEffect()", globeItemsDivRef: globeItemsDivRef.current })
    if (globeItemsDivRef.current) {
      // Ex: "__reactFiber$f3b01kuphko"
      // Note 9/13/2023: Extracted by trial and error. Feels brittle. Hopefully stable though.
      let reactFiberKey = (Object.entries(globeItemsDivRef.current))[0][0]
      reactFiberNodeKeyRef.current = reactFiberKey
    }
  })

  let displayItemsAsHtml = displayItemsJson?.map((jsonValue, index) => {
    let className = "text-white"
    if (jsonValue.myUniqueId === currSelectedUniqueId) {
      className = "text-white font-bold"
    }

    let html = (
      <p key={jsonValue.myUniqueId}
        className={className}
        onClick={(e) => itemSelectedCallback(jsonValue)}
      >
        {jsonValue.capital ? jsonValue.capital[0] : "<no capital>"}
      </p>
    )

    return html
  })

  return (
    <div className='flex flex-col h-full'>
      <div ref={globeItemsDivRef} name='GlobeItems' className='flex flex-col h-full overflow-auto'>
        {displayItemsAsHtml}
      </div>
    </div>
  )
}

