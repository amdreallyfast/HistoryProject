import { useEffect, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { EditSourceAuthor } from "./EditSourceAuthor"
import { v4 as uuid } from "uuid"
import { detailRestrictions } from "./detailRestrictions"
import { EditSourcePublicationTimeRange } from "./EditSourcePublicationTimeRange"

export function EditSource({
  editSourceId
}) {
  // if (!submitCallback) {
  //   throw new Error("must provide 'submitCallback'")
  // }

  if (!editSourceId) {
    throw new Error("calling function must provide the guid to identify this source in the stateSliceEditSources.sources hash table")
  }

  const editSources = useSelector((state) => state.editSources)

  const editState = useSelector((state) => state.editPoiReducer)
  const reduxDispatch = useDispatch()


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

  // Title
  const [title, setTitle] = useState(editSources.sources[editSourceId].title)
  const titleCharCountLabelRef = useRef()

  const onTitleChanged = (e) => {
    console.log({ "EditSource.onTitleChanged": e })
    setTitle(e.target.value)
  }

  useEffect(() => {
    console.log({ "EditSource.useEffect[title]": title })
    if (!titleCharCountLabelRef.current) return
    titleCharCountLabelRef.current.innerHTML = `${title?.length}/${detailRestrictions.maxSourceTitleLength}`
  }, [title, titleCharCountLabelRef.current])

  // ISBN
  const [isbn, setIsbn] = useState(editSources.sources[editSourceId].isbn)
  const isbnCharCountLabelRef = useRef()

  const onISBNChanged = (e) => {
    console.log({ "EditSource.onISBNChanged": e })
    setIsbn(e.target.value)
  }

  useEffect(() => {
    console.log({ "EditSource.useEffect[isbn]": isbn })
    if (!isbnCharCountLabelRef.current) return
    isbnCharCountLabelRef.current.innerHTML = `${isbn?.length}/${detailRestrictions.maxSourceIsbnLength}`
  }, [isbn, isbnCharCountLabelRef.current])



  // Author(s)
  /*
    {
      "id": <guid>,
      "name": "text"
    }
  */
  const [authors, setAuthors] = useState(editSources.sources[editSourceId].authors)
  const [authorsReactElements, setAuthorsReactElements] = useState()
  const authorEditedCallback = (author) => {
    console.log(`author edited: '${author}'`)

    // TODO: name uniqueness check
    //  ??but how to provide feedback? to the input??
    //  ??create state slice for source being edited??

    let updatedAuthors = []
    for (let i = 0; i < authors.length; i++) {
      let a = authors[i]
      if (a.id == author.id) {
        a = {
          ...author,
          name: author.name
        }
      }
      updatedAuthors.push(a)
    }
    setAuthors(updatedAuthors)
  }

  const authorDeletedCallback = (author) => {
    console.log(`delete author: '${author}'`)

    let updatedAuthors = authors.filter((a) => a.id != author.id)
    setAuthors(updatedAuthors)
  }

  const onAddAuthorClicked = (e) => {
    console.log({ "EditSource.onAddAuthorClicked": e })

    let newAuthors = authors ? [...authors] : []
    newAuthors.push({
      id: uuid(),
      name: "badfafdhl"
    })
    setAuthors(newAuthors)
  }

  useEffect(() => {
    console.log({ "EditSource.useEffect[authors]": authors })

    let reactElements = authors?.map((a) => (
      <EditSourceAuthor key={a.id} author={a} authorEditedCallback={authorEditedCallback} authorDeletedCallback={authorDeletedCallback} />
    ))
    setAuthorsReactElements(reactElements)
  }, [authors])


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
      <details className="w-full" open>
        <summary>{title}</summary>

        {/* Header */}
        <div className="flex flex-row-reverse">
          {/* Delete */}
          <button type="button" className="inline-flex items-center rounded-md bg-gray-600 hover:bg-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700" onClick={(e) => authorDeletedCallback(author)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            <span className="sr-only">Icon description</span>
          </button>
        </div>

        {/* Items */}
        <div>
          {/* Title */}
          <div className="flex flex-col m-1">
            <label className="text-lg text-left">Title</label>
            <textarea
              className="m-1 text-black"
              rows={2}
              maxLength={detailRestrictions.maxSourceTitleLength}
              placeholder={`Title (max ${detailRestrictions.maxSourceTitleLength})`}
              onChange={onTitleChanged} />
            <label ref={titleCharCountLabelRef} className="text-right"></label>
          </div>
        </div>
      </details>
    </div>
  )
}
