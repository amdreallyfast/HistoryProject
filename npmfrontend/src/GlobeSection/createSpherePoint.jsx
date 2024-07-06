import { ConvertLatLongToXYZ, ConvertXYZToLatLong } from "./convertLatLongXYZ"
import { v4 as uuid } from "uuid"

export function createSpherePointFromXYZ(x, y, z, sphereRadius) {
  // console.log({ msg: "createSpherePointFromXYZ", x, y, z })
  const [rescaledX, rescaledY, rescaledZ] = rescaleToRadius(x, y, z, sphereRadius)
  const [lat, long] = ConvertXYZToLatLong(rescaledX, rescaledY, rescaledZ, sphereRadius)
  let identifiedSpherePoint = {
    id: uuid(),
    x: rescaledX,
    y: rescaledY,
    z: rescaledZ,
    lat,
    long,
  }
  return identifiedSpherePoint
}

export function createSpherePointFromLatLong(lat, long, sphereRadius) {
  // console.log({ msg: "createSpherePointFromLatLong", lat, long })
  const [x, y, z] = ConvertLatLongToXYZ(lat, long, sphereRadius)
  const [rescaledX, rescaledY, rescaledZ] = rescaleToRadius(x, y, z, sphereRadius)
  let identifiedSpherePoint = {
    id: uuid(),
    x: rescaledX,
    y: rescaledY,
    z: rescaledZ,
    lat,
    long,
  }
  return identifiedSpherePoint
}

// Use to correct for 32bit float rounding errors accumulated by transformations.
function rescaleToRadius(x, y, z, sphereRadius) {
  // Re-scale coordinates due to slowly accumulating precision loses with 32bit float.
  let xSq = x * x
  let ySq = y * y
  let zSq = z * z
  let sum = xSq + ySq + zSq
  let currLen = Math.sqrt(sum)
  let scale = sphereRadius / currLen
  let rescaledX = x * scale
  let rescaledY = y * scale
  let rescaledZ = z * scale
  return [rescaledX, rescaledY, rescaledZ]
}