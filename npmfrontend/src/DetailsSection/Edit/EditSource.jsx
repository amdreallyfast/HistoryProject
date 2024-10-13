import { useEffect, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { EditSourceAuthor } from "./EditSourceAuthor"
import { v4 as uuid } from "uuid"
import { detailRestrictions } from "./detailRestrictions"
import { EditSourcePublicationTimeRange } from "./EditSourcePublicationTimeRange"
import { editSourcesStateActions } from "../../AppState/stateSliceEditSources"

export function EditSource({
  editId,
  deleteCallback
}) {
  // if (!submitCallback) {
  //   throw new Error("must provide 'submitCallback'")
  // }

  if (!editId) {
    throw new Error("editId not provided; calling function must provide the guid to identify this source in the stateSliceEditSources.sources hash table")
  }
  else if (!deleteCallback) {
    throw new Error("deleteCallback function not provided")
  }

  // const editSources = useSelector((state) => state.editSources)
  // if (!editSources.sources[editId]) {
  //   // Race condition following removal. Just return and let the EditEventSources re-render and update the list of existing components.
  //   return
  // }
  // const editSource = editSources.sources[editId]
  // const editSource = editSources.sources.find(source => source.editId == editId)
  const editSource = useSelector((state) => state.editSources.sources[editId])

  const editState = useSelector((state) => state.editPoiReducer)
  const reduxDispatch = useDispatch()

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

  // Title
  const [title, setTitle] = useState(editSource.title)
  const titleCharCountLabelRef = useRef()

  const onTitleChanged = (e) => {
    console.log({ "EditSource.onTitleChanged": e })
    setTitle(e.target.value)
  }

  useEffect(() => {
    console.log({ "EditSource.useEffect[editSource.title]": editSource.title })
    if (!titleCharCountLabelRef.current) return
    titleCharCountLabelRef.current.innerHTML = `${editSource.title?.length}/${detailRestrictions.maxSourceTitleLength}`
  }, [editSource.title, titleCharCountLabelRef.current])

  // ISBN
  // ?? can I pack this into a single class with text box, label, state, etc? how do I handle the linkage with the state machine??
  const [isbn, setIsbn] = useState(editSource.isbn)
  const isbnCharCountLabelRef = useRef()

  const onISBNChanged = (e) => {
    console.log({ "EditSource.onISBNChanged": e })
    setIsbn(e.target.value)
  }

  useEffect(() => {
    console.log({ "EditSource.useEffect[editSource.isbn]": editSource.isbn })
    if (!isbnCharCountLabelRef.current) return
    isbnCharCountLabelRef.current.innerHTML = `${editSource.isbn?.length}/${detailRestrictions.maxSourceIsbnLength}`
  }, [editSource.isbn, isbnCharCountLabelRef.current])

  // Where in source?
  const [whereInSource, setWhereInSource] = useState(editSource.whereInSource)
  const whereInSourceCharCountLabelRef = useRef()

  const onWhereInSourceChanged = (e) => {
    console.log({ "EditSource.onWhereInSourceChanged": e })
    setWhereInSource(e.target.value)
  }

  useEffect(() => {
    console.log({ "EditSource.useEffect[editSource.whereInSource]": editSource.whereInSource })
    if (!whereInSourceCharCountLabelRef.current) return
    whereInSourceCharCountLabelRef.current.innerHTML = `${editSource.whereInSource?.length}/${detailRestrictions.maxWhereInSourceLength}`
  }, [editSource.whereInSource, whereInSourceCharCountLabelRef.current])






  const publicationLowerBoundDateLabelRef = useRef()
  const publicationUpperBoundDateLabelRef = useRef()



  const onPublicationLowerBoundYearChanged = (e) => {
    console.log({ "EditSource.onPublicationLowerBoundYearChanged": e })
  }

  const onPublicationLowerBoundMonthChanged = (e) => {
    console.log({ "EditSource.onPublicationLowerBoundMonthChanged": e })
  }

  const onPublicationLowerBoundDayChanged = (e) => {
    console.log({ "EditSource.onPublicationLowerBoundDayChanged": e })
  }

  const onPublicationUpperBoundYearChanged = (e) => {
    console.log({ "EditSource.onPublicationUpperBoundYearChanged": e })
  }

  const onPublicationUpperBoundMonthChanged = (e) => {
    console.log({ "EditSource.onPublicationUpperBoundMonthChanged": e })
  }

  const onPublicationUpperBoundDayChanged = (e) => {
    console.log({ "EditSource.onPublicationUpperBoundDayChanged": e })
  }

  const onSubmitSourceClick = (e) => {
    console.log({ "EditSource.onSubmitSourceClick": e })
    submitCallback({
      things: "and such"
    })
  }



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
      <div key={editId} className={`flex flex-col m-1 ${border}`}>
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
          <summary className="text-left">
            {editSource.title}
          </summary>
          <div>
            {/* Title */}
            <div className="flex flex-col m-1">
              <label className="text-left text-lg">Title</label>
              <textarea
                className="ml-1 text-black"
                rows={2}
                maxLength={detailRestrictions.maxSourceTitleLength}
                placeholder={`Title (max ${detailRestrictions.maxSourceTitleLength})`}
                onChange={onTitleChanged} />
              <label ref={titleCharCountLabelRef} className="text-right"></label>
            </div>
          </div>

          {/* Where in source */}
          <div className="flex flex-col m-1">
            <label className="text-left">Where in source?</label>
            <input className="text-left ml-1 text-black" type="text" maxLength={detailRestrictions.maxWhereInSourceLength} placeholder="Ex: Chapter 3, paragraph 27" onChange={(e) => onWhereInSourceChanged(e)} />
            <label ref={whereInSourceCharCountLabelRef} className="text-right"></label>
          </div>
        </details>

      </div>
    </div>
  )
}
