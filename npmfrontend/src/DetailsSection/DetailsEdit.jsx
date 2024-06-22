import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { editStateActions } from "../AppState/stateSliceEditPoi";
import { roundFloat } from "../RoundFloat";
import axios from "axios";

export function DetailsEdit() {
  const whereLatLongArr = useSelector((state) => state.editPoiReducer.whereLatLongArr)
  const selectedLatLong = useSelector((state) => state.editPoiReducer.selectedLatLong)
  const prevSelectedLatLong = useSelector((state) => state.editPoiReducer.prevSelectedLatLong)
  const reduxDispatch = useDispatch()

  const [latLongReactElements, setLatLongReactElements] = useState()
  const latLongHtmlClassNameNormal = "w-full text-white text-left border-2 border-gray-400 rounded-md mb-1"
  const latLongHtmlClassNameHighlighted = "w-full text-white text-left border-2 border-gray-400 rounded-md mb-1 font-bold"

  // If source array changes, re-create selectable elements.
  useEffect(() => {
    // console.log({ "DetailsEdit_useEffect_latLongChanged": whereLatLongArr.length })

    // Callback
    const onLatLongClicked = (e, latLongJson) => {
      // If already selected, de-select.
      // Note: Using bold text as a proxy for "is selected".
      if (e.target.className.includes("font-bold")) {
        reduxDispatch(editStateActions.setSelectedLatLong(null))
      }
      else {
        reduxDispatch(editStateActions.setSelectedLatLong(latLongJson.id))
      }
    }

    let htmlReactElements = whereLatLongArr?.map((latLongJson) => {
      let roundedLat = roundFloat(latLongJson.lat, 4)
      let roundedLong = roundFloat(latLongJson.long, 4)
      // console.log({ lat: roundedLat, long: roundedLong })

      // PARENTHESIS PARENTHESIS PARENTHESIS (not curly braces)
      return (
        <p id={latLongJson.id}
          key={latLongJson.id}
          className={latLongHtmlClassNameNormal}
          onClick={(e) => onLatLongClicked(e, latLongJson)}
        >
          {`${roundedLat}, ${roundedLong}`}
        </p>
      )
    })

    // Notify this component to re-render with the new values.
    setLatLongReactElements(htmlReactElements)
  }, [selectedLatLong, whereLatLongArr.length])

  // If selected latLong changes, change highlight.
  useEffect(() => {
    console.log({ "DetailsEdit_useEffect_selectedLatLongChanged": selectedLatLong })

    if (selectedLatLong) {
      let selectedHtmlElement = document.getElementById(selectedLatLong.id)
      selectedHtmlElement.className = latLongHtmlClassNameHighlighted
      // console.log({ selectedLatLong: selectedLatLong })
    }

    if (prevSelectedLatLong) {
      let prevSelectedHtmlElement = document.getElementById(prevSelectedLatLong.id)
      prevSelectedHtmlElement.className = latLongHtmlClassNameNormal
      // console.log({ prevSelectedLatLong: prevSelectedLatLong })
    }
  }, [selectedLatLong, prevSelectedLatLong])

  const onSubmitClick = (e) => {
    console.log("onSubmitClick")
    // reduxDispatch(editStateActions.endEditMode())
    axios.get("https://localhost:7121/api/HistoricalEvent/GetFirst100")
  }

  return (
    <div className="flex flex-col h-full">
      <span className="border-2 border-gray-600 bg-gray-400 m-1">
        Titleahdlfhlaskh
      </span>

      <div className="flex flex-col items-start border-2 border-gray-600 m-1 h-1/4 overflow-auto">
        {latLongReactElements}
      </div>

      {/* Use "mt-auto" to auto grow the top margin until it fills the space. 
        Source:
          https://stackoverflow.com/questions/31000885/align-an-element-to-bottom-with-flexbox
      */}
      <div className="items-start flex mt-auto ">
        <button
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded "
          onClick={(e) => onSubmitClick(e)}
        >
          Submit
        </button>
      </div>

    </div>
  )
}
