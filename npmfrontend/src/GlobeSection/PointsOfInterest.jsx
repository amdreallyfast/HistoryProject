import { PointOfInterest } from "./PointOfInterest"

export function PointsOfInterest({ displayItemsJson, globePos, globeRadius }) {
  const points = displayItemsJson?.map((poiInfoJson, index) => (
    <PointOfInterest key={index} globePos={globePos} globeRadius={globeRadius} poiInfoJson={poiInfoJson} />
  ))
  return (<>
    <group name="PoiGroup">
      {points}
    </group>
  </>)
}
