
export function ConvertLatLongToXYZ(lat, long, globeRadius) {
  // console.log({ lat: lat, long: long, radius: globeRadius })

  // Move the POI box to the location on the globe indicated by lat/long.
  let latRad = (lat / 180.0) * Math.PI
  let longRad = (long / 180.0) * Math.PI

  let projectionOfRadiusOntoXZPlane = globeRadius * Math.cos(latRad)
  let x = Math.sin(longRad) * projectionOfRadiusOntoXZPlane
  let y = Math.sin(latRad) * globeRadius
  let z = Math.cos(longRad) * projectionOfRadiusOntoXZPlane
  console.log({ x: x, y: y, z: z })
  // let z = 6

  return [x, y, z,]
}

export function ConvertXYZToLatLong(x, y, z, globeRadius) {
  // Note: Camera defaults to being on the Z axis (and backed up negative). With that perspective:
  //  -X is left, +X is right
  //  -Y is down, +Y is up
  //  -Z is towards the camera, +Z is away from camera
  // That makes XZ the horizontal plane.
  const radToDeg = 180.0 / Math.PI

  //??why is this not exactly equal to globe radius??
  //let lenHypotenuse = Math.sqrt((x * x) + (y * y) + (z * z))
  let lenHypotenuse = globeRadius
  let latRad = Math.asin(y / lenHypotenuse)

  // let lenHypotenuseProjectionOntoXZPlane = Math.sqrt((x * x) + (z * z))
  let lenHypotenuseProjectionOntoXZPlane = lenHypotenuse * Math.cos(latRad)
  let longRad = Math.asin(x / lenHypotenuseProjectionOntoXZPlane)
  // console.log({ longRad: longRad })
  // if (z < 0) {
  //   longRad = longRad * -1
  // }
  // console.log(x, y, z)
  // console.log({ longRad: longRad })

  // console.log({ lat: latRad * radToDeg, long: longRad * radToDeg })


  // console.log({ point: [x, y, z], h: lenHypotenuse, hP: lenHypotenuseProjectionOntoXZPlane, lat: lat, long: long, })
  // console.log({ lat: lat, long: long })
  return [
    latRad * radToDeg,
    longRad * radToDeg,
  ]
}