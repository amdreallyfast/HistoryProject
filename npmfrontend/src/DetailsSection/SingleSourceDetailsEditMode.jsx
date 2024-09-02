import { useEffect, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { editStateActions } from "../AppState/stateSliceEditPoi"
import { detailRestrictions } from "../GlobeSection/constValues"
import { convertTimeRangeToGregorianYearMonthDay, convertTimeToGregorianYearMonthDay } from "./convertTimeRangeToString"

export function SingleSourceDetailsEditMode({
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
    console.log({ "SourceDetailsEditMode.onPublicationLowerBoundYearChanged": e })
  }

  const onPublicationLowerBoundMonthChanged = (e) => {
    console.log({ "SourceDetailsEditMode.onPublicationLowerBoundMonthChanged": e })
  }

  const onPublicationLowerBoundDayChanged = (e) => {
    console.log({ "SourceDetailsEditMode.onPublicationLowerBoundDayChanged": e })
  }

  const onPublicationUpperBoundYearChanged = (e) => {
    console.log({ "SourceDetailsEditMode.onPublicationUpperBoundYearChanged": e })
  }

  const onPublicationUpperBoundMonthChanged = (e) => {
    console.log({ "SourceDetailsEditMode.onPublicationUpperBoundMonthChanged": e })
  }

  const onPublicationUpperBoundDayChanged = (e) => {
    console.log({ "SourceDetailsEditMode.onPublicationUpperBoundDayChanged": e })
  }

  const onSubmitSourceClick = (e) => {
    console.log({ "SourceDetailsEditMode.onSubmitSourceClick": e })
    submitCallback({
      things: "and such"
    })
  }

  // Title
  const [title, setTitle] = useState(startingTitle)
  const titleCharCountLabelRef = useRef()
  useEffect(() => {
    console.log({ "SourceDetailsEditMode.useEffect.title": title })
    if (!titleCharCountLabelRef.current) return
    titleCharCountLabelRef.current.innerHTML = `${title?.length}/${detailRestrictions.maxSourceTitleLength}`
  }, [title, titleCharCountLabelRef.current])

  const onTitleChanged = (e) => {
    console.log({ "SourceDetailsEditMode.onTitleChanged": e })
    setTitle(e.target.value)
  }

  // ISBN
  const [isbn, setIsbn] = useState(startingIsbn)
  const isbnCharCountLabelRef = useRef()
  useEffect(() => {
    console.log({ "SourceDetailsEditMode.useEffect.isbn": isbn })
    isbnCharCountLabelRef.current.innerHTML = `${isbn?.length}/${detailRestrictions.maxSourceIsbnLength}`
  }, [isbn, isbnCharCountLabelRef.current])

  const onISBNChanged = (e) => {
    console.log({ "SourceDetailsEditMode.onISBNChanged": e })
    setIsbn(e.target.value)
  }

  // Detailed location (optional; ex: "Chap 3, p. 87")
  const [detailedLocation, setDetailedLocation] = useState(startingDetailedLocation)
  const detailedLocationCharCountLabelRef = useRef()
  useEffect(() => {
    console.log({ "SourceDetailsEditMode.useEffect.detailedLocation": detailedLocation })
    if (!detailedLocationCharCountLabelRef.current) return
    detailedLocationCharCountLabelRef.current.innerHTML = `${detailedLocation?.length}/${detailRestrictions.maxSourceDetailedLocatonLength}`
  }, [detailedLocation, detailedLocationCharCountLabelRef.current])

  const onDetailedLocationChanged = (e) => {
    console.log({ "SourceDetailsEditMode.onDetailedLocationChanged": e })
    setDetailedLocation(e.target.value)
  }

  const authorInputRef = useRef()
  // TODO: drop-down auto-complete for existing author names
  const onAuthorTextChanged = (e) => {
    console.log({ "SourceDetailsEditMode.onDetailedLocationChanged": e })
  }

  // onKeyDown
  const authorTextCapture = (e) => {
    console.log({ "SourceDetailsEditMode.authorTextCapture": e })

    let authorText = authorInputRef?.current.value
    //??code for "Enter"??
    if (authorText && e.code == "Tab") {
      // Take unique combination.
      // Note: Make a copy before workng with the existing state.
      let authors = sourceDetailsRef.current.authors
      authors.push(authorText),
        sourceDetailsRef.current.authors = [...new Set(authors)]
    }
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
    <div className="border-2 border-grey-600">
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



      {/* Authors */}




      {/* Publication time range
      TODO: move to it's own "when" component so that I can re-use it for the event itself
       */}
      <div className="flex flex-col items-start m-1 border-2 border-grey-600">
        <label className="text-lg">Publication time range</label>

        <div className="flex flex-col items-start">
          <label ref={publicationLowerBoundDateLabelRef}>Lower Bound (----/--/--)</label>
          <div className="flex flex-row items-start">
            <input className="m-1 text-black w-1/4" type="number" placeholder="Year" onChange={onPublicationLowerBoundYearChanged}></input>
            <input className="m-1 text-black w-1/4" type="number" placeholder="Month" onChange={onPublicationLowerBoundMonthChanged}></input>
            <input className="m-1 text-black w-1/4" type="number" placeholder="Day" onChange={onPublicationLowerBoundDayChanged}></input>
          </div>
        </div>

        <div className="flex flex-col items-start">
          <label ref={publicationLowerBoundDateLabelRef}>Upper Bound (----/--/--)</label>
          <div className="flex flex-row items-start">
            <input className="m-1 text-black w-1/4" type="number" placeholder="Year" onChange={onPublicationUpperBoundYearChanged}></input>
            <input className="m-1 text-black w-1/4" type="number" placeholder="Month" onChange={onPublicationUpperBoundMonthChanged}></input>
            <input className="m-1 text-black w-1/4" type="number" placeholder="Day" onChange={onPublicationUpperBoundDayChanged}></input>
          </div>
        </div>

      </div>

      {/* Submit source */}
      <div className="flex flex-row-reverse mt-auto h-full">
        <button className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded " onClick={(e) => onSubmitSourceClick(e)}>
          Submit source
        </button>
      </div>

    </div>
  )
}
