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

// Input:
//  vertices: THREE.Vector3 array
//  triangleIndices: int array
//  lineIndices: int array
const subdivideMesh = (baseVertices, baseTriangleIndices) => {
  const maxLineSegmentLenSq = (0.5 * 0.5)
  // let newVertices = []
  let newVertices = baseVertices.map((value) => value)  // shallow copy
  let vertices = baseVertices.map((value) => value)  // begin as a shallow copy of the starting vertices
  let triangleIndexArrays = []
  let lineIndexArrays = []
  let newTriangleIndices = []
  let newLineIndices = []

  // Avoid duplicate midpoints by using a dictionary.
  // TODO: 
  //  dict[[index1,index2]] = [x,y,z]
  // TODO: Skip ThreeJs.Vector3 and just work with straight x,y,z
  let midpointTriangleIndicesDict = {}
  const makeMidpointIfNotExists = (vertexAIndex, vertexBIndex) => {
    let key1 = `${vertexAIndex},${vertexBIndex}`
    let key2 = `${vertexBIndex},${vertexAIndex}` // could be either key
    let vertexMidABIndex = midpointTriangleIndicesDict[key1]
    if (!vertexMidABIndex) {
      vertexMidABIndex = midpointTriangleIndicesDict[key2]
      if (!vertexMidABIndex) {
        // No midpoint on record. Make one.
        let A = vertices[vertexAIndex]
        let B = vertices[vertexBIndex]
        let mid = (new THREE.Vector3()).addVectors(A, B).multiplyScalar(0.5)
        let newVertexCount = vertices.push(mid)
        vertexMidABIndex = newVertexCount - 1

        midpointTriangleIndicesDict[key1] = vertexMidABIndex
        midpointTriangleIndicesDict[key2] = vertexMidABIndex
      }
    }

    return vertexMidABIndex
  }

  // Avoid duplicate lines by using a dictionary.
  let lastLineIndex = undefined
  let lineIndicesDict = {}
  const addNewLineSegmentIfNotExists = (index) => {
    let key1 = `${lastLineIndex},${index}`
    let key2 = `${index},${lastLineIndex}`
    let pair = lineIndicesDict[key1]
    if (!pair) {
      pair = lineIndicesDict[key2]
      if (!pair) {
        newLineIndices.push(index)
        lastLineIndex = index
      }
    }
  }

  const triangleEdgeTooLong = (vertexAIndex, vertexBIndex, vertexCIndex, maxEdgeLength) => {
    let A = vertices[vertexAIndex]
    let B = vertices[vertexBIndex]
    let C = vertices[vertexCIndex]

    let ABLenSq = (new THREE.Vector3()).subVectors(B, A).lengthSq()
    let ACLenSq = (new THREE.Vector3()).subVectors(C, A).lengthSq()
    let BCLenSq = (new THREE.Vector3()).subVectors(C, B).lengthSq()
    let maxEdgeLengthSq = maxEdgeLength * maxEdgeLength
    let tooLong = (ABLenSq > maxEdgeLengthSq) || (ACLenSq > maxEdgeLengthSq) || (BCLenSq > maxEdgeLengthSq)
    return tooLong
  }

  const subdivideTriangle = (vertexAIndex, vertexBIndex, vertexCIndex) => {
    let triangles = []
    let lines = []

    // Create midpoints
    let vertexMidABIndex = makeMidpointIfNotExists(vertexAIndex, vertexBIndex)
    let vertexMidACIndex = makeMidpointIfNotExists(vertexAIndex, vertexCIndex)
    let vertexMidBCIndex = makeMidpointIfNotExists(vertexBIndex, vertexCIndex)

    // Three new triangles
    triangles.push([vertexAIndex, vertexMidABIndex, vertexMidACIndex])  // A, midAB, midAC
    triangles.push([vertexBIndex, vertexMidBCIndex, vertexMidABIndex])  // B, midBC, midAB
    triangles.push([vertexCIndex, vertexMidACIndex, vertexMidBCIndex])  // C, midAC, midBC

    // New lines
    lines.push([vertexAIndex, vertexMidACIndex])
    lines.push([vertexMidACIndex, vertexCIndex])
    lines.push([vertexCIndex, vertexMidBCIndex])
    lines.push([vertexMidBCIndex, vertexMidACIndex])
    lines.push([vertexMidACIndex, vertexMidABIndex])
    lines.push([vertexMidABIndex, vertexMidBCIndex])
    lines.push([vertexMidBCIndex, vertexBIndex])
    lines.push([vertexBIndex, vertexMidABIndex])
    lines.push([vertexMidABIndex, vertexAIndex])

    return {
      triangles,
      lines
    }
  }


  const subdivideTriangleUntilSmallEnough = (vertexAIndex, vertexBIndex, vertexCIndex, maxEdgeLength) => {
    let triangles = []
    let lines = []
    if (triangleEdgeTooLong(vertexAIndex, vertexBIndex, vertexCIndex, maxEdgeLength)) {
      let geometry = subdivideTriangle(vertexAIndex, vertexBIndex, vertexCIndex)
      geometry.triangles.forEach((indices) => {
        let moreGeometry = subdivideTriangleUntilSmallEnough(indices[0], indices[1], indices[2], maxEdgeLength)
        for (let i = 0, n = moreGeometry.triangles.length; i < n; i++) { triangles.push(moreGeometry.triangles[i]) }
        for (let i = 0, n = moreGeometry.lines.length; i < n; i++) { lines.push(moreGeometry.lines[i]) }
      })
    }
    else {
      // No more subdivision.
      triangles.push([vertexAIndex, vertexBIndex, vertexCIndex])
      lines.push([vertexAIndex, vertexBIndex])
      lines.push([vertexBIndex, vertexCIndex])
      lines.push([vertexCIndex, vertexAIndex])
    }

    return {
      triangles,
      lines
    }
  }

  let trianglesDict = {}
  let linesDict = {}

  for (let i = 0; i < baseTriangleIndices.length; i += 3) {
    // Each triangle has 3x corners, each with 1x vertex.
    let vertexAIndex = baseTriangleIndices[i + 0]
    let vertexBIndex = baseTriangleIndices[i + 1]
    let vertexCIndex = baseTriangleIndices[i + 2]
    let maxEdgeLength = 0.5
    let geometry = subdivideTriangleUntilSmallEnough(vertexAIndex, vertexBIndex, vertexCIndex, maxEdgeLength)
    for (let i = 0, n = geometry.triangles.length; i < n; i++) { triangleIndexArrays.push(geometry.triangles[i]) }
    for (let i = 0, n = geometry.lines.length; i < n; i++) { lineIndexArrays.push(geometry.lines[i]) }
    // for (let i = 0, n = geometry.triangles.length; i < n; i++) { trianglesDict[geometry.triangles[i]] = true }
    // for (let i = 0, n = geometry.lines.length; i < n; i++) { linesDict[geometry.lines[i]] = true }
  }

  // Flatten the vertices into their x, y, z values because OpenGL takes arrays of floats, not
  // arrays of ThreeJs Vector3.
  let flattenedVertices = []
  for (let i = 0, n = vertices.length; i < n; i++) {
    flattenedVertices.push(vertices[i].x)
    flattenedVertices.push(vertices[i].y)
    flattenedVertices.push(vertices[i].z)
  }
  let triangleIndices = triangleIndexArrays.flat()
  let lineIndices = lineIndexArrays.flat()
  return {
    vertices: flattenedVertices,
    triangles: triangleIndices,
    lines: lineIndices
  }
}

// Input:
//  vertices: THREE.Vector3 array
// Output:
//  {
//    vertices,   // array of float (3x per vertex)
//    triangles,  // array of integer (3x per triangles)
//    lines,      // array of integer (for a line strip)
//  }
export const generateRegionMesh = (baseVertices) => {
  const baseGeometry = triangulatePoints(baseVertices)

  let baseVerticesFlattened = []
  baseVertices.forEach((value) => {
    baseVerticesFlattened.push(value.x)
    baseVerticesFlattened.push(value.y)
    baseVerticesFlattened.push(value.z)
  })

  const subdividedGeometry = subdivideMesh(baseVertices, baseGeometry.triangleIndices)
  return {
    vertices: subdividedGeometry.vertices,
    triangleIndices: subdividedGeometry.triangles,
    lineIndices: subdividedGeometry.lines
  }
}


// TODO: ??put main function at the top and then organize down??