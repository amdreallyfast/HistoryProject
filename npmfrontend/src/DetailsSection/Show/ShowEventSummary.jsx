import { useSelector } from "react-redux"

export function ShowEventSummary() {

  const selectedEventState = useSelector((state) => state.selectedEventReducer)

  return (
    <div className="flex flex-col">
      <label className="m-2 text-white">
        {selectedEventState.summary}
      </label>
    </div>
  )
}
