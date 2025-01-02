import { useEffect, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { EditSourceAuthor } from "./EditSourceAuthor"
import { v4 as uuid } from "uuid"
import { detailRestrictions } from "./detailRestrictions"
import { EditSourcePublicationTimeRange } from "./EditSourcePublicationTimeRange"
import { editSourcesStateActions } from "../../AppState/stateSliceEditSources"


// TODO: edit title field (set value, fix the watermark defining the number of characters)
// TODO: ??why is the component getting re-rendered multiple times on startup??
// TODO: ??pack textbox fields into a single class with header lable, input text box, char count label, internal state, etc? how do I handle the linkage with the state machine??


export function EditSource({
  editId,
  deleteCallback
}) {

  if (!editId) {
    throw new Error("editId not provided; calling function must provide the guid to identify this source in the stateSliceEditSources.sources hash table")
  }
  else if (!deleteCallback) {
    throw new Error("deleteCallback function not provided")
  }

  // const editSource = useSelector((state) => state.editSources.sources[editId])
  const editSource = useSelector((state) => state.editSources[editId])

  //??what to do if this is undefined? I can't return early, so how do we handle this??

  // if (!editSource) {
  //   // Race condition following removal. Abort.
  //   // Note: This element was deleted from the state machine on the last frame, but it still 
  //   // exists for this frame in the DOM and is being re-rendered. There is no data for it, so
  //   // just abort.
  //   return
  // }

  // //??do we need a "submit button"? probably to make it more performant so that it isn't re-rendering all sources the moment a single field in one of the sources changes, but how much can we really avoid this??
  const reduxDispatch = useDispatch()

  // const complete = useState(false)

  // Delete button
  const onDeleteClicked = (e) => {
    deleteCallback(editId)
  }

  // Title
  const [title, setTitle] = useState(editSource?.title)
  const [titleComplete, setTitleComplete] = useState()
  const titleContainerRef = useRef()
  const titleCharCountLabelRef = useRef()
  const titleTextBoxRef = useRef()
  const titleDetailsSummaryRef = useRef()
  const onTitleChanged = (e) => {
    console.log({ "EditSource.onTitleChanged": e })

    setTitleComplete(Boolean(e.target.value))
    let args = {
      editId: editId,
      title: e.target.value
    }
    reduxDispatch(editSourcesStateActions.updateSourceTitle(args))
  }
  useEffect(() => {
    console.log({ "EditSource.useEffect[editSource.title]": editSource?.title })
    if (!titleCharCountLabelRef.current) return // not ready yet
    if (!titleTextBoxRef.current) return // not ready yet
    if (!titleDetailsSummaryRef.current) return // not ready yet
    if (!editSource) return // deleted last frame from state machine

    // Set the collapsible label
    titleDetailsSummaryRef.current.innerHTML = editSource.title ? editSource.title : `title for '${editId}'`

    let titleLength = editSource.title ? editSource.title.length : 0
    let charCountText = `${titleLength}/${detailRestrictions.maxSourceTitleLength}`
    titleCharCountLabelRef.current.innerHTML = charCountText
  }, [
    editSource?.title,
    titleCharCountLabelRef.current,
    titleTextBoxRef.current,
    titleDetailsSummaryRef.current,
  ])

  // // Publication date (lower bound)
  // const pubDateLowerBoundContainerRef = useRef()
  // const pubDateLowerBoundYearRef = useRef()
  // const pubDateLowerBoundMonthRef = useRef()
  // const pubDateLowerBoundDayRef = useRef()
  // const [publicationDateLowerBoundComplete, setPublicationDateLowerBoundComplete] = useState()

  // const updatePubDateLowerBoundStyle = (value) => {
  //   pubDateLowerBoundContainerRef.current.style.border = e.target.value ? "2px solid transparent" : "2px solid red"
  //   pubDateLowerBoundContainerRef.current.title = e.target.value ? "" : "Missing required value: 'Year'"
  //   setPublicationDateLowerBoundComplete(Boolean(e.target.value))
  // }

  // const onPubDateLowerBoundYearChanged = (e) => {
  //   console.log({ "EditSource.onPubDateLowerBoundYearChanged": e })

  //   updatePubDateLowerBoundStyle(e.target.value)
  //   let args = {
  //     editId: editId,
  //     value: e.target.value
  //   }
  //   reduxDispatch(editSourcesStateActions.updateSourcePubDateLowerBoundYear(args))
  // }

  // const onPubDateLowerBoundMonthChanged = (e) => {
  //   console.log({ "EditSource.onPubDateLowerBoundMonthChanged": e })

  //   let args = {
  //     editId: editId,
  //     value: e.target.value
  //   }
  //   reduxDispatch(editSourcesStateActions.updateSourcePubDateLowerBoundYear(args))
  // }

  // const onPubDateLowerBoundDayChanged = (e) => {
  //   console.log({ "EditSource.onPubDateLowerBoundDayChanged": e })

  //   let args = {
  //     editId: editId,
  //     value: e.target.value
  //   }
  //   reduxDispatch(editSourcesStateActions.updateSourcePubDateLowerBoundYear(args))
  // }

  // useEffect(() => {
  //   console.log({ "EditSource.useEffect[editSource.publicationTimeRange.lowerBoundYear]": editSource?.publicationTimeRange.lowerBoundYear })
  //   if (!pubDateLowerBoundYearRef.current) return
  //   if (!pubDateLowerBoundMonthRef.current) return
  //   if (!pubDateLowerBoundDayRef.current) return
  //   if (!editSource) return // deleted last frame from state machine

  //   // on load
  //   let year = editSource.publicationTimeRange.lowerBoundYear
  //   pubDateLowerBoundYearRef.current.valueAsNumber = year ? year : NaN
  //   updatePubDateLowerBoundStyle(year)

  //   let month = editSource.publicationTimeRange.lowerBoundMonth
  //   pubDateLowerBoundMonthRef.current.valueAsNumber = month ? month : NaN

  //   let day = editSource.publicationTimeRange.lowerBoundDay
  //   pubDateLowerBoundDayRef.current.valueAsNumber = day ? day : NaN
  // }, [
  //   pubDateLowerBoundYearRef.current,
  //   pubDateLowerBoundMonthRef.current,
  //   pubDateLowerBoundDayRef.current
  // ])



  // const pubDateUpperBoundYearRef = useRef()
  // const pubDateUpperBoundMonthRef = useRef()
  // const pubDateUpperBoundDayRef = useRef()
  // const onPubDateUpperBoundYearChanged = (e) => {
  //   console.log({ "EditSource.onPubDateUpperBoundYearChanged": e })
  // }

  // const onPubDateUpperBoundMonthChanged = (e) => {
  //   console.log({ "EditSource.onPubDateUpperBoundMonthChanged": e })
  // }

  // const onPubDateUpperBoundDayChanged = (e) => {
  //   console.log({ "EditSource.onPubDateUpperBoundDayChanged": e })
  // }



  // // ISBN
  // const [isbn, setIsbn] = useState(editSource.isbn)
  // const isbnCharCountLabelRef = useRef()

  // const onISBNChanged = (e) => {
  //   console.log({ "EditSource.onISBNChanged": e })
  //   setIsbn(e.target.value)
  // }

  // useEffect(() => {
  //   console.log({ "EditSource.useEffect[editSource.isbn]": editSource.isbn })
  //   if (!isbnCharCountLabelRef.current) return
  //   isbnCharCountLabelRef.current.innerHTML = `${editSource.isbn?.length}/${detailRestrictions.maxSourceIsbnLength}`
  // }, [editSource.isbn, isbnCharCountLabelRef.current])

  // // Where in source?
  // const [whereInSource, setWhereInSource] = useState(editSource.whereInSource)
  // const whereInSourceCharCountLabelRef = useRef()

  // const onWhereInSourceChanged = (e) => {
  //   console.log({ "EditSource.onWhereInSourceChanged": e })
  //   setWhereInSource(e.target.value)
  // }

  // useEffect(() => {
  //   console.log({ "EditSource.useEffect[editSource.whereInSource]": editSource.whereInSource })
  //   if (!whereInSourceCharCountLabelRef.current) return
  //   whereInSourceCharCountLabelRef.current.innerHTML = `${editSource.whereInSource?.length}/${detailRestrictions.maxWhereInSourceLength}`
  // }, [editSource.whereInSource, whereInSourceCharCountLabelRef.current])




  // Complete
  const [border, setBorder] = useState()
  useEffect(() => {
    console.log({ "editSource.complete": { title: editSource?.title } })


    //??react to a "complete" variable in the state machine??
    titleComplete
    // publicationDateLowerBoundComplete

    let complete = true
    if (!editSource) {
      complete = false
    }
    else {
      complete &= editSource.title?.trim().length > 0
      complete &= Number.isInteger(editSource.publicationTimeRange.lowerBoundYear)
      complete &= Number.isInteger(editSource.publicationTimeRange.upperBoundYear)
      complete &= editSource.authors.length > 0
      complete &= editSource.whereInSource?.trim().length > 0
    }
    // setstate

    // TODO: author in-depth compare

    // Show red border if fields are incomplete, else show an invisible border (because the 
    // border will occupy space and I don't want it to resize when the red border 
    // appears/disappears)
    setBorder(complete ? "border-2 border-black" : "border-2 border-red-600")
  }, [editSource?.title])





  // const publicationLowerBoundDateLabelRef = useRef()
  // const publicationUpperBoundDateLabelRef = useRef()





  // const onSubmitSourceClick = (e) => {
  //   console.log({ "EditSource.onSubmitSourceClick": e })
  //   submitCallback({
  //     things: "and such"
  //   })
  // }



  /*
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
  
  */

  const onSubmitThingy = (e) => {
    console.log("submitted?")
  }


  return (
    <div>
      <div key={editId} className={`flex flex-col m-1 `}>
        {/* Header */}
        <div className="flex flex-row-reverse">
          {/* Delete */}
          <button type="button" className="inline-flex items-center rounded-md bg-gray-600 hover:bg-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700" onClick={(e) => onDeleteClicked(e)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            <span className="sr-only">Icon description</span>
          </button>
        </div>

        <details className="w-full" open>
          <summary className="text-left" ref={titleDetailsSummaryRef}>
          </summary>
          <div>
            {/* Title */}
            <div className="flex flex-col m-1">
              {/* header */}
              <label className="text-left text-lg">Title</label>

              {/* content */}
              <textarea
                ref={titleTextBoxRef}
                className="ml-1 text-black"
                rows={2}
                maxLength={detailRestrictions.maxSourceTitleLength}
                placeholder={`Title (max ${detailRestrictions.maxSourceTitleLength})`}
                onChange={onTitleChanged} />

              {/* char count */}
              <label ref={titleCharCountLabelRef} className="text-right"></label>
            </div>
          </div>

          {/* Publication date */}
          <EditSourcePublicationTimeRange editId={editId} />
        </details>


      </div>
    </div>
  )
}
