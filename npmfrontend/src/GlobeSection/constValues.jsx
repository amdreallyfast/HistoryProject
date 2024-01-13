import { Vector3 } from "three"

export const globeInfo = {
  pos: new Vector3(0, 0, 0),
  radius: 5,

  // Let the rendered region sit a little above the surface of the globe so that it doesn't 
  // interfere with the surface.
  regionRadius: 5.2
}

export const pinMeshInfo = {
  length: 3,
  mainPinScale: 0.1,
  regionPinScale: 0.05
}

export const meshNames = {
  Stars: "Stars",

  //??used??
  PoiPin: "PoiPin",

  // identifies primary POI location
  WherePin: "WherePin",

  // in edit mode, the user-defined region boundary points become interactable meshes
  RegionPoint: "RegionPoint",

  // region mesh
  Region: "Region",

  Globe: "Globe",
  GlobeAtmosphere: "GlobeAtmosphere"
}

export const groupNames = {
  PoiGroup: "PoiGroup",
  EditRegionGroup: "EditRegionGroup",
  GlobeGroup: "GlobeGroup"
}
