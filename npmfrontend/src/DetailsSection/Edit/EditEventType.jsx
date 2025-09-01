import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { editStateActions } from "../../AppState/stateSliceEditPoi"

export function EditEventType() {
  const editState = useSelector((state) => state.editPoiReducer)
  const reduxDispatch = useDispatch()

  const [selectedEventType, setSelectedEventType] = useState("Everything else")

  // On start, load values from state
  useEffect(() => {
    console.log({ "EditEventType.useEffect[editState.eventType]": editState.eventType })

    if (editState.eventType === "RecordsCreated") {
      setSelectedEventType("Records created")
    } else {
      setSelectedEventType("Everything else")
    }
  }, [editState.eventType])

  // On selection change, set state
  const eventTypeChanged = (e) => {
    const selectedValue = e.target.value
    setSelectedEventType(selectedValue)
    
    const eventTypeValue = selectedValue === "Records created" ? "RecordsCreated" : "EverythingElse"
    reduxDispatch(editStateActions.setEventType({ eventType: eventTypeValue }))
  }

  return (
    <div className="flex flex-col">
      <label className="m-2 text-white font-medium">Event type</label>
      
      <div className="m-2 flex flex-col space-y-2">
        <label className="flex items-center">
          <input
            type="radio"
            name="eventType"
            value="Records created"
            checked={selectedEventType === "Records created"}
            onChange={eventTypeChanged}
            className="mr-2"
          />
          <span className="text-white">Records created</span>
        </label>
        
        <label className="flex items-center">
          <input
            type="radio"
            name="eventType"
            value="Everything else"
            checked={selectedEventType === "Everything else"}
            onChange={eventTypeChanged}
            className="mr-2"
          />
          <span className="text-white">Everything else</span>
        </label>
      </div>
    </div>
  )
}