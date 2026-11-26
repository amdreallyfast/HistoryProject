import { useEffect } from "react"
import { useThree } from "@react-three/fiber"
import * as THREE from "three"
import { globeInfo, meshNames } from "./constValues"
import { ConvertLatLongToVec3 } from "./convertLatLongXYZ"

// Test-only, read-only window into the 3D scene for Playwright: where the camera is, and where
// a mesh appears on screen, so a test can press on an exact pin and check whether the camera
// moved. Rendered only in non-production builds (see GlobeSectionMain), so production bundles
// don't contain it.
//
// Note: _Must_ be a child of react-three/fiber "Canvas".
export function GlobeTestHook() {
  const getThreeJsState = useThree((state) => state.get)

  useEffect(() => {
    // World-space point -> page (client) pixel coordinates, or null if behind the camera.
    const toClientXY = (worldPos) => {
      const { camera, gl } = getThreeJsState()
      const ndc = worldPos.clone().project(camera)
      if (ndc.z > 1) {
        return null
      }
      const rect = gl.domElement.getBoundingClientRect()
      return {
        x: rect.left + ((ndc.x + 1) / 2) * rect.width,
        y: rect.top + ((1 - ndc.y) / 2) * rect.height,
      }
    }

    const findMesh = (predicate) => {
      let found = null
      getThreeJsState().scene.traverse((obj) => {
        if (!found && obj.isMesh && predicate(obj)) {
          found = obj
        }
      })
      return found
    }

    const meshCenterClientXY = (mesh) => {
      if (!mesh) {
        return null
      }
      const center = new THREE.Box3().setFromObject(mesh).getCenter(new THREE.Vector3())
      return toClientXY(center)
    }

    window.__globeTest = {
      cameraPosition() {
        const p = getThreeJsState().camera.position
        return { x: p.x, y: p.y, z: p.z }
      },
      // The point the camera orbits around (OrbitControls target). Pan moves it together with
      // the camera; zoom changes the camera's distance to it.
      cameraTarget() {
        const t = getThreeJsState().controls?.target
        return t ? { x: t.x, y: t.y, z: t.z } : null
      },
      // Screen position of an editable pin, by its location id (the id on its
      // `region-location-row` in the Where panel).
      pinClientXY(locationId) {
        return meshCenterClientXY(findMesh(
          (m) => m.name === meshNames.PinBoundingBox && m.userData?.locationId === locationId
        ))
      },
      // Screen position of a lat/long point on the globe's surface (e.g. inside a region).
      // Note: the region mesh can't be aimed at via its bounding box: it uses a pre-sized
      // vertex buffer, so the box doesn't match the visible shape.
      latLongClientXY(lat, long) {
        const local = ConvertLatLongToVec3(lat, long, globeInfo.radius)
        const world = local.add(new THREE.Vector3(globeInfo.pos.x, globeInfo.pos.y, globeInfo.pos.z))
        return toClientXY(world)
      },
    }
    return () => {
      delete window.__globeTest
    }
  }, [getThreeJsState])

  return null
}
