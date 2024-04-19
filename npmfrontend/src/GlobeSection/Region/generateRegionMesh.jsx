import * as THREE from "three"

// Input:
//  A: THREE.Vector3
//  B: THREE.Vector3
//  C: THREE.Vector3
const isEar = (A, B, C) => {
  // Use the right-hand rule to determine if v1 -> v2 -> v3 is:
  //  <180deg when viewed from above (cross product points into space)
  //  or
  //  >180deg when viewed from above (cross product points into the earth)
  let BA = (new THREE.Vector3()).subVectors(A, B)
  let BC = (new THREE.Vector3()).subVectors(C, B)
  let crossProduct = (new THREE.Vector3()).crossVectors(BC, BA)
  let crossProductPoint = (new THREE.Vector3()).addVectors(B, crossProduct)

  // Right-hande rule points up?
  let convex = crossProductPoint.lengthSq() > B.lengthSq()
  return convex
}

// Note: Don't worry about the point being "out of plane" because, at this point in the 
// calculation, all the points are expected to be on exactly the same plane.
// Input:
//  p: THREE.Vector3
//  A: THREE.Vector3
//  B: THREE.Vector3
//  C: THREE.Vector3
const pointInCone = (p, A, B, C) => {
  // Is the point within the cone centered on B?
  let BA = (new THREE.Vector3()).subVectors(A, B).normalize()
  let BC = (new THREE.Vector3()).subVectors(C, B).normalize()
  let Bp = (new THREE.Vector3()).subVectors(p, B).normalize()
  let cosThetaCone = BA.dot(BC)
  let cosThetaPoint = BA.dot(Bp)
  return cosThetaPoint < cosThetaCone
}

// Input:
//  p: THREE.Vector3
//  A: THREE.Vector3
//  B: THREE.Vector3
//  C: THREE.Vector3
const pointInTriangle = (p, A, B, C) => {
  // Is the point within the cone starting at A?
  if (pointInCone(p, A, B, C)) {
    return true
  }
  else if (pointInCone(p, B, C, A)) {
    return true
  }
  else if (pointInCone(p, C, A, B)) {
    return true
  }
  return false
}

// Input:
//  allPoints: THREE.Vector3 array
//  A: THREE.Vector3
//  B: THREE.Vector3
//  C: THREE.Vector3
const noOtherPointsInTriangle = (allPoints, A, B, C) => {
  allPoints.forEach((point) => {
    // simple reference comparison
    let otherPoint = (point != A) && (point != B) && (point != C)
    if (otherPoint && pointInTriangle(point, A, B, C)) {
      return false
    }
  })

  return true
}

// Generate triangles from the boundary markers based on "ear clipping" algorithm
// Input:
//  vertices: THREE.Vector3 array
export const CalculateSphereRegionMeshIndices = (vertices) => {
  if (vertices.length < 3) {
    throw Error("Need at least 3 points to make a triangle")
  }

  let points = vertices.map((vertex, index) => {
    return {
      coord: vertex,
      vertexIndex: index
    }
  })

  let meshIndices = []
  let lineIndicesDict = {} // Dictionary to avoid duplicate pairs
  const makeTriangle = (index1, index2, index3) => {
    // Triangle mesh
    meshIndices.push(index1)
    meshIndices.push(index2)
    meshIndices.push(index3)

    // Lines for triangle edges
    // A -> B
    lineIndicesDict[`${index1},${index2}`] = true
    lineIndicesDict[`${index2},${index1}`] = true

    // A -> C
    lineIndicesDict[`${index1},${index3}`] = true
    lineIndicesDict[`${index3},${index1}`] = true

    // B -> C
    lineIndicesDict[`${index2},${index3}`] = true
    lineIndicesDict[`${index3},${index2}`] = true
  }

  // Ear-clipping algorithm
  let startIndex = 0
  while (points.length > 3) {
    let index1 = (startIndex + 0) % points.length
    let index2 = (startIndex + 1) % points.length
    let index3 = (startIndex + 2) % points.length

    let A = points[index1]
    let B = points[index2]
    let C = points[index3]

    let triangleIsConvex = isEar(A.coord, B.coord, C.coord)
    let triangleIsEmpty = noOtherPointsInTriangle(points.map((point) => point.coord), A.coord, B.coord, C.coord)
    if (triangleIsConvex && triangleIsEmpty) {
      makeTriangle(A.vertexIndex, B.vertexIndex, C.vertexIndex)

      // Clip off the middle point
      let before = points.slice(0, index2)
      let after = points.slice(index2 + 1, points.length)
      points = before.concat(after)

      // Begin again
      startIndex = 0
    }
    else {
      startIndex += 1
      if (startIndex > (points.length * 2)) {
        throw Error("Iterated all points twice with no triangles. Something is wrong.")
      }
    }
  }

  // Last triangle. 
  let A = points[0]
  let B = points[1]
  let C = points[2]
  makeTriangle(A.vertexIndex, B.vertexIndex, C.vertexIndex)

  // Get line indices
  // Note: Have to extract the unique line indices from the dictionary.
  // Also Note: They were keyed in duplicate pairs, so skip every other one.
  let lineIndices = []
  const indexPairsStrArr = Object.keys(lineIndicesDict)
  for (let i = 0; i < indexPairsStrArr.length; i += 2) {
    let indexPairs = indexPairsStrArr[i].split(",")
    lineIndices.push(indexPairs[0])
    lineIndices.push(indexPairs[1])
  }

  return {
    meshIndicesArr: meshIndices,
    lineIndicesArr: lineIndices
  }
}
