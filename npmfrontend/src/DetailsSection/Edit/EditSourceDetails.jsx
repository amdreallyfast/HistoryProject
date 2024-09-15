import { useEffect, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { editStateActions } from "../AppState/stateSliceEditPoi"
import { detailRestrictions } from "../GlobeSection/constValues"
import { convertTimeRangeToGregorianYearMonthDay, convertTimeToGregorianYearMonthDay } from "./convertTimeRangeToString"
import { SingleSourceDetailsEditMode } from "./SingleSourceDetailsEditMode"

export function EditSourceDetails() {
  const editState = useSelector((state) => state.editPoiReducer)
  const reduxDispatch = useDispatch()


  const [sourcesReactElements, setSourcesReactElements] = useState([])
  const [singleSourceEdit, setSingleSourceEdit] = useState()

  const callback = (newSource) => {
    console.log("callback for new source")
    setSingleSourceEdit(null)
  }

  // On load
  useEffect(() => {
    console.log({ "EditSourceDetails.useEffect.editState.sources": editState.sources })
    let reactElements = editState.sources?.map((s) => (
      <div className="m-1 border-2 border-grey-600" key={s.title + s.details}>
        <p>{s.title}</p>
        {s.details ? <p>{s.details}</p> : null}
        {s.authors.join(", ")}
        {convertTimeRangeToGregorianYearMonthDay(
          s.publicationLowerBoundYear,
          s.publicationLowerBoundMonth,
          s.publicationLowerBoundDay,
          s.publicationUpperBoundYear,
          s.publicationUpperBoundMonth,
          s.publicationUpperBoundDay)
        }
      </div>
    ))
    setSourcesReactElements(reactElements)
  }, [editState.sources])

  // TODO: ??how to add an "edit session"??
  /*
  // Note: 'id' should be a guid. New sources should be passed id = null. The SingleSourceDetailsEditMode will submit to the state machine with this id.
  */
  const onAddSourceClicked = (e) => {
    console.log({ "EditSourceDetails.onAddSourceClicked": e })
    setSingleSourceEdit(
      (
        <SingleSourceDetailsEditMode
          startingId={null}
          startingTitle={"starting title"}
          startingIsbn={"74837hsdfkh2"}
          startingDetailedLocation={"chatper 7, paragraph 3"}
          submitCallback={callback} />
      )
    )
  }


  // useEffect(() => {
  //   console.log({ "EditSourceDetails.useEffect.singleSourceEdit": singleSourceEdit })
  //   if (!singleSourceEdit)
  //   setSourcesReactElements(reactElements)
  // }, [singleSourceEdit])



  //TODO: ??how to edit existing source??

  // Sources stacked vertically, including the fields being edited
  return (
    <div className="flex flex-col border-2 border-grey-600">
      <label className="text-xl">Sources</label>

      {sourcesReactElements}

      {singleSourceEdit}

      {/* Add */}
      {singleSourceEdit ? null :
        <div className="flex flex-row-reverse mt-auto h-full">
          <button className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded " onClick={(e) => onAddSourceClicked(e)}>
            New source
          </button>
        </div>
      }

    </div>
  )
}
