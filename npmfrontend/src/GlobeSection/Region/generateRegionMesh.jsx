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
const triangulatePoints = (vertices) => {
  if (vertices.length < 3) {
    throw Error("Need at least 3 points to make a triangle")
  }

  let points = vertices.map((vertex, index) => {
    return {
      coord: vertex,
      vertexIndex: index
    }
  })

  let triangleIndices = []
  let lineIndicesDict = {} // Dictionary to avoid duplicate pairs
  const makeTriangle = (index1, index2, index3) => {
    // Triangle mesh
    triangleIndices.push(index1)
    triangleIndices.push(index2)
    triangleIndices.push(index3)

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
    triangleIndices,
    lineIndices
  }
}

// // Input:
// //  A: THREE.Vector3
// //  B: THREE.Vector3
// //  C: THREE.Vector3
// const subdivideTriangle = (A, B, C) => {
//   // let ABLen = (new THREE.Vector3()).subVectors(B, A).length()
//   // let midwayAB = (new THREE.Vector3()).addVectors(A, B).multiplyScalar(0.5)
//   // let midwayABLen = (new THREE.Vector3()).subVectors(midwayAB, A).length()
//   // let thingAB = ABLen / midwayABLen

//   // let ACLen = (new THREE.Vector3()).subVectors(C, A).length()
//   // let midwayAC = (new THREE.Vector3()).addVectors(A, C).multiplyScalar(0.5)
//   // let midwayACLen = (new THREE.Vector3()).subVectors(midwayAC, A).length()
//   // let thingAC = ACLen / midwayACLen

//   // let BCLen = (new THREE.Vector3()).subVectors(C, B).length()
//   // let midwayBC = (new THREE.Vector3()).addVectors(B, C).multiplyScalar(0.5)
//   // let midwayBCLen = (new THREE.Vector3()).subVectors(midwayBC, B).length()
//   // let thingBC = BCLen / midwayBCLen

//   let midAB = (new THREE.Vector3()).addVectors(A, B).multiplyScalar(0.5)
//   let midAC = (new THREE.Vector3()).addVectors(A, C).multiplyScalar(0.5)
//   let midBC = (new THREE.Vector3()).addVectors(B, C).multiplyScalar(0.5)

//   let vertices = [
//     A,      // 0
//     B,      // 1
//     C,      // 2
//     midAB,  // 3
//     midAC,  // 4
//     midBC   // 5
//   ]
//   let triangleIndices = [
//     0, 3, 4,  // A, midAB, midAC
//     1, 5, 3,  // B, midBC, midAB
//     2, 4, 5   // C, midAC, midBC
//   ]
//   let lineIndices = [
//     0, 3,   // A, midAB
//     0, 4,   // A, midAC
//     3, 4,   // midAB, midAC
//     1, 5,   // B, midBC
//     1, 3,   // B, midAB
//     5, 3,   // midBC, midAB
//     2, 4,   // C, midAC
//     2, 5,   // C, midBC
//     4, 5,   // midAC, midBC
//   ]

//   return {
//     vertices,
//     triangleIndices,
//     lineIndices
//   }
// }

// const triangleAsIs = (A, B, C) => {
//   let vertices = [A, B, C]
//   let triangleIndices = [0, 1, 2]
//   let lineIndices = [
//     0, 1, // A -> B
//     0, 2, // A -> C
//     1, 2  // B -> C
//   ]

//   return {
//     vertices,
//     triangleIndices,
//     lineIndices
//   }
// }

// const removeDuplicates = (vertices, triangleIndices, lineIndices) => {
//   vertices.forEach((vertex, index) => {
//     for (let i = index+1; i < vertices.length; i++){
//       let otherVertex = vertices[i]

//       if (vertex == otherVertex)
//     }
//   })
// }

// Input:
//  vertices: THREE.Vector3 array
//  triangleIndices: int array
//  lineIndices: int array
const subdivideMesh = (baseVertices, baseTriangleIndices) => {
  const maxLineSegmentLenSq = (0.5 * 0.5)
  // let newVertices = []
  let newVertices = baseVertices.map((value) => value)  // shallow copy
  let newTriangleIndices = []
  let newLineIndices = []

  // Avoid duplicate midpoints by using a dictionary.
  let midpointTriangleIndicesDict = {}
  const makeMidpoint = (index1, index2) => {
    let key1 = `${index1},${index2}`
    let key2 = `${index2},${index1}` // could be either key
    let vertexMidABIndex = midpointTriangleIndicesDict[key1]
    if (!vertexMidABIndex) {
      vertexMidABIndex = midpointTriangleIndicesDict[key2]
    }

    // If still no midpoint, make one.
    if (!vertexMidABIndex) {
      let A = baseVertices[index1]
      let B = baseVertices[index2]
      let mid = (new THREE.Vector3()).addVectors(A, B).multiplyScalar(0.5)
      let newVertexCount = newVertices.push(mid)
      vertexMidABIndex = newVertexCount - 1

      midpointTriangleIndicesDict[key1] = vertexMidABIndex
      midpointTriangleIndicesDict[key2] = vertexMidABIndex
    }

    return vertexMidABIndex
  }

  // Avoid duplicate lines by using a dictionary.
  let lineIndicesDict = {}
  const makeLineIndicesPair = (index1, index2) => {
    let key1 = `${index1},${index2}`
    let key2 = `${index2},${index1}`
    let pair = lineIndicesDict[key1]
    if (!pair) {
      pair = lineIndicesDict[key2]
    }

    // If still no match, make the line.
    if (!pair) {
      newLineIndices.push(index1)
      newLineIndices.push(index2)
    }
  }

  for (let i = 0; i < baseTriangleIndices.length; i += 3) {
    // for (let i = 0; i < 3; i += 3) {
    let numVerticesSoFar = newVertices.length

    // Each triangle has 3x corners, each with 1x vertex.
    let vertexAIndex = baseTriangleIndices[i + 0]
    let vertexBIndex = baseTriangleIndices[i + 1]
    let vertexCIndex = baseTriangleIndices[i + 2]

    let A = baseVertices[vertexAIndex]
    let B = baseVertices[vertexBIndex]
    let C = baseVertices[vertexCIndex]

    let ABLen = (new THREE.Vector3()).subVectors(B, A).lengthSq()
    let ACLen = (new THREE.Vector3()).subVectors(C, A).lengthSq()
    let BCLen = (new THREE.Vector3()).subVectors(C, B).lengthSq()
    let atLeastOneSegmentTooBig = (ABLen > maxLineSegmentLenSq) || (ACLen > maxLineSegmentLenSq) || (BCLen > maxLineSegmentLenSq)
    let geometry = undefined
    // if (segmentTooBig) {
    //   geometry = subdivideTriangle(A, B, C)
    // }
    // else {
    //   geometry = triangleAsIs(A, B, C)
    // }

    atLeastOneSegmentTooBig = i < 3
    if (atLeastOneSegmentTooBig) {
      // Create midpoints
      let vertexMidABIndex = makeMidpoint(vertexAIndex, vertexBIndex)
      let vertexMidACIndex = makeMidpoint(vertexAIndex, vertexCIndex)
      let vertexMidBCIndex = makeMidpoint(vertexBIndex, vertexCIndex)

      // Three new triangles
      let triangleIndices = [
        vertexAIndex, vertexMidABIndex, vertexMidACIndex,  // A, midAB, midAC
        vertexBIndex, vertexMidBCIndex, vertexMidABIndex,  // B, midBC, midAB
        vertexCIndex, vertexMidACIndex, vertexMidBCIndex   // C, midAC, midBC
      ]
      triangleIndices.forEach((value) => newTriangleIndices.push(value))

      // Lots of new lines
      makeLineIndicesPair(vertexAIndex, vertexMidABIndex)
      makeLineIndicesPair(vertexAIndex, vertexMidACIndex)
      makeLineIndicesPair(vertexMidABIndex, vertexMidACIndex)
      makeLineIndicesPair(vertexBIndex, vertexMidBCIndex)
      makeLineIndicesPair(vertexBIndex, vertexMidABIndex)
      makeLineIndicesPair(vertexMidBCIndex, vertexMidABIndex)
      makeLineIndicesPair(vertexCIndex, vertexMidACIndex)
      makeLineIndicesPair(vertexCIndex, vertexMidBCIndex)
      makeLineIndicesPair(vertexMidACIndex, vertexMidBCIndex)
    }
    else {
      // Already small enough. Take the triangle as-is.
      newTriangleIndices.push(vertexAIndex)
      newTriangleIndices.push(vertexBIndex)
      newTriangleIndices.push(vertexCIndex)

      makeLineIndicesPair(vertexAIndex, vertexBIndex)
      makeLineIndicesPair(vertexAIndex, vertexCIndex)
      makeLineIndicesPair(vertexBIndex, vertexCIndex)
    }

    // i = baseTriangleIndices.length
  }

  // // Get line indices
  // // Note: Have to extract the unique line indices from the dictionary.
  // // Also Note: They were keyed in duplicate pairs, so skip every other one.
  // let lineIndices = []
  // const indexPairsStrArr = Object.keys(lineIndicesDict)
  // for (let i = 0; i < indexPairsStrArr.length; i += 2) {
  //   let indexPairs = indexPairsStrArr[i].split(",")
  //   lineIndices.push(indexPairs[0])
  //   lineIndices.push(indexPairs[1])
  // }

  console.log(`vertices: '${newVertices.length}'`)
  for (let i = 0; i < newLineIndices.length; i += 2) {
    let lineIndex1 = newLineIndices[i]
    let lineIndex2 = newLineIndices[i + 1]
    let vertex1 = newVertices[lineIndex1]
    let vertex2 = newVertices[lineIndex2]
    console.log(`line '${i}':`)
    // console.log(` vertex1.x: '${vertex1.x}', vertex1.y: '${vertex1.y}', vertex1.x: '${vertex1.z}'`)
    // console.log(` vertex2.x: '${vertex2.x}', vertex2.y: '${vertex2.y}', vertex2.x: '${vertex2.z}'`)
    console.log(`index: '${lineIndex1}' -> vertex: '${vertex1}'`)
    console.log(`index: '${lineIndex2}' -> vertex: '${vertex2}'`)
  }

  console.log("--------------------------------")

  return {
    vertices: newVertices,
    triangleIndices: newTriangleIndices,
    lineIndices: newLineIndices
  }
}

// Input:
//  vertices: THREE.Vector3 array
export const generateRegionMesh = (baseVertices) => {
  const baseGeometry = triangulatePoints(baseVertices)

  let baseVerticesFlattened = []
  baseVertices.forEach((value) => {
    baseVerticesFlattened.push(value.x)
    baseVerticesFlattened.push(value.y)
    baseVerticesFlattened.push(value.z)
  })
  let base = {
    vertices: baseVerticesFlattened,
    triangleIndices: baseGeometry.triangleIndices,
    lineIndices: baseGeometry.lineIndices
  }

  const subdividedGeometry = subdivideMesh(baseVertices, baseGeometry.triangleIndices)

  // Split the vertices into their x, y, z values, then rescale the indices accordingly to point 
  // at the first item in the set.
  let verticesFlattened = []
  subdividedGeometry.vertices.forEach((value) => {
    verticesFlattened.push(value.x)
    verticesFlattened.push(value.y)
    verticesFlattened.push(value.z)
  })
  let triangleIndicesRescaled = subdividedGeometry.triangleIndices.map((value) => value)
  let lineIndicesRescaled = subdividedGeometry.lineIndices.map((value) => value)

  let subdivded = {
    vertices: verticesFlattened,
    triangleIndices: triangleIndicesRescaled,
    lineIndices: lineIndicesRescaled
  }
  return subdivded
}


// TODO: ??put main function at the top and then organize down??