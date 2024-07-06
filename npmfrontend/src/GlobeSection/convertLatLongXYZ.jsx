import { Vector3 } from "three"

export function ConvertLatLongToVec3(lat, long, sphereRadius) {
  const [x, y, z] = ConvertLatLongToXYZ(lat, long, sphereRadius)
  return new Vector3(x, y, z)
}

export function ConvertLatLongToXYZ(lat, long, sphereRadius) {
  // console.log({ lat: lat, long: long, radius: sphereRadius })

  // Move the POI box to the location on the globe indicated by lat/long.
  let latRadians = (lat / 180.0) * Math.PI
  let longRadians = (long / 180.0) * Math.PI

  let projectionOfRadiusOntoXZPlane = sphereRadius * Math.cos(latRadians)
  let x = Math.sin(longRadians) * projectionOfRadiusOntoXZPlane
  let y = Math.sin(latRadians) * sphereRadius
  let z = Math.cos(longRadians) * projectionOfRadiusOntoXZPlane
  // console.log({ x: x, y: y, z: z })
  // let z = 6
  if (isNaN(x) || isNaN(y) || isNaN(z)) {
    throw new Error(`Evaluated NaN: x: '${x}', y: '${y}', z: '${z}'
    Arguments: lat: '${lat}', long: '${long}', radius: '${sphereRadius}'`)
  }

  return [x, y, z,]
}

export function ConvertXYZToLatLong(x, y, z, sphereRadius) {
  // Note: Camera defaults to being on the Z axis. With that perspective:
  //  -X is left, +X is right
  //  -Y is down, +Y is up
  //  -Z is towards the camera, +Z is away from camera
  // That makes XZ the horizontal plane.
  const radToDeg = 180.0 / Math.PI

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

  // Note: The arcsine trigonometry functions is only capable of calculating an angle 
  //  on the range [0, Pi]. The latitude is the vertical angle between the
  //  "earth center -> north pole" vector and the vertical component of a point on the globe. By 
  //  definition, the north pole is 0 degrees, and the south pole is 180 degrees, and so the 
  //  latitude is _always_ defined on the range [0, 180] degrees, and therefore the arcsine 
  //  function is always defined.
  let lenHypotenuse = sphereRadius
  let latRadians = Math.asin(rescaledY / lenHypotenuse)

  // Note: In contrast, the longitude is defined as the horizontal angle between the 
  //  "earth center -> Greenwich Meridian" vector and the horizontal component of a point on the
  //  globe, and therefore it spans 360 degrees. Longitude is split into "west of the meridian" 
  //  (that is, negative) and "east of the meridian" (that is, positive), which creates 2x 180 
  //  degree halves of the earth. This globe is centered on the origin and is rotated so that the
  //  "Greenwich Meridian" vector is pointing straight down the -Z axis towards the camera. 
  //  Therefore, use the arcus function to calculate the angle on the range [0,180] degrees, and 
  //  then use the X axis' "left or right of origin" to determine "west" or "east".
  let radiusAtY = Math.cos(latRadians) * lenHypotenuse
  let longRadians = Math.acos(rescaledZ / radiusAtY)
  longRadians = longRadians * (rescaledX < 0 ? -1 : 1)

  if (isNaN(latRadians) || isNaN(longRadians)) {
    throw new Error(`Evaluated NaN: latRadians: '${latRadians}', longRadians: '${longRadians}'
    Arguments: x: '${x}', y: '${y}', z: '${z}', radius: '${sphereRadius}'`)
  }

  // console.log({ x: x, y: y, z: z, lat: latRadians * radToDeg, long: longRadians * radToDeg })
  return [
    latRadians * radToDeg,
    longRadians * radToDeg,
  ]
}