import { useMemo } from "react"
import * as THREE from "three"
import { meshNames } from "./constValues"
import { Box } from "@react-three/drei"

// Source:
//  https://karthikkaranth.me/blog/generating-random-points-in-a-sphere/#better-choice-of-spherical-coordinates
//  Then re-arranged and commented on to make more sense (to me).
// Watch video to understand:
//  Integration in Spherical Coordinates
//  https://www.youtube.com/watch?v=jBcNOkwiS6k
function randomPointInSphere(minRadius, maxRadius) {
  // Basic values for spherical coordinates: 
  //  rho     length of vector
  //  phi     vertical angle between Z axis and vector (range [0, pi])
  //  theta   horizontal angle between Z axis and vector (range [0, 2pi])
  // Note: For some reason, randomly selecting phi from a uniform distribution in the range [0, pi] makes the 
  //  stars cluster around one of the axes. The same clustering is not observed for theta, which is selected 
  //  from a uniform distribution in the range [0, 2pi]. But if I select cosPhi from a uniform distribution
  //  in the range [-1,1] and then calculate phi from that, the axis clustering for phi disappears.
  //  I don't understand, but roll with it.
  let rho = minRadius + (Math.cbrt(Math.random()) * (maxRadius - minRadius))

  let cosPhi = 2.0 * Math.random() - 1
  let phi = Math.acos(cosPhi)
  let sinPhi = Math.sin(phi)

  let theta = Math.random() * 2.0 * Math.PI
  let sinTheta = Math.sin(theta);
  let cosTheta = Math.cos(theta);

  var x = rho * sinPhi * cosTheta;
  var y = rho * sinPhi * sinTheta;
  var z = rho * cosPhi;

  return { x: x, y: y, z: z };
}

export function Stars({ debug }) {
  // console.log("Stars(): begin")

  const starsMemo = useMemo(() => {
    // console.log("Stars(): useMemo")

    let vertices = []
    let minRange = 100
    let maxRange = 300
    let numStars = 10000
    for (let i = 0; i < numStars; i++) {
      let point = randomPointInSphere(minRange, maxRange)
      vertices.push(point.x, point.y, point.z)
    }

    let valuesPerPoint = 3
    let positionAttribute = new THREE.Float32BufferAttribute(vertices, valuesPerPoint)
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute("position", positionAttribute)
    return {
      geometry: geometry
    }
  }, [])

  return (
    <>
      <points name={meshNames.Stars} geometry={starsMemo.geometry}>
        <pointsMaterial color={0xffffff} />
      </points>
    </>
  )
}
