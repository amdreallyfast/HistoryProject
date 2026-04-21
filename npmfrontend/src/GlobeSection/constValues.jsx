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
  primaryPinScale: 0.1,
  primaryPinColor: 0xff0000,
  regionPinScale: 0.05,
  regionPinColor: 0xffd700
}

export const displayPinMeshInfo = {
  length: 3,
  primaryPinScale: 0.025,
  primaryPinColor: 0xff0000,
  regionPinScale: 0.0125,
  regionPinColor: 0xffd700,
  regionColor: 0x000ff0,

  // Highlight colors for selected event
  selectedPrimaryPinColor: 0xff4444,
  selectedRegionPinColor: 0xffee00,
  selectedRegionColor: 0x00aaff,

  // Hover colors (cursor over region/pins without clicking)
  hoverPrimaryPinColor: 0xff6600,
  hoverRegionPinColor: 0xff8800,
  hoverRegionColor: 0xff4400,
}

export const meshNames = {
  Stars: "StarsMesh",

  PrimaryPin: "PrimaryPinMesh",
  RegionBoundaryPin: "RegionBoundaryPinMesh",
  PinBoundingBox: "PinBoundingBox",

  Region: "RegionMesh",
  RegionLines: "RegionLinesMesh",

  DisplayPin: "DisplayPinMesh",
  DisplayRegion: "DisplayRegionMesh",

  Globe: "GlobeMesh",
  GlobeAtmosphere: "GlobeAtmosphereMesh"
}

export const groupNames = {
  PoiGroup: "PoiGroup",
  EditRegionGroup: "EditRegionGroup",
  DisplayRegionGroup: "DisplayRegionGroup",
  GlobeGroup: "GlobeGroup"
}
