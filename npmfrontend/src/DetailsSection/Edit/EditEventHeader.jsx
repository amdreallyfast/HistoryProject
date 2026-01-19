
import { useEffect, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { editStateActions } from "../../AppState/stateSliceEditPoi"
import { detailRestrictions } from "./detailRestrictions"

export function EditEventHeader() {
  const editState = useSelector((state) => state.editPoiReducer)
  const reduxDispatch = useDispatch()

  const titleInputRef = useRef()
  const tagsInputRef = useRef()
  const [tagReactElements, setTagReactElements] = useState()
  const [error, setError] = useState(null)

  // Validation function
  const isComplete = (title, tags) => {
    if (!title || title.trim() === "") {
      setError("Missing required value: 'Title'")
      return false
    }
    if (!tags || tags.length === 0) {
      setError("Must have at least one tag")
      return false
    }
    setError(null)
    return true
  }

  // Determine border color based on validation state
  const getBorderClass = () => {
    if (error) {
      return "border-red-500 border-opacity-80 border-2"
    } else {
      return "border-green-600 border-opacity-80 border-2"
    }
  }

  //??necessary function? just use 'on changed'??
  const titleTextCapture = (e) => {
    let titleValue = titleInputRef?.current.value
    console.log({ key: e.key, code: e.code })
    if (titleValue && (e.key == "Tab" || e.key == "Enter")) {
      console.log({ title: titleValue })
    }

    reduxDispatch(editStateActions.setTitle(titleValue))
    isComplete(titleValue, editState.tags)
  }

  // Tab complete for tags
  const tagTextCapture = (e) => {
    // console.log({ "tagTextCapture": e })

    let tagValue = tagsInputRef?.current.value
    if (tagValue && e.code == "Tab") {
      // Take unique combination.
      // Note: Make a copy before working with the existing state.
      let tags = []
      for (let i = 0; i < editState.tags?.length; i++) {
        tags.push(editState.tags[i])
      }
      tags.push(tagValue)
      tags = [...new Set(tags)]
      tags.sort()
      reduxDispatch(editStateActions.setTags(tags))

      // // Don't tab away from the input if the user just entered a valid tag. Often, a single tag is not alone and the user wants to enter multiple in a row (??avoid this non-standard behavior??)
      // e.preventDefault()

      e.target.value = null
    }
  }

  useEffect(() => {
    console.log({ "new tag react elements": editState.tags })

    let newTagReactElements = editState.tags?.map((t) => (
      <p className="mt-1 mr-1 border-2 border-gray-600" key={t}>{t}</p>
    ))
    setTagReactElements(newTagReactElements)
    isComplete(titleInputRef?.current?.value, editState.tags)
  }, [editState.tags])

  return (
    <div className={`flex flex-col m-1 rounded-md ${getBorderClass()}`}>
      {/* Title */}
      <input ref={titleInputRef} className="m-1 text-black text-2xl text-left" type="text" maxLength={detailRestrictions.maxTitleLength} placeholder="Title" onKeyDown={(e) => titleTextCapture(e)} />

      {/* Tags */}
      <div className="flex flex-row items-start m-1 overflow-auto flex-wrap">
        {tagReactElements}
        <input ref={tagsInputRef} id="tagsInput" className="mt-1 mr-1 text-black text-left" type="text" maxLength={detailRestrictions.maxTagLength} placeholder="Tag (tab to complete)" onKeyDown={(e) => tagTextCapture(e)} />
      </div>

      {/* Error display */}
      <label className="text-red-500 text-sm m-1 block text-left">{error}</label>
    </div>
  )
}
