import { useEffect, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { editStateActions } from "../AppState/stateSliceEditPoi"
import { detailRestrictions } from "../GlobeSection/constValues"
import { convertTimeRangeToGregorianYearMonthDay, convertTimeToGregorianYearMonthDay } from "./convertTimeRangeToString"

// author: {
//   "id": <guid>,
//   "name": "text"
// }
export function EditSingleAuthor({ author, authorEditedCallback, authorDeletedCallback }) {
  if (!author) {
    throw new Error("'author' required")
  }
  else if (!authorEditedCallback) {
    throw new Error("'authorEditedCallback' required")
  }
  else if (!authorDeletedCallback) {
    throw new Error("'authorDeletedCallback' required")
  }

  const [editing, setEditing] = useState(author.name ? false : true)
  const [authorName, setAuthorName] = useState(author.name)
  const [reactElement, setReactElements] = useState()

  const authorInputRef = useRef()
  const authorCharCountLabelRef = useRef()

  // onKeyDown
  const authorTextCapture = (e) => {
    console.log({ "EditSingleAuthor.authorTextCapture": e.key, code: e.code })

    let authorText = authorInputRef?.current.value
    if (!authorText) {
      // nothing to submit
      return
    }

    if (e.key == "Tab" || e.key == "Enter") {
      author.name = authorText
      authorEditedCallback(author)
      setEditing(false)   //??why do I even need to do this? why doesn't the callback creating a new component cause the "editing" state to be stuck on "true"??
      e.preventDefault()
    }
    else if (e.key == "Escape") {
      cancelEdit()
      e.preventDefault()
    }
  }

  // TODO: drop-down auto-complete for existing author names
  const onAuthorTextChanged = (e) => {
    console.log({ "EditSingleAuthor.onAuthorTextChanged": e })
    setAuthorName(e.target.value)
  }

  // Cancel
  const cancelEdit = () => {
    console.log({ "EditSingleAuthor.cancelEdit": null })

    setAuthorName(author.name)
    setEditing(false)
  }

  // Toggle display and input text based on edit flag
  useEffect(() => {
    console.log({ "EditSingleAuthor.useEffect.editing": editing })

    let reactElement = null
    if (editing) {
      reactElement = (
        <div className="flex flex-col">
          {/* Input */}
          <input ref={authorInputRef}
            className="m-1 text-black text-left"
            type="text"
            value={authorName}
            maxLength={detailRestrictions.maxSourceAuthorLength}
            placeholder={`Author (tab to complete; max ${detailRestrictions.maxSourceAuthorLength}`}
            onKeyDown={(e) => authorTextCapture(e)}
            onChange={(e) => onAuthorTextChanged(e)}>
          </input>

          {/* Cancel button and char count*/}
          <div className="flex flex-row-reverse">
            <button className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-2 mx-1 rounded " onClick={() => cancelEdit()}>
              Cancel
            </button>
            <label ref={authorCharCountLabelRef} className="text-right">{`${authorName?.length}/${detailRestrictions.maxSourceAuthorLength}`}</label>
          </div>
        </div>
      )
    }
    else {
      // Display mode with edit and delete buttons
      reactElement = (
        <div className="flex flex-col">
          {/* Buttons */}
          <div className="flex flex-row-reverse">
            {/* Delete */}
            <button type="button" className="inline-flex items-center rounded-md bg-gray-600 hover:bg-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700" onClick={(e) => authorDeletedCallback(author)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              <span className="sr-only">Icon description</span>
            </button>

            {/* Edit */}
            <button type="button" className="inline-flex items-center rounded-md bg-gray-600 hover:bg-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700" onClick={(e) => setEditing(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="butt" strokeLinejoin="bevel">
                <polygon points="16 3 21 8 8 21 3 21 3 16 16 3">
                </polygon>
              </svg>
              <span className="sr-only">Icon description</span>
            </button>
          </div>

          {/* Name */}
          <label className="text-left" key={author.id}>{authorName}</label>
        </div>
      )
    }

    setReactElements(reactElement)
  }, [editing, authorName])

  return (
    <div className="m-1 border-2 border-gray-600">
      {reactElement}
    </div>
  )
}
