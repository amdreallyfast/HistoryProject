import * as THREE from "three"

// Shared mutable rotor for click-and-drag. Bypasses Redux for the per-frame
// rotor because routing it through dispatch + useSelector forces a re-render
// and leaves downstream useFrame consumers reading a one-frame-stale closure.
//
// Write: MouseHandler.useFrame (writes once per RAF after computing the rotor
// from cursor + mouseDown positions).
// Read: EditPinMesh.useFrame and EditRegionMesh.useFrame within the same RAF.
//
// Ordering is by R3F tree order: MouseHandler is mounted before
// EditableRegion in Scene.jsx, so its useFrame runs first within a given RAF
// and writes the latest rotor before the mesh consumers read it.
//
// Redux's editState.clickAndDrag (non-null) remains the "is a drag active"
// signal and still carries mesh identity (uuid / name / userData) for
// determining moveAllPins vs. moveThisPin. Only the per-frame
// rotorQuaternion data lives here.
//
// See claudePlans/4.RegionPinDragPerfFix.md, Step 4.
export const sharedDragRotor = {
  quaternion: new THREE.Quaternion(),
}
