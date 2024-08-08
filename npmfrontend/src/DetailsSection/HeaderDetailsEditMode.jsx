import { useEffect, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { editStateActions } from "../AppState/stateSliceEditPoi"


export function EditHeader() {
  const editState = useSelector((state) => state.editPoiReducer)
  const reduxDispatch = useDispatch()

  const titleInputRef = useRef()
  const tagsInputRef = useRef()
  const [tagReactElements, setTagReactElements] = useState()

  const titleTextCapture = (e) => {
    let titleValue = titleInputRef?.current.value
    console.log({ key: e.key, code: e.code })
    if (titleValue && (e.key == "Tab" || e.key == "Enter")) {
      console.log({ title: titleValue })
    }

    reduxDispatch(
      editStateActions.setTitle(titleValue)
    )
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
      reduxDispatch(
        editStateActions.setTags(tags)
      )

      // // Don't tab away from the input if the user just entered a valid tag. Often, a single tag is not alone and the user wants to enter multiple in a row (??avoid this non-standard behavior??)
      // e.preventDefault()

      e.target.value = null
    }
  }

  useEffect(() => {
    console.log({ "new tag react elements": editState.tags })

    let newTagReactElements = editState.tags?.map((t) => (
      <p className="m-1 border-2 border-gray-600" key={t}>{t}</p>
    ))
    setTagReactElements(newTagReactElements)
  }, [editState.tags])

  return (
    <div className="flex flex-col">
      {/* Title */}
      <input ref={titleInputRef} className="m-2 text-black text-2xl text-left" type="text" maxLength={128} placeholder="Title" onKeyDown={(e) => titleTextCapture(e)} />

      {/* Tags */}
      <div className="flex flex-row items-start border-2 border-gray-600 m-1 overflow-auto flex-wrap">
        {tagReactElements}
        <input ref={tagsInputRef} id="tagsInput" className="m-2 text-black text-left" type="text" placeholder="Tag (tab to complete)" onKeyDown={(e) => tagTextCapture(e)} />
      </div>
    </div>
  )
}
