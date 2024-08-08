import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { editStateActions } from "../AppState/stateSliceEditPoi";
import { roundFloat } from "../RoundFloat";
import axios from "axios";
import { EditHeader } from "./EditHeader"
import { ShowHeader } from "./ShowHeader";

// TODO: move the latlong display into its own object
// TODO: move the image handling + display into its own object

export function ShowImage() {
  const selectedPoiState = useSelector((state) => state.selectedPoiReducer)

  return (
    <div>
      {selectedPoiState.imageDataUrl ?
        <img style={{ "maxWidth": "100%", "maxHeight": "200px", display: "block", margin: "auto" }} src={selectedPoiState.imageDataUrl} alt="ERROR: Bad dataUrl." />
        :
        <span>No image</span>
      }
    </div>
  )
}
