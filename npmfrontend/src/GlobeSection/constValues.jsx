import { Vector3 } from "three"

export const globeInfo = {
  pos: new Vector3(0, 0, 0),
  radius: 5,

  // Let the rendered region sit a little above the surface of the globe so that it doesn't 
  // interfere with the surface.
  regionRadius: 5.2
}

export const meshNames = {
  Stars: "Stars",

  //??used??
  PoiPin: "PoiPin",

  WherePin: "WherePin",
  RegionPoint: "RegionPoint",

  Globe: "Globe",
  GlobeAtmosphere: "GlobeAtmosphere"
}

export const groupNames = {
  PoiGroup: "PoiGroup",
  EditRegionGroup: "EditRegionGroup",
  GlobeGroup: "GlobeGroup"
}
