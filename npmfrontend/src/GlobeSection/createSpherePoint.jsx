import { ConvertLatLongToXYZ, ConvertXYZToLatLong } from "./convertLatLongXYZ"
import { v4 as uuid } from "uuid"

export function createSpherePointFromXYZ(x, y, z, sphereRadius) {
  // console.log({ msg: "createWhereFromXYZ", x, y, z })
  const [lat, long] = ConvertXYZToLatLong(x, y, z, sphereRadius)
  let identifiedSpherePoint = { id: uuid(), lat, long, x, y, z }
  return identifiedSpherePoint
}

export function createSpherePointFromLatLong(lat, long, sphereRadius) {
  // console.log({ msg: "createSpherePointFromLatLong", lat, long })
  const [x, y, z] = ConvertLatLongToXYZ(lat, long, sphereRadius)
  let identifiedSpherePoint = { id: uuid(), lat, long, x, y, z }
  return identifiedSpherePoint
}
