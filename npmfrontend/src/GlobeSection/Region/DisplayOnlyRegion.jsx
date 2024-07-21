import { useEffect } from "react"
import { createSpherePointFromLatLong } from "../createSpherePoint"


export function DisplayOnlyRegion({ eventId, lat, long, globeInfo }) {
  // TODO:
  //  once I have an array of searchable POIs, get rid of "lat, long" inputs, search the POIs for this ID, and extract the necessary data

  // TODO:
  //  Show 2x regions and compute intersection


  useEffect(() => {
    console.log({ msg: "DisplayOnlyRegion()/useEffect()", value: null })
  }, [])

  let location = createSpherePointFromLatLong(lat, long, globeInfo.radius)

  return (
    <>
      <PinMesh
        pinType={meshNames.PoiPrimaryLocationPin}
        spherePoint={location}
        globeInfo={globeInfo}
        lookAt={globeInfo.pos} />
    </>
  )
}
