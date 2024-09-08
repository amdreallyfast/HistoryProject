import { useEffect, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { editStateActions } from "../AppState/stateSliceEditPoi"
import { detailRestrictions } from "../GlobeSection/constValues"
import { convertTimeRangeToGregorianYearMonthDay, convertTimeToGregorianYearMonthDay } from "./convertTimeRangeToString"

// author: {
//   "id": <guid>,
//   "name": "text"
// }
export function SingleAuthorEditMode({ author, authorEditedCallback, authorDeletedCallback }) {
  // if (!deleteMeCallback) {
  //   throw new Error("'deleteMeCallback' required")
  // }

  // console.log({ "edit mode?": author.name ? false : true })
  // let thing = author.name ? false : true

  const [editing, setEditing] = useState(author.name ? false : true)

  // console.log({ "editing?": editing })
  const [authorName, setAuthorName] = useState(author.name)
  const [reactElement, setReactElements] = useState()

  const authorInputRef = useRef()
  const authorCharCountLabelRef = useRef()

  // // Set default text input when the input reference becomes available because 
  // // <input value="..."/> locks up the input. It isn't supposed to; according to all the HTML documentation that I've found, "value" is supposed to be the default, and yet everything that I've experienced says that it locks up the input.
  // useEffect(() => {
  //   console.log({ "SingleAuthorEditMode.useEffect.authorInputRef": authorInputRef })

  //   if (!authorInputRef.current) return
  //   authorInputRef.current.value = authorName
  //   authorCharCountLabelRef.current.innerHTML = `${authorName?.length}/${detailRestrictions.maxSourceAuthorLength}`
  // }, [authorInputRef])

  // Toggle display and input text based on edit flag
  useEffect(() => {
    console.log({ "SingleAuthorEditMode.useEffect.editing": editing })

    let reactElement = null
    if (editing) {
      // TODO: drop-down auto-complete for existing author names
      const onAuthorTextChanged = (e) => {
        console.log({ "SingleAuthorEditMode.onAuthorTextChanged": e })
        console.log(e.target.value)

        let value = e.target.value
        setAuthorName(value)
        // if (!authorInputRef.current) return
        // authorInputRef.current.value = e.target.value
        authorCharCountLabelRef.current.innerHTML = `${value?.length}/${detailRestrictions.maxSourceAuthorLength}`
      }

      // onKeyDown
      const authorTextCapture = (e) => {
        console.log({ "SingleAuthorEditMode.authorTextCapture": e.key, code: e.code })

        let authorText = authorInputRef?.current.value
        if (!authorText) {
          // nothing to submit
          return
        }

        if (e.key == "Tab" || e.key == "Enter") {
          author.name = authorText
          authorEditedCallback(author)
          setEditing(false)   //??why do I even need to do this??
          e.preventDefault()
        }
        else if (e.key == "Escape") {
          setEditing(false)
          e.preventDefault()
        }
      }

      reactElement = (
        <div className="flex flex-col">
          {/* Input */}
          <input ref={authorInputRef}
            className="m-1 text-black text-left"
            type="text"
            defaultValue={authorName}
            maxLength={detailRestrictions.maxSourceAuthorLength}
            placeholder={`Author (tab to complete; max ${detailRestrictions.maxSourceAuthorLength}`}
            onKeyDown={(e) => authorTextCapture(e)}
            onChange={(e) => onAuthorTextChanged(e)}>
          </input>

          {/* Cancel button and char count*/}
          <div className="flex flex-row-reverse">
            <button className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-2 mx-1 rounded " onClick={(e) => setEditing(false)}>
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
  }, [editing])

  return (
    <div className="m-1 border-2 border-gray-600">
      {reactElement}
    </div>
  )
}
