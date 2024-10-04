import { useEffect, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { EditSourceAuthor } from "./EditSourceAuthor"
import { v4 as uuid } from "uuid"
import { detailRestrictions } from "./detailRestrictions"
import { EditSourcePublicationTimeRange } from "./EditSourcePublicationTimeRange"

export function EditSource({
  startingTitle,
  startingIsbn,
  startingDetailedLocation,
  startingAuthors,
  startingPubDateLowerBoundYear,
  startingPubDateLowerBoundMonth,
  startingPubDateLowerBoundDay,
  startingPubDateUpperBoundYear,
  startingPubDateUpperBoundMonth,
  startingPubDateUpperBoundDay,
  submitCallback
}) {
  if (!submitCallback) {
    throw new Error("must provide 'submitCallback'")
  }

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
  const [title, setTitle] = useState(startingTitle)
  const titleCharCountLabelRef = useRef()
  useEffect(() => {
    console.log({ "EditSource.useEffect[title]": title })
    if (!titleCharCountLabelRef.current) return
    titleCharCountLabelRef.current.innerHTML = `${title?.length}/${detailRestrictions.maxSourceTitleLength}`
  }, [title, titleCharCountLabelRef.current])

  const onTitleChanged = (e) => {
    console.log({ "EditSource.onTitleChanged": e })
    setTitle(e.target.value)
  }

  // ISBN
  const [isbn, setIsbn] = useState(startingIsbn)
  const isbnCharCountLabelRef = useRef()
  useEffect(() => {
    console.log({ "EditSource.useEffect[isbn]": isbn })
    isbnCharCountLabelRef.current.innerHTML = `${isbn?.length}/${detailRestrictions.maxSourceIsbnLength}`
  }, [isbn, isbnCharCountLabelRef.current])

  const onISBNChanged = (e) => {
    console.log({ "EditSource.onISBNChanged": e })
    setIsbn(e.target.value)
  }

  // Detailed location (optional; ex: "Chap 3, p. 87")
  const [detailedLocation, setDetailedLocation] = useState(startingDetailedLocation)
  const detailedLocationCharCountLabelRef = useRef()
  useEffect(() => {
    console.log({ "EditSource.useEffect[detailedLocation]": detailedLocation })
    if (!detailedLocationCharCountLabelRef.current) return
    detailedLocationCharCountLabelRef.current.innerHTML = `${detailedLocation?.length}/${detailRestrictions.maxSourceDetailedLocatonLength}`
  }, [detailedLocation, detailedLocationCharCountLabelRef.current])

  const onDetailedLocationChanged = (e) => {
    console.log({ "EditSource.onDetailedLocationChanged": e })
    setDetailedLocation(e.target.value)
  }

  // Author(s)
  /*
    {
      "id": <guid>,
      "name": "text"
    }
  */
  const [authors, setAuthors] = useState(startingAuthors)
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

      {/* ISBN */}
      <div className="flex flex-col m-1">
        <label className="text-lg text-left">ISBN (optional)</label>
        <input className="m-1 text-black" type="text" maxLength={detailRestrictions.maxSourceIsbnLength} placeholder={`ISBN (max ${detailRestrictions.maxSourceIsbnLength})`} onChange={onISBNChanged}></input>
        <label ref={isbnCharCountLabelRef} className="text-right"></label>
      </div>

      {/* Detailed location */}
      <div className="flex flex-col m-1">
        <label className="text-lg text-left">Detailed location (optional)</label>
        <input className="m-1 text-black w-" type="text" maxLength={detailRestrictions.maxSourceDetailedLocatonLength} placeholder={`Detailed location (max ${detailRestrictions.maxSourceDetailedLocatonLength})`} onChange={onDetailedLocationChanged}></input>
        <label ref={detailedLocationCharCountLabelRef} className="text-right"></label>
      </div>

      {/* Publication */}
      <div>
        <label className="text-lg">Publication time range</label>
        <EditSourcePublicationTimeRange />
      </div>

      {/* Authors */}
      <div className="flex flex-col m-1">
        <label className="text-lg text-left">Author(s)</label>
        {authorsReactElements}
        <div className="flex flex-row-reverse mt-auto h-full">
          <button className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded " onClick={(e) => onAddAuthorClicked(e)}>
            New author
          </button>
        </div>
      </div>

      {/* Submit source */}
      <div className="flex flex-row-reverse m-2">
        <button className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded" onClick={(e) => onSubmitSourceClick(e)}>
          Submit source
        </button>
      </div>

    </div>
  )
}
