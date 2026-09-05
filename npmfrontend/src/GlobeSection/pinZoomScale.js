// Zoom-proportional scale factor for globe pins.
//
// Pins are built at a fixed WORLD size (EditPinMesh.makePin bakes the size into the
// geometry), so zooming in grows them on screen exactly as fast as the gaps between
// them — zooming in never actually helps you separate crowded boundary pins. That is
// the blocker for the Subdivide feature: at the default region, 8 boundary pins sit
// ~0.55 world units apart while each pin's bounding box is ~0.17 wide, so doubling to
// 32 pins (~0.14 spacing) makes the grab targets overlap.
//
// Scaling by camera distance holds a roughly constant APPARENT size instead: the pin
// shrinks in world terms as the camera closes in, so the on-screen gaps open up and a
// dense boundary becomes editable.
//
// `exponent` tunes the feel:
//   1.0  -> exactly constant apparent size (default)
//   < 1  -> pins additionally shrink on screen as you zoom in (more aggressive)
//   0    -> disabled; always 1.0 (the pre-2026-09 fixed-world-size behavior)
export const computePinZoomScale = (cameraDistance, { referenceDistance, exponent, minScale, maxScale }) => {
  // Degenerate camera positions (at the globe center, or a bad reference) must not
  // produce NaN/Infinity scales — a NaN in a matrix silently removes the mesh.
  if (!(cameraDistance > 0) || !(referenceDistance > 0)) {
    return minScale
  }

  const raw = Math.pow(cameraDistance / referenceDistance, exponent)
  if (!Number.isFinite(raw)) {
    return minScale
  }

  return Math.min(maxScale, Math.max(minScale, raw))
}
