import { Vector3 } from "three"

export const globeInfo = {
  pos: new Vector3(0, 0, 0),
  radius: 5,

  // Let the rendered region sit a little above the surface of the globe so that it doesn't 
  // interfere with the surface.
  regionRadius: 5.05
}

export const meshNames = {
  Stars: "Stars",
  PoiPin: "PoiPin",
  LatLongPin: "LatLongPin",
  Globe: "Globe",
  GlobeAtmosphere: "GlobeAtmosphere"
}

export const groupNames = {
  PoiGroup: "PoiGroup",
  GlobeGroup: "GlobeGroup"
}
