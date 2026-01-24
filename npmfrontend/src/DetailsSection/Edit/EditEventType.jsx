import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { editStateActions } from "../../AppState/stateSliceEditPoi"

export function EditEventType() {
  const editState = useSelector((state) => state.editPoiReducer)
  const reduxDispatch = useDispatch()

  const [isCreationOfSource, setIsCreationOfSource] = useState(false)

  // On start, load values from state
  useEffect(() => {
    console.log({ "EditEventType.useEffect[editState.eventIsCreationOfSource]": editState.eventIsCreationOfSource })

    setIsCreationOfSource(editState.eventIsCreationOfSource || false)
  }, [editState.eventIsCreationOfSource])

  // On checkbox change, set state
  const checkboxChanged = (e) => {
    const isChecked = e.target.checked
    setIsCreationOfSource(isChecked)

    reduxDispatch(editStateActions.setEventIsCreationOfSource({ eventIsCreationOfSource: isChecked }))
  }

  return (
    <div className="flex flex-col m-1 p-2 rounded-md border-2 border-gray-600">
      <div>
        <label className="flex items-center justify-between">
          <span className="text-white">This event is the creation of a record</span>
          <input
            type="checkbox"
            checked={isCreationOfSource}
            onChange={checkboxChanged}
            className="ml-2"
          />
        </label>
      </div>
    </div>
  )
}