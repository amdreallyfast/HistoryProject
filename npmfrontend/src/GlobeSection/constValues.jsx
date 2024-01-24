import { Vector3 } from "three"

export const globeInfo = {
  pos: new Vector3(0, 0, 0),
  radius: 5,

  // Let the rendered region sit a little above the surface of the globe so that it doesn't 
  // interfere with the surface.
  radiusToRegionMesh: 5.1
}

export const pinMeshInfo = {
  length: 3,
  mainPinScale: 0.1,
  mainPinColor: 0xff0000,
  regionPinScale: 0.05,
  regionPinColor: 0xffd700
}

export const meshNames = {
  Stars: "Stars",

  //??used??
  PoiPin: "PoiPin",

  // identifies primary POI location
  WherePin: "WherePin",

  // in edit mode, the user-defined region boundary points become interactable meshes
  RegionBoundaryPin: "RegionBoundaryPin",

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
