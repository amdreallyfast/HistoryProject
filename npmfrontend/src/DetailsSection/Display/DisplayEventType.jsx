import { useSelector } from "react-redux"

export function DisplayEventType() {
  const selectedEventState = useSelector((state) => state.selectedEventReducer)

  return (
    <div className="m-1">
      <span className="text-gray-400">Creation of a record: </span>
      <span className="text-white">{selectedEventState.eventIsCreationOfSource ? "Yes" : "No"}</span>
    </div>
  )
}
