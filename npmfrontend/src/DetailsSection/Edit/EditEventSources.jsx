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
  // const [sourcesReactElements, setSourcesReactElements] = useState()
  // const [singleSourceEdit, setSingleSourceEdit] = useState()

  // const callback = (newSource) => {
  //   console.log("callback for new source")
  //   setSingleSourceEdit(null)
  // }

  // On load
  useEffect(() => {
    console.log({ "EditEventSources.useEffect[editState.sources]": editState.sources })
    editState.sources?.forEach(sourceinfo => {
      throw new Error("no implemented")
      reduxDispatch(editSourcesStateActions.importSource(sourceinfo))
    })
  }, [editState.sources])


  // useEffect(() => {
  //   console.log({ "EditEventSources.useEffect[sources]": sources })
  //   console.log({ path: "useEffect[sources]", sources: sources })
  // }, [sources])


  // On sources changed
  useEffect(() => {
    console.log({ "EditEventSources.useEffect[editSources.sources]": editSources.sources, "sources": sources })

    const deleteCallback = (editId) => {
      // Re-render without that item so that it is deleted from the DOM before the next frame begins to render.
      // Note: Deleting from the state machine but not the DOM results in the object trying to re-
      // render after the change in state (that is, the delete), but then there is no info for the
      // component and it gets all weird.

      // let filteredEditIds = editIds.filter(value => value != editId)
      // console.log({ path: "delete", sources: sources })
      // let reactElements = filteredEditIds.map(editId => (
      //   <div key={editId} className="flex flex-col">
      //     <EditSource editId={editId} />
      //   </div>
      // ))
      // setSources(reactElements)

      // let editIds = Object.key(editSources.sources).filter(key => key != editId)
      // let reactElements = filteredEditIds.map(editId => (
      //   <div key={editId} className="flex flex-col">
      //     <EditSource editId={editId} />
      //   </div>
      // ))
      // setSources(reactElements)

      // ok so the callback function makes a copy of any local variables at the time that it's made, which means that I can't run off to the local "sources" state machine

      // Remove from the local state machine
      /*
        Note: Okay so there's a cascade of design consequences. The state machine's "sources" array must be an object. If it is an array [], then the state machine turns it into some kind of proxy object and it is not the array that you started with. But if it is an object [], then the state machine keeps it as such and I can easily identify the contents, but as a consequence (for some reason)

        Ok so this is janky, but it's part of the side effect of JavaScript lambda functions adopting the values of local variables. There are two scenarios:
        1. Delete latest entry
          When the delete callback is formed, the sources array had all the entries that came before, but not the most recent one because the array won't change until the next frame. Attempting to filter out the latest entry from this lambda function's local copy of the sources array variable results in the exact same array (latest entry wasn't there), and therefore setting this as the new state machine object results in no change 
      */

      //
      // ...ok so this is janky. The javascript function makes a copy of any local variables that 
      // it uses at the time that the function is created (in this case, the sources). Two
      // scenarios:
      /*
        1. Delete latest entry:

      */



      // // attempt to remove the latest entry, then the entry is not in the sources array because it
      // // hadn't been added at the time that its "deleteCallback" function had been created, and so
      // // when I filter the sources array for that entry, it isn't there, and setting that as the 
      // // new sources array results in the latest entry disappearing. But if I attempt to remove an
      // // older entry, then that _is_ in the sources array and is removed. Both result in the 
      // // desired outcome, though the former by unintentional side effect.
      // let otherSources = sources.filter(container => container.key != editId)
      // setSources(otherSources)

      // Remove from the state machine
      reduxDispatch(editSourcesStateActions.deleteSource(editId))
    }

    let editIds = Object.keys(editSources.sources)
    let reactElements = editIds.map((editId) => (
      <div key={editId} className="flex flex-col">
        <EditSource editId={editId} deleteCallback={deleteCallback} />
      </div>
    ))
    // let reactElements = editSources.sources.map(source => (
    //   <div key={source.editId} className="flex flex-col">
    //     <EditSource editId={source.editId} deleteCallback={deleteCallback} />
    //   </div>
    // ))
    setSources(reactElements)
    console.log({ path: "create", sources: reactElements })

    // let newElement =

    //   let reactElements = editSources.sources?.map((s) => (
    //     <div className="m-1 border-2 border-grey-600" key={s.title + s.details}>
    //       <p>{s.title}</p>
    //       {s.details ? <p>{s.details}</p> : null}
    //       {s.authors.join(", ")}
    //       {convertTimeRangeToGregorianYearMonthDay(
    //         s.publicationLowerBoundYear,
    //         s.publicationLowerBoundMonth,
    //         s.publicationLowerBoundDay,
    //         s.publicationUpperBoundYear,
    //         s.publicationUpperBoundMonth,
    //         s.publicationUpperBoundDay)
    //       }
    //     </div>
    //   ))
  }, [editSources.sources])

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
      title: `title for '${newId}'`
    }))

    // addSource(newId)
  }

  // const addSource = (editId) => {
  //   // console.log({ "addSource": eidtId })

  //   const onWhereInSourceChanged = (e) => {
  //     console.log({ onWhereInSourceChanged: e.target.value, editId: editId })
  //   }

  //   let newElement = (
  //     <div key={editId} className="flex flex-col">
  //       <EditSource editId={editId} />
  //     </div>
  //   )

  //   /*
  //     // Detailed location (optional; ex: "Chap 3, p. 87")
  //   const [detailedLocation, setDetailedLocation] = useState(startingDetailedLocation)
  //   const detailedLocationCharCountLabelRef = useRef()

  //   const onDetailedLocationChanged = (e) => {
  //     console.log({ "EditSource.onDetailedLocationChanged": e })
  //     setDetailedLocation(e.target.value)
  //   }

  //   useEffect(() => {
  //     console.log({ "EditSource.useEffect[detailedLocation]": detailedLocation })
  //     if (!detailedLocationCharCountLabelRef.current) return
  //     detailedLocationCharCountLabelRef.current.innerHTML = `${detailedLocation?.length}/${detailRestrictions.maxSourceDetailedLocatonLength}`
  //   }, [detailedLocation, detailedLocationCharCountLabelRef.current])
  //     */


  //   // Edit the front-end copy of the state, then "set" it so that it triggers a re-render.
  //   let newSources = [
  //     ...sources,
  //     newElement
  //   ]
  //   setSources(newSources)

  //   console.log("done adding sources clicked")

  // }


  // useEffect(() => {
  //   console.log({ "EditEventSources.useEffect[singleSourceEdit]": singleSourceEdit })
  //   if (!singleSourceEdit)
  //   setSourcesReactElements(reactElements)
  // }, [singleSourceEdit])



  //TODO: ??how to edit existing source??

  // Sources stacked vertically, including the fields being edited
  return (
    <div className="flex flex-col border-2 border-gray-600 overflow-auto">
      <label className="text-xl">Sources</label>


      {sources}
      {/* <div className="flex flex-col items-start border-1 border-red-600">
        <div>one</div>
        <div>two</div>
        <div>three</div>
      </div> */}

      <div className="flex flex-row-reverse mt-auto h-full">
        <button className="bg-gray-500 hover:bg-gray-700 text-white font-bold m-1 py-2 px-4 rounded " onClick={(e) => onAddSourceClicked(e)}>
          +
        </button>
      </div>

    </div>
  )
}
