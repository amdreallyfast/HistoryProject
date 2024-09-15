import { useEffect, useState } from "react"
import { useSelector } from "react-redux"

export function ShowHeaderDetails() {
  const selectedPoiState = useSelector((state) => state.selectedPoiReducer)
  const [tagReactElements, setTagReactElements] = useState()

  useEffect(() => {
    console.log({ "new tag react elements": selectedPoiState.tags })

    let newTagReactElements = selectedPoiState.tags?.map((t) => (
      <p className="m-1 border-2 border-gray-600" key={t}>{t}</p>
    ))
    setTagReactElements(newTagReactElements)
  }, [selectedPoiState.tags])

  return (
    <div className="flex flex-col h-full">
      {/* Title */}
      <label className="m-2 text-white text-2xl text-left">
        {selectedPoiState.title}
      </label>

      {/* Tags */}
      <div className="flex flex-row items-start border-2 border-gray-600 m-1 overflow-auto flex-wrap">
        {tagReactElements}
      </div>
    </div>
  )
}
