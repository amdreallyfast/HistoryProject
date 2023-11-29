
export function ConvertLatLongToXYZ(lat, long, sphereRadius) {
  // console.log({ lat: lat, long: long, radius: globeRadius })

  // Move the POI box to the location on the globe indicated by lat/long.
  let latRad = (lat / 180.0) * Math.PI
  let longRad = (long / 180.0) * Math.PI

  let projectionOfRadiusOntoXZPlane = sphereRadius * Math.cos(latRad)
  let x = Math.sin(longRad) * projectionOfRadiusOntoXZPlane
  let y = Math.sin(latRad) * sphereRadius
  let z = Math.cos(longRad) * projectionOfRadiusOntoXZPlane
  // console.log({ x: x, y: y, z: z })
  // let z = 6

  return [x, y, z,]
}

export function ConvertXYZToLatLong(x, y, z, sphereRadius) {
  // Note: Camera defaults to being on the Z axis (and backed up negative). With that perspective:
  //  -X is left, +X is right
  //  -Y is down, +Y is up
  //  -Z is towards the camera, +Z is away from camera
  // That makes XZ the horizontal plane.
  const radToDeg = 180.0 / Math.PI

  // Note: The "arcus" trigonometry functions are only capable of calculating an angle on the range [0, Pi].
  //  The latitude is the verticle angle between the "earth center -> north pole" vector and the vertical 
  //  component of a point on the globe. By definition, the north pole is 0 degrees, and the 
  //  south pole is 180 degrees, and so the latitude is _always_ defined on the range [0, 180]
  //  degrees, and therefore the arcus function is always defined.
  let lenHypotenuse = sphereRadius
  let latRad = Math.asin(y / lenHypotenuse)

  // Note: In contrast, the longitude is defined as the horizontal angle between the 
  //  "earth center -> Greenwich Meridian" vector and the horizontal component of a point on the
  //  globe, and therefore it spans 360 degrees. Longitude is split into "west of the meridian" 
  //  (that is, negative) and "east of the meridian" (that is, positive), which creates 2x 180 
  //  degree halves of the earth. This globe is centered on the origin and is rotated so that the
  //  "Greenwich Meridian" vector is pointing straight down the +Z axis towards the camera. 
  //  Therefore, use the arcus function to calculate the angle on the range [0,180] degrees, and 
  //  then use the X axis' "left or right of origin" to determine "west" or "east".
  let lenHypotenuseProjectionOntoXZPlane = lenHypotenuse * Math.cos(latRad)
  let longRad = Math.acos(z / lenHypotenuseProjectionOntoXZPlane)
  longRad = longRad * (x < 0 ? -1 : 1)

  // console.log({ x: x, y: y, z: z, lat: latRad * radToDeg, long: longRad * radToDeg })
  return [
    latRad * radToDeg,
    longRad * radToDeg,
  ]
}