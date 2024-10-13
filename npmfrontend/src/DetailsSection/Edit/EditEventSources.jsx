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
      reduxDispatch(editSourcesStateActions.importSource(sourceinfo))
    })
  }, [editState.sources])

  // On sources changed
  useEffect(() => {
    console.log({ "EditEventSources.useEffect[editSources.sources]": editSources.sources })
    let editIds = Object.keys(editSources.sources)
    let reactElements = editIds.map(editId => (
      <div key={editId} className="flex flex-col">
        <EditSource editId={editId} />
      </div>
    ))
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
    setSources(reactElements)
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

    addSource(newId)
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
