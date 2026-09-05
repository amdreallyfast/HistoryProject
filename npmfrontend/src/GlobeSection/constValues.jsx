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

// Zoom-proportional pin scaling (see pinZoomScale.js). Applied as an OBJECT scale on
// top of the baked geometry scale above, so a factor of 1.0 renders exactly as the
// pre-2026-09 fixed-size pins did.
export const pinZoomScaleInfo = {
  // The camera's initial Z (GlobeSectionMain's <PerspectiveCamera position={[0,0,25]}>),
  // so the default view yields scale 1.0 and looks unchanged.
  referenceDistance: 25,

  // 1.0 == constant apparent size. Below 1.0 the pins also shrink on screen as you
  // zoom in. Kept here as a knob so the feel can be tuned without touching call sites.
  exponent: 1.0,

  // Safety rails only. OrbitControls sets no minDistance/maxDistance, so the camera can
  // get arbitrarily close to (or far from) the globe; these stop a pin from collapsing
  // to invisible or ballooning across the screen.
  minScale: 0.15,
  maxScale: 3.0,

  // Don't rewrite the transform for sub-perceptual changes — a stationary camera should
  // cost one distanceTo per pin per frame and nothing else.
  epsilon: 0.001,
}

export const editRegionMeshInfo = {
  validColor: 0x000ff0,   // normal editable region (blue)
  errorColor: 0xff3333,   // invalid boundary (bad winding / failed triangulation)
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

  // Dim colors used when edit mode is active (globe is in focused editing state)
  dimPrimaryPinColor: 0x555555,
  dimRegionPinColor:  0x444444,
  dimRegionColor:     0x333333,
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
