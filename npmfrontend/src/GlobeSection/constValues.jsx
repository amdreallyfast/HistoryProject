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
  regionPinColor: 0xffd700,

  // Radial lift: edit pins are positioned this far ABOVE the globe surface, which puts
  // them on top of the edit region mesh (editRegionMeshInfo.radiusOffset) rather than
  // level with the globe.
  //
  // Why this exists: a pin sticks out (length * pinScale) from wherever its base sits —
  // only 0.15 for a boundary pin — and zoom scaling multiplies that standoff along with
  // everything else. Based at the globe surface, a boundary pin cleared the region fill
  // by just 0.05, so any zoom factor below ~0.67 buried it under the fill. Basing the
  // pins above the fill instead makes the clearance independent of scale.
  //
  // MUST stay greater than editRegionMeshInfo.radiusOffset (asserted in pinZoomScale.test.js).
  radiusOffset: 0.12,
}

// Zoom-proportional pin scaling (see pinZoomScale.js). Applied as an OBJECT scale on
// top of the baked geometry scale above, so a factor of 1.0 renders exactly as the
// pre-2026-09 fixed-size pins did.
export const pinZoomScaleInfo = {
  // Distance at which pins render at their authored size (scale 1.0). This is the
  // TYPICAL EDITING distance, NOT the camera's initial Z of 25 — anchoring it to the
  // page-load position was the original mistake: nobody edits a region from that far
  // out, so pins spent the entire editing session at scale ~0.45 and looked tiny.
  // Calibrated by measuring the globe's limb against the 50-degree fov in a screenshot
  // of the pre-scaling build at a comfortable editing zoom, which put the camera at
  // ~11 units from the globe center. Retune HERE if pins feel wrong at your working
  // zoom — nothing else needs to change.
  referenceDistance: 11,

  // 1.0 == constant apparent size. Below 1.0 the pins also shrink on screen as you
  // zoom in. Kept here as a knob so the feel can be tuned without touching call sites.
  exponent: 1.0,

  // Rails. maxScale is deliberately tight: at constant apparent size, zooming out to the
  // page-load distance would make pins ~2.3x their authored size, big enough to cover
  // the whole region they belong to. Capping keeps them bounded when zoomed out while
  // still letting them shrink when zoomed in, which is the direction that matters for
  // editing a crowded (subdivided) boundary. minScale is just a floor so a pin can't
  // collapse to nothing if the camera gets very close.
  minScale: 0.35,
  maxScale: 1.35,

  // Don't rewrite the transform for sub-perceptual changes — a stationary camera should
  // cost one distanceTo per pin per frame and nothing else.
  epsilon: 0.001,
}

export const editRegionMeshInfo = {
  validColor: 0x000ff0,   // normal editable region (blue)
  errorColor: 0xff3333,   // invalid boundary (bad winding / failed triangulation)

  // How far above the globe surface the edit region fill floats. Raised above
  // DisplayRegionMesh's +0.01 so the raycaster hits the edit mesh first. Pins must be
  // based above this (pinMeshInfo.radiusOffset) or they render behind the fill.
  radiusOffset: 0.1,
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
