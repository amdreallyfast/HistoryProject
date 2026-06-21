import { useSelector } from "react-redux"
import { DisplayPinMesh } from "../DisplayPinMesh"
import { DisplayRegionMesh } from "./DisplayRegionMesh"
import { ErrorBoundary } from "./ErrorBoundary"
import { displayPinMeshInfo, groupNames } from "../constValues"

export function DisplayRegion({ eventId, primaryLoc, regionBoundaries, globeInfo, isSelected }) {
  const hoverEventId  = useSelector((state) => state.mouseInfoReducer.hoverEventId)
  const editModeOn    = useSelector((state) => state.editEventReducer.editModeOn)
  const editEventId   = useSelector((state) => state.editEventReducer.eventId)
  const isHovered     = hoverEventId === eventId
  const isBeingEdited = editModeOn && editEventId === eventId

  if (!primaryLoc) {
    return null
  }

  let primaryPinColor, regionPinColor, regionColor
  if (editModeOn && isBeingEdited) {
    // Ghost reference: original region shape shown in selected blue while the user edits above it.
    primaryPinColor = displayPinMeshInfo.selectedPrimaryPinColor
    regionPinColor  = displayPinMeshInfo.selectedRegionPinColor
    regionColor     = displayPinMeshInfo.selectedRegionColor
  } else if (editModeOn) {
    primaryPinColor = displayPinMeshInfo.dimPrimaryPinColor
    regionPinColor  = displayPinMeshInfo.dimRegionPinColor
    regionColor     = displayPinMeshInfo.dimRegionColor
  } else if (isSelected) {
    primaryPinColor = displayPinMeshInfo.selectedPrimaryPinColor
    regionPinColor  = displayPinMeshInfo.selectedRegionPinColor
    regionColor     = displayPinMeshInfo.selectedRegionColor
  } else if (isHovered) {
    primaryPinColor = displayPinMeshInfo.hoverPrimaryPinColor
    regionPinColor  = displayPinMeshInfo.hoverRegionPinColor
    regionColor     = displayPinMeshInfo.hoverRegionColor
  } else {
    primaryPinColor = displayPinMeshInfo.primaryPinColor
    regionPinColor  = displayPinMeshInfo.regionPinColor
    regionColor     = displayPinMeshInfo.regionColor
  }

  return (
    <group name={groupNames.DisplayRegionGroup}>
      {/* Primary location pin */}
      <DisplayPinMesh
        eventId={eventId}
        spherePoint={primaryLoc}
        globeInfo={globeInfo}
        colorHex={primaryPinColor}
        length={displayPinMeshInfo.length}
        scale={displayPinMeshInfo.primaryPinScale}
        lookAt={globeInfo.pos}
      />

      {/* Region boundary pins */}
      {regionBoundaries?.map((point, index) => (
        <DisplayPinMesh
          key={index}
          eventId={eventId}
          spherePoint={point}
          globeInfo={globeInfo}
          colorHex={regionPinColor}
          length={displayPinMeshInfo.length}
          scale={displayPinMeshInfo.regionPinScale}
          lookAt={globeInfo.pos}
        />
      ))}

      {/* Region fill mesh. Wrapped so a malformed boundary (e.g. clockwise
          winding) that makes EarClipping throw only drops this one event's fill
          mesh — the pins above stay, and the rest of the app keeps working. */}
      {regionBoundaries && regionBoundaries.length >= 3 && (
        <ErrorBoundary
          resetKeys={[regionBoundaries]}
          onError={(error) => console.error({ "DisplayRegion: skipped malformed region": { eventId, error } })}
        >
          <DisplayRegionMesh
            eventId={eventId}
            regionBoundaries={regionBoundaries}
            sphereRadius={globeInfo.radius}
            color={regionColor}
          />
        </ErrorBoundary>
      )}
    </group>
  )
}
