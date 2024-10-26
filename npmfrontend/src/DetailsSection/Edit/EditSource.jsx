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
  if (!editSource) {
    // Race condition following removal. Abort.
    // Note: This element was deleted from the state machine on the last frame, but it still 
    // exists for this frame in the DOM and is being re-rendered. There is no data for it, so
    // just abort.
    return
  }

  // //??do we need a "submit button"? probably to make it more performant so that it isn't re-rendering all sources the moment a single field in one of the sources changes, but how much can we really avoid this??
  // const reduxDispatch = useDispatch()

  // Delete button
  const onDeleteClicked = (e) => {
    deleteCallback(editId)
  }

  // Complete
  const [border, setBorder] = useState()
  useEffect(() => {
    console.log({ "editSource.complete": editSource.complete })

    // Show red border if fields are incomplete, else show an invisible border (because the 
    // border will occupy space and I don't want it to resize when the red border 
    // appears/disappears)
    setBorder(editSource.complete ? "border-2 border-black" : "border-2 border-red-600")
  }, [editSource.complete])

  // // Title
  // const [title, setTitle] = useState(editSource.title)
  // const titleCharCountLabelRef = useRef()

  // const onTitleChanged = (e) => {
  //   console.log({ "EditSource.onTitleChanged": e })
  //   setTitle(e.target.value)
  // }

  // useEffect(() => {
  //   console.log({ "EditSource.useEffect[editSource.title]": editSource.title })
  //   if (!titleCharCountLabelRef.current) return
  //   titleCharCountLabelRef.current.innerHTML = `${editSource.title?.length}/${detailRestrictions.maxSourceTitleLength}`
  // }, [editSource.title, titleCharCountLabelRef.current])

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






  // const publicationLowerBoundDateLabelRef = useRef()
  // const publicationUpperBoundDateLabelRef = useRef()



  // const onPublicationLowerBoundYearChanged = (e) => {
  //   console.log({ "EditSource.onPublicationLowerBoundYearChanged": e })
  // }

  // const onPublicationLowerBoundMonthChanged = (e) => {
  //   console.log({ "EditSource.onPublicationLowerBoundMonthChanged": e })
  // }

  // const onPublicationLowerBoundDayChanged = (e) => {
  //   console.log({ "EditSource.onPublicationLowerBoundDayChanged": e })
  // }

  // const onPublicationUpperBoundYearChanged = (e) => {
  //   console.log({ "EditSource.onPublicationUpperBoundYearChanged": e })
  // }

  // const onPublicationUpperBoundMonthChanged = (e) => {
  //   console.log({ "EditSource.onPublicationUpperBoundMonthChanged": e })
  // }

  // const onPublicationUpperBoundDayChanged = (e) => {
  //   console.log({ "EditSource.onPublicationUpperBoundDayChanged": e })
  // }

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



      </div>
    </div>
  )
}
