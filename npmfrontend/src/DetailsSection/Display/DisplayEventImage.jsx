import { useSelector } from "react-redux";

export function DisplayEventImage() {
  const selectedEventState = useSelector((state) => state.selectedEventReducer)

  return (
    <div>
      {selectedEventState.imageDataUrl ?
        <img data-testid="display-event-image" style={{ "maxWidth": "100%", "maxHeight": "200px", display: "block", margin: "auto" }} src={selectedEventState.imageDataUrl} alt="ERROR: Bad dataUrl." />
        :
        <span>No image</span>
      }
    </div>
  )
}
