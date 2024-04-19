import { ConvertLatLongToXYZ, ConvertXYZToLatLong } from "./convertLatLongXYZ"
import { v4 as uuid } from "uuid"

export function createWhere(lat, long, x, y, z, wrappedLongitude) {
  // console.log({ msg: "createWhere", lat, long, x, y, z })
  let where = { id: uuid(), lat, long, x, y, z, wrappedLongitude }
  return where
}

export function createWhereObjFromXYZ(x, y, z, sphereRadius) {
  // console.log({ msg: "createWhereFromXYZ", x, y, z })
  const [lat, long] = ConvertXYZToLatLong(x, y, z, sphereRadius)
  let where = { id: uuid(), lat, long, x, y, z }
  return where
}

export function createWhereFromLatLong(lat, long, sphereRadius) {
  // console.log({ msg: "creacreateWhereFromLatLongteWhere", lat, long })
  const [x, y, z] = ConvertLatLongToXYZ(lat, long, sphereRadius)
  let where = { id: uuid(), lat, long, x, y, z }
  return where
}

// export function updateWhereWithXYZ(where, x, y, z, sphereRadius) {
//   const [newLat, newLong] = ConvertXYZToLatLong(x, y, z, sphereRadius)
//     where.lat= newLat,
//     where.long= newLong,
//     where.x = x,
//     where.y = y,
//     where.z = z

//   return where
// }

