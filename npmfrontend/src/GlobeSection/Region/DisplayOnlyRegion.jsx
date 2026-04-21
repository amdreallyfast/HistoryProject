import { useSelector } from "react-redux"
import { DisplayPinMesh } from "../DisplayPinMesh"
import { DisplayRegionMesh } from "./DisplayRegionMesh"
import { displayPinMeshInfo, groupNames } from "../constValues"

export function DisplayOnlyRegion({ eventId, primaryLoc, regionBoundaries, globeInfo, isSelected }) {
  const hoverEventId = useSelector((state) => state.mouseInfoReducer.hoverEventId)
  const editModeOn = useSelector((state) => state.editEventReducer.editModeOn)
  const isHovered = hoverEventId === eventId

  if (!primaryLoc) {
    return null
  }

  let primaryPinColor, regionPinColor, regionColor
  if (editModeOn) {
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

      {/* Region fill mesh */}
      {regionBoundaries && regionBoundaries.length >= 3 && (
        <DisplayRegionMesh
          eventId={eventId}
          regionBoundaries={regionBoundaries}
          sphereRadius={globeInfo.radius}
          color={regionColor}
        />
      )}
    </group>
  )
}
