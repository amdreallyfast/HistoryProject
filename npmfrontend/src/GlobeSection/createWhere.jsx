import { ConvertLatLongToXYZ, ConvertXYZToLatLong } from "./convertLatLongXYZ"
import { v4 as uuid } from "uuid"

export function createWhereObjFromXYZ(x, y, z, globeInfo) {
  // console.log({ msg: "createWhereFromXYZ", x: x, y: y, z: z })
  const [newLat, newLong] = ConvertXYZToLatLong(x, y, z, globeInfo.radius)
  let where = {
    id: uuid(),
    lat: newLat,
    long: newLong,
    x: x,
    y: y,
    z: z
  }

  return where
}

//??necessary??
// export function createWhereFromLatLong(lat, long, globeInfo) {
//   const [x, y, z] = ConvertLatLongToXYZ(lat, long, globeInfo.radius)
//   let where = {
//     id: uuid(),
//     lat: lat,
//     long: long,
//     x: x,
//     y: y,
//     z: z
//   }

//   return where
// }

// export function updateWhereWithXYZ(where, x, y, z, globeInfo) {
//   const [newLat, newLong] = ConvertXYZToLatLong(x, y, z, globeInfo.radius)
//     where.lat= newLat,
//     where.long= newLong,
//     where.x = x,
//     where.y = y,
//     where.z = z

//   return where
// }

