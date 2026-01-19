import { useEffect, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { convertTimeRangeToGregorianYearMonthDay } from "../convertTimeRangeToString"
import { EditSource } from "./EditSource"
import { generateUUID } from "three/src/math/MathUtils.js"
import { editSourcesStateActions } from "../../AppState/stateSliceEditSources"
import { detailRestrictions } from "./detailRestrictions"

export function EditEventSources() {
  const editState = useSelector((state) => state.editPoiReducer)
  const editSources = useSelector((state) => state.editSources)

  const reduxDispatch = useDispatch()

  const [sources, setSources] = useState([])
  const [error, setError] = useState(null)

  // Validation function
  const isComplete = (editSourcesObj) => {
    let editIds = Object.keys(editSourcesObj).filter(editId => editId != "sources")
    if (!editIds || editIds.length === 0) {
      setError("Must have at least one source")
      return false
    }
    setError(null)
    return true
  }

  // Determine border color based on validation state
  const getBorderClass = () => {
    if (error) {
      return "border-red-500 border-opacity-80 border-2"
    } else {
      return "border-green-600 border-opacity-80 border-2"
    }
  }

  // On load
  useEffect(() => {
    console.log({ "EditEventSources.useEffect[editState.sources]": editState.sources })
    editState.sources?.forEach(sourceinfo => {
      throw new Error("not implemented")
      reduxDispatch(editSourcesStateActions.importSource(sourceinfo))
    })
  }, [editState.sources])


  // // On sources changed
  // useEffect(() => {
  //   console.log({ "EditEventSources.useEffect[editSources.sources]": editSources.sources, "sources": sources })

  //   const deleteCallback = (editId) => {
  //     // Remove from the state machine
  //     // Note: This will trigger a change in editState.sources, which will trigger a re-render in
  //     // all EditSource objects. That re-rendering happens before this useEffect(...) is 
  //     // triggered, so need to handle possible null there.
  //     reduxDispatch(editSourcesStateActions.deleteSource(editId))
  //   }

  //   let editIds = Object.keys(editSources.sources)
  //   let reactElements = editIds.map((editId) => (
  //     <div key={editId} className="flex flex-col">
  //       <EditSource editId={editId} deleteCallback={deleteCallback} />
  //     </div>
  //   ))
  //   setSources(reactElements)
  //   console.log({ path: "create", sources: reactElements })
  // }, [editSources.sources])

  // On sources changed
  useEffect(() => {
    console.log({ "EditEventSources.useEffect[editSources]": editSources })

    const deleteCallback = (editId) => {
      // Remove from the state machine
      // Note: This will trigger a change in editState.sources, which will trigger a re-render in
      // all EditSource objects. That re-rendering happens before this useEffect(...) is 
      // triggered, so need to handle possible null there.
      reduxDispatch(editSourcesStateActions.deleteSource(editId))
    }

    let editIds = Object.keys(editSources).filter(editId => editId != "sources")
    let reactElements = editIds.map((editId) => (
      <div key={editId} className="flex flex-col">
        <EditSource editId={editId} deleteCallback={deleteCallback} />
      </div>
    ))
    setSources(reactElements)
    console.log({ path: "create", sources: reactElements })
    isComplete(editSources)
  }, [editSources])





  // TODO: ??how to add an "edit session"??
  /*
  // Note: 'id' should be a guid. New sources should be passed id = null. The EditSource will submit to the state machine with this id.
  */
  const onAddSourceClicked = (e) => {
    console.log({ "EditEventSources.onAddSourceClicked": e })
    // setSingleSourceEdit(
    //   (
    //     <details open>
    //       <summary>Things and such</summary>
    //       <EditSource
    //         startingId={null}
    //         startingTitle={"starting title"}
    //         startingIsbn={"74837hsdfkh2"}
    //         startingDetailedLocation={"chatper 7, paragraph 3"}
    //         submitCallback={callback} />
    //     </details>
    //   )
    // )

    let newId = generateUUID()
    reduxDispatch(editSourcesStateActions.newSource({
      id: newId,
      // title: `title for '${newId}'`
    }))

    // addSource(newId)
  }

  return (
    <div className={`flex flex-col m-1 rounded-md overflow-auto ${getBorderClass()}`}>
      <label className="text-xl">Sources</label>

      {sources}

      <div className="flex flex-row-reverse mt-auto h-full">
        <button className="bg-gray-500 hover:bg-gray-700 text-white font-bold m-1 py-2 px-4 rounded " onClick={(e) => onAddSourceClicked(e)}>
          +
        </button>
      </div>

      {/* Error display */}
      <label className="text-red-500 text-sm m-1 block text-left">{error}</label>
    </div>
  )
}
