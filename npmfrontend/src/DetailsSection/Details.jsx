// import { useQuery } from "@tanstack/react-query"
// import { useEffect, useState } from "react"
// import { useDispatch, useSelector } from "react-redux"
// import { editStateActions } from "../AppState/stateSliceEditPoi"
// import { reduce } from "lodash"

// async function fetchImage(url) {
//   let response = await fetch(url)
//   if (!response.ok) {
//     throw Error(`${response.status} (${response.statusText}): '${response.url}'`)
//   }
//   return response.blob()
// }

// export function DetailsDisplay({ }) {
//   const selectedPoi = useSelector((state) => state.poiReducer.selectedPoi)
//   const reduxDispatch = useDispatch()

//   let title = selectedPoi?.name.official
//   let description = selectedPoi?.flags.alt

//   // Note: Set the selectedPoi as a dependency so that the query does not run until the value is 
//   // not null.
//   const fetchImageQuery = useQuery({
//     queryKey: ["getFlagImg", selectedPoi],
//     queryFn: () => fetchImage(selectedPoi?.flags.svg),
//     enabled: !!selectedPoi
//   })
//   console.log({
//     status: fetchImageQuery.status,
//     fetching: fetchImageQuery.isFetching,
//     error: fetchImageQuery.error,
//     data: fetchImageQuery.data
//   })

//   let imageHtml = (<h1>No flag</h1>)
//   if (fetchImageQuery.isLoading && !fetchImageQuery.isFetching) {
//     // Idle query. It seems that "loading" is the default state, but only means that it is actually loading when combined with "isFetching" == true.
//     imageHtml = (<h1>Nothing selected</h1>)
//   }
//   else if (fetchImageQuery.isLoading) {
//     // console.log({ fetchImageQuery: "Loading" })
//     //??is this the default state? why does it say "loading" when there the query isn't running??
//     imageHtml = (<h1>Loading...</h1>)
//   }
//   else if (fetchImageQuery.isError) {
//     // console.log({ fetchImageQuery: "Error" })
//     imageHtml = (<pre>{JSON.stringify(fetchImageQuery.error)}</pre>)
//   }
//   else if (fetchImageQuery.isFetching) {
//     // console.log({ fetchImageQuery: "Refreshing" })
//     imageHtml = (<h1>Refreshing...</h1>)
//   }
//   else if (fetchImageQuery.isSuccess) {
//     // console.log({ fetchImageQuery: "Success. Setting image" })
//     // console.log({ "fetchImageQuery.data": fetchImageQuery.data })
//     let dataUrl = URL.createObjectURL(fetchImageQuery.data)
//     // console.log({ dataUrl: dataUrl })

//     // ??why will the Sweden flag not render unless I specify the width??
//     imageHtml = (<img src={dataUrl} />)
//   }
//   else {
//     console.log({ msg: "DetailsSection()", fetchImageQuery: "??something else going on??" })
//   }

//   return (
//     <div className='flex flex-col h-full border-2 border-green-500 overflow-auto items-start'>
//       <h1 className='m-1'>
//         {title}
//       </h1>
//       <div className='m-1'>
//         {imageHtml}
//       </div>
//       <p className='m-1 break-all text-left'>
//         {description}
//       </p>

//       <button
//         className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
//         onClick={() => reduxDispatch(editStateActions.startEditMode())}
//       >
//         Edit
//       </button>
//     </div>
//   )
// }

import { useSelector } from "react-redux"
import axios from "axios";
import { HeaderDetailsEditMode } from "./HeaderDetailsEditMode";
import { ImageDetailsEditMode } from "./ImageDetailsEditMode";
import { RegionDetailsEditMode } from "./RegionDetailsEditMode";
import { HeaderDetails } from "./HeaderDetails";
import { ImageDetails } from "./ImageDetails";
import { RegionDetails } from "./RegionDetails";


export function Details({ }) {
  const editModeOn = useSelector((state) => state.editPoiReducer.editModeOn)

  const onSubmitClick = (e) => {
    console.log("onSubmitClick")
    // reduxDispatch(editStateActions.endEditMode())
    let data = {
      eventId: editState.eventId,
      imageDataUrl: editState.imageDataUrl
    }
    axios.post("https://localhost:7121/api/HistoricalEvent/Create2", data)
      .then((response) => {
        console.log({ response })
      })
      .catch((error) => {
        console.error({ msg: "oh no!", error })
      })
      .finally(() => {
        console.log("finally")
      })
  }

  // TODO: RevisionAuthor
  // TODO: Sources
  // TODO: Summary
  // TODO: "Edit" button in "show" mode"

  return (
    <>
      {editModeOn ?
        (
          <div className="flex flex-col h-full">
            <HeaderDetailsEditMode />
            <ImageDetailsEditMode />
            <RegionDetailsEditMode />

            {/* Revision author fixed by whoever is logged in */}
            <input className="m-2 text-black text-left" type="text" maxLength={128} placeholder="Revision author" />

            {/* Use "mt-auto" to auto grow the top margin until it fills the space. 
            Source:
              https://stackoverflow.com/questions/31000885/align-an-element-to-bottom-with-flexbox
          */}
            <div className="items-end flex mt-auto h-full">
              <button className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded " onClick={(e) => onSubmitClick(e)}>
                Submit
              </button>
            </div>
          </div>
        )
        :
        (
          <div className="flex flex-col h-full">
            <HeaderDetails />
            <ImageDetails />
            <RegionDetails />

            {/* Revision author fixed by whoever is logged in */}
            <input className="m-2 text-black text-left" type="text" maxLength={128} placeholder="Revision author" />
          </div>
        )}
    </>
  )
}