import { useSelector } from "react-redux"
import { ShowEventSource } from "./ShowEventSource"

export function ShowEventSources() {
  const selectedEventState = useSelector((state) => state.selectedEventReducer)

  if (!selectedEventState.sources || selectedEventState.sources.length === 0) {
    return (
      <div className="m-1">
        <span className="text-gray-400">Sources: </span>
        <span className="text-white">NA</span>
      </div>
    )
  }

  return (
    <div className="m-1">
      <span className="text-gray-400 text-xl">Sources</span>
      {selectedEventState.sources.map((source, index) => (
        <ShowEventSource key={index} source={source} />
      ))}
    </div>
  )
}
