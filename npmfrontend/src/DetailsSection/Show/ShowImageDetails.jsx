import { useSelector } from "react-redux";

export function ImageDetails() {
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
