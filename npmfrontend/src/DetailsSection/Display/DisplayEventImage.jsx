import { useSelector } from "react-redux";
import { useEventImageDataUrl } from "../../api/useEventImageDataUrl";

export function DisplayEventImage() {
  const selectedEventState = useSelector((state) => state.selectedEventReducer)
  // Revisions from the history list carry only an image Id; fetch the image on demand.
  const image = useEventImageDataUrl(selectedEventState.imageId, selectedEventState.imageDataUrl)

  return (
    <div>
      {image.dataUrl ?
        <img data-testid="display-event-image" style={{ "maxWidth": "100%", "maxHeight": "200px", display: "block", margin: "auto" }} src={image.dataUrl} alt="ERROR: Bad dataUrl." />
        : image.loading ?
          <span data-testid="display-event-image-loading">Loading image…</span>
          : image.error ?
            <span>{"Couldn't load the image."}</span>
            :
            <span>No image</span>
      }
    </div>
  )
}
