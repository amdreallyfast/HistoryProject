import { DisplayPinMesh } from "../DisplayPinMesh"
import { DisplayRegionMesh } from "./DisplayRegionMesh"
import { displayPinMeshInfo, groupNames } from "../constValues"

export function DisplayOnlyRegion({ eventId, primaryLoc, regionBoundaries, globeInfo, isSelected }) {
  if (!primaryLoc) {
    return null
  }

  let primaryPinColor = isSelected ? displayPinMeshInfo.selectedPrimaryPinColor : displayPinMeshInfo.primaryPinColor
  let regionPinColor = isSelected ? displayPinMeshInfo.selectedRegionPinColor : displayPinMeshInfo.regionPinColor
  let regionColor = isSelected ? displayPinMeshInfo.selectedRegionColor : displayPinMeshInfo.regionColor

  return (
    <group name={groupNames.DisplayRegionGroup}>
      {/* Primary location pin */}
      <DisplayPinMesh
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
          regionBoundaries={regionBoundaries}
          sphereRadius={globeInfo.radius}
          color={regionColor}
        />
      )}
    </group>
  )
}
