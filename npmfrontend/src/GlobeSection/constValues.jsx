import { Vector3 } from "three"

export const globeInfo = {
  pos: new Vector3(0, 0, 0),
  radius: 5,

  // Let the rendered region sit a little above the surface of the globe so that it doesn't 
  // interfere with the surface.
  radiusToRegionMesh: 5.1
}

export const regionInfo = {
  defaultRegionRadius: 8
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

  // Major pin
  PoiPrimaryLocationPin: "PoiPrimaryLocationPin",

  // Minor pin
  // Note: Only visible in edit mode. These user-defined region boundary points are interactable 
  // meshes
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
