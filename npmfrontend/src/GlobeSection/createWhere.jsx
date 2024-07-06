import { ConvertLatLongToXYZ, ConvertXYZToLatLong } from "./convertLatLongXYZ"
import { v4 as uuid } from "uuid"

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
