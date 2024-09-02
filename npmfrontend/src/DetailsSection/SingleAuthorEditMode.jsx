import { useEffect, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { editStateActions } from "../AppState/stateSliceEditPoi"
import { detailRestrictions } from "../GlobeSection/constValues"
import { convertTimeRangeToGregorianYearMonthDay, convertTimeToGregorianYearMonthDay } from "./convertTimeRangeToString"

export function SingleAuthorEditMode({ startingText }) {
  const [editing, setEditing] = useState(startingText ? false : true)
  const [text, setText] = useState(startingText)
  const [reactElement, setReactElements] = useState()
  const authorInputRef = useRef()
  const authorCharCountLabelRef = useRef()

  useEffect(() => {
    console.log({ "SingleAuthorEditMode.useEffect.text": text })

    let reactElement = null
    if (text) {
      reactElement = (<p className="text-left w-1/4" key={text}>{text}</p>)
    }

    setReactElements(reactElement)
  }, [text])

  // TODO: drop-down auto-complete for existing author names
  const onAuthorTextChanged = (e) => {
    console.log({ "SingleSourceDetailsEditMode.onDetailedLocationChanged": e })
  }

  // onKeyDown
  const authorTextCapture = (e) => {
    console.log({ "SingleSourceDetailsEditMode.authorTextCapture": e })

    let authorText = authorInputRef?.current.value
    if (authorText && (e.code == "Tab" || e.code == "Enter")) {
      setEditing(false)
      setText(authorText)
    }
  }


  // TODO: add an "edit" button and a "delete button"



  return (
    <div className="m-1 border-2 border-gray-600">
      {editing ?
        (
          <div className="flex flex-col">
            <input ref={authorInputRef}
              className="m-2 text-black text-left"
              type="text"
              maxLength={detailRestrictions.maxSourceAuthorLength}
              placeholder={`Author (tab to complete; max ${detailRestrictions.maxSourceAuthorLength}`}
              onKeyDown={(e) => authorTextCapture(e)} />
            <label ref={authorCharCountLabelRef} className="text-right"></label>
          </div>
        )
        :
        reactElement
      }
    </div>
  )
}
