import { useEffect, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { convertTimeRangeToGregorianYearMonthDay } from "../convertTimeRangeToString"
import { EditSource } from "./EditSource"

export function EditEventSources() {
  const editState = useSelector((state) => state.editPoiReducer)
  const reduxDispatch = useDispatch()


  const [sourcesReactElements, setSourcesReactElements] = useState()
  const [singleSourceEdit, setSingleSourceEdit] = useState()

  const callback = (newSource) => {
    console.log("callback for new source")
    setSingleSourceEdit(null)
  }

  // On load
  useEffect(() => {
    console.log({ "EditEventSources.useEffect[editState.sources]": editState.sources })
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
  // Note: 'id' should be a guid. New sources should be passed id = null. The EditSource will submit to the state machine with this id.
  */
  const onAddSourceClicked = (e) => {
    console.log({ "EditEventSources.onAddSourceClicked": e })
    setSingleSourceEdit(
      (
        <details>
          <summary>Things and such</summary>
          <EditSource
            startingId={null}
            startingTitle={"starting title"}
            startingIsbn={"74837hsdfkh2"}
            startingDetailedLocation={"chatper 7, paragraph 3"}
            submitCallback={callback} />
        </details>
      )
    )
  }


  // useEffect(() => {
  //   console.log({ "EditEventSources.useEffect[singleSourceEdit]": singleSourceEdit })
  //   if (!singleSourceEdit)
  //   setSourcesReactElements(reactElements)
  // }, [singleSourceEdit])



  //TODO: ??how to edit existing source??

  // Sources stacked vertically, including the fields being edited
  return (
    <div className="border-2 border-gray-600 overflow-auto">
      <label className="text-xl">Sources</label>

      {/* Existing sources */}
      {sourcesReactElements ? null :
        <div className="flex flex-col m-1 border-2 border-gray-600">
          {sourcesReactElements}
        </div>
      }

      {/* TODO: have more than one source under edit at one time, but use a state machine to edit each one */}


      {/* Source being edited */}
      <div className="flex flex-col m-1 border-2 border-gray-600">
        {singleSourceEdit}
      </div>

      {/* Add, but only one at a time*/}
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
