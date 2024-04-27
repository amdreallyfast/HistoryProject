import { useEffect } from "react"
import { ConvertLatLongToVec3 } from "../convertLatLongXYZ"


export function DisplayOnlyRegion({ poiId, lat, long, globeInfo }) {
  // TODO:
  //  once I have an array of searchable POIs, get rid of "lat, long" inputs, search the POIs for this ID, and extract the necessary data

  // TODO:
  //  Show 2x regions and compute intersection


  useEffect(() => {
    console.log({ msg: "DisplayOnlyRegion()/useEffect()", value: null })
  }, [])

  let where = ConvertLatLongToVec3(lat, long, globeInfo.radius)

  return (
    <>
      <PinMesh name={meshNames.PoiPrimaryLocationPin} where={where} globeInfo={globeInfo} lookAt={globeInfo.pos} />
    </>
  )
}
