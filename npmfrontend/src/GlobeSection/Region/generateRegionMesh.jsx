import * as THREE from "three"

// Using the "ear clipping" algorithms. Vertices expected to be counterclockwise.
class EarClipping {
  #points = []
  #triangleIndices = []
  #lineIndicesDict = {} // Dictionary to avoid duplicate pairs

  constructor(vertices) {
    if (vertices.length < 3) {
      throw Error("Need at least 3 points to make a triangle")
    }

    this.#points = vertices.map((vertex, index) => {
      return {
        coord: new THREE.Vector3(vertex[0], vertex[1], vertex[2]),
        vertexIndex: index
      }
    })
    this.#triangleIndices = []
    this.#lineIndicesDict = {}

    this.geometry = {
      triangles: [],
      lines: []
    }

    this.#triangulate()
  }

  #triangulate() {
    // Ear-clipping algorithm
    let startIndex = 0
    while (this.#points.length > 3) {
      let index1 = (startIndex + 0) % this.#points.length
      let index2 = (startIndex + 1) % this.#points.length
      let index3 = (startIndex + 2) % this.#points.length

      let A = this.#points[index1]
      let B = this.#points[index2]
      let C = this.#points[index3]

      let triangleIsConvex = this.#isEar(A.coord, B.coord, C.coord)
      let triangleIsEmpty = this.#noOtherPointsInTriangle(this.#points.map((point) => point.coord), A.coord, B.coord, C.coord)
      if (triangleIsConvex && triangleIsEmpty) {
        this.#makeTriangle(A.vertexIndex, B.vertexIndex, C.vertexIndex)

        // Clip off the middle point
        let before = this.#points.slice(0, index2)
        let after = this.#points.slice(index2 + 1, this.#points.length)
        this.#points = before.concat(after)

        // Begin again
        startIndex = 0
      }
      else {
        startIndex += 1
        if (startIndex > (this.#points.length * 2)) {
          throw Error("Iterated all points twice with no triangles. Something is wrong.")
        }
      }
    }

    // Last triangle. 
    let A = this.#points[0]
    let B = this.#points[1]
    let C = this.#points[2]
    this.#makeTriangle(A.vertexIndex, B.vertexIndex, C.vertexIndex)

    // Get line indices
    // Note: Have to extract the unique line indices from the dictionary.
    // Also Note: They were keyed in duplicate pairs, so skip every other one.
    let lineIndices = []
    const indexPairsStrArr = Object.keys(this.#lineIndicesDict)
    for (let i = 0; i < indexPairsStrArr.length; i += 2) {
      let indexPairs = indexPairsStrArr[i].split(",")
      lineIndices.push([indexPairs[0], indexPairs[1]])
    }

    this.geometry = {
      triangleIndices: this.#triangleIndices,
      lineIndices: lineIndices
    }
  }

  // Input:
  //  A: THREE.Vector3
  //  B: THREE.Vector3
  //  C: THREE.Vector3
  #isEar(A, B, C) {
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

  // Input:
  //  allPoints: THREE.Vector3 array
  //  A: THREE.Vector3
  //  B: THREE.Vector3
  //  C: THREE.Vector3
  #noOtherPointsInTriangle(A, B, C) {
    this.#points.forEach((point) => {
      // simple reference comparison
      let otherPoint = (point != A) && (point != B) && (point != C)
      if (otherPoint && this.#pointInTriangle(point, A, B, C)) {
        return false
      }
    })

    return true
  }

  // Input:
  //  p: THREE.Vector3
  //  A: THREE.Vector3
  //  B: THREE.Vector3
  //  C: THREE.Vector3
  #pointInTriangle(p, A, B, C) {
    // Is the point within the cone starting at A?
    if (this.#pointInCone(p, A, B, C)) {
      return true
    }
    else if (this.#pointInCone(p, B, C, A)) {
      return true
    }
    else if (this.#pointInCone(p, C, A, B)) {
      return true
    }
    return false
  }

  // Note: Don't worry about the point being "out of plane" because, at this point in the 
  // calculation, all the points are expected to be on exactly the same plane.
  // Input:
  //  p: THREE.Vector3
  //  A: THREE.Vector3
  //  B: THREE.Vector3
  //  C: THREE.Vector3
  #pointInCone(p, A, B, C) {
    // Is the point within the cone centered on B?
    let BA = (new THREE.Vector3()).subVectors(A, B).normalize()
    let BC = (new THREE.Vector3()).subVectors(C, B).normalize()
    let Bp = (new THREE.Vector3()).subVectors(p, B).normalize()
    let cosThetaCone = BA.dot(BC)
    let cosThetaPoint = BA.dot(Bp)
    return cosThetaPoint < cosThetaCone
  }

  #makeTriangle(index1, index2, index3) {
    // Triangle mesh
    this.#triangleIndices.push([index1, index2, index3])

    // Lines for triangle edges
    // A -> B
    this.#lineIndicesDict[`${index1},${index2}`] = true
    this.#lineIndicesDict[`${index2},${index1}`] = true

    // A -> C
    this.#lineIndicesDict[`${index1},${index3}`] = true
    this.#lineIndicesDict[`${index3},${index1}`] = true

    // B -> C
    this.#lineIndicesDict[`${index2},${index3}`] = true
    this.#lineIndicesDict[`${index3},${index2}`] = true
  }
}

class MeshSubdivider {
  #triangleIndicesDict = {}
  #lineIndicesDict = {}

  #vertices = []
  #triangleIndexArrays = []
  #lineIndexArrays = []
  geometry = {
    vertices: [],   // Array of [x, y, z] arrays
    triangles: [],  // Array of [aIndex, bIndex, cIndex] arrays
    lines: [],      // Array of [aIndex, bIndex] arrays
  }

  constructor(startingVertices, startingTriangleIndexArrays, maxEdgeLength) {
    this.#vertices = startingVertices.map((vertex) => vertex) // begin as a shallow copy
    this.#triangleIndexArrays = startingTriangleIndexArrays

    this.#subdivide(maxEdgeLength)
  }

  #subdivide(maxEdgeLength) {
    for (let i = 0; i < this.#triangleIndexArrays.length; i++) {
      if (this.#triangleEdgeTooLong(i, maxEdgeLength)) {
        this.#subdivideTriangle(i)
      }
      else {
        // triangle is ok
        // console.log("ok")
        let triangleIndexes = this.#triangleIndexArrays[i]
        // this.#lineIndexArrays.push([indexArr[0], indexArr[1]])
        // this.#lineIndexArrays.push([indexArr[1], indexArr[2]])
        // this.#lineIndexArrays.push([indexArr[2], indexArr[0]])  // complete the triangle on the line strip
        this.#addLineSegmentIfNotExists(triangleIndexes[0], triangleIndexes[1])
        this.#addLineSegmentIfNotExists(triangleIndexes[1], triangleIndexes[2])
        this.#addLineSegmentIfNotExists(triangleIndexes[2], triangleIndexes[0])
      }
    }

    // Note: Eliminate the "deleted" triangle index arrays. A javascript array 
    // will delete the item, but won't eliminate the place.
    this.#triangleIndexArrays = this.#triangleIndexArrays.filter((value) => value)

    this.geometry = {
      vertices: this.#vertices,
      triangles: this.#triangleIndexArrays,
      lines: this.#lineIndexArrays
    }
  }

  #triangleEdgeTooLong(triangleIndex, maxEdgeLength) {
    let triangleIndexes = this.#triangleIndexArrays[triangleIndex]
    let ABLenSq = this.#distAToB(triangleIndexes[0], triangleIndexes[1])
    let BCLenSq = this.#distAToB(triangleIndexes[1], triangleIndexes[2])
    let CALenSq = this.#distAToB(triangleIndexes[2], triangleIndexes[0])

    let maxEdgeLengthSq = maxEdgeLength * maxEdgeLength
    let tooLong = (ABLenSq > maxEdgeLengthSq) || (BCLenSq > maxEdgeLengthSq) || (CALenSq > maxEdgeLengthSq)
    return tooLong
  }

  #distAToB(aIndex, bIndex) {
    let A = this.#vertices[aIndex]
    let B = this.#vertices[bIndex]
    let x = B[0] - A[0]
    let y = B[1] - A[1]
    let z = B[2] - A[2]
    let distSq = (x * x) + (y * y) + (z * z)
    return distSq
  }

  #subdivideTriangle(triangleIndex) {
    let indexArr = this.#triangleIndexArrays[triangleIndex]
    let aIndex = indexArr[0]
    let bIndex = indexArr[1]
    let cIndex = indexArr[2]

    // Create midpoints
    let midABIndex = this.#makeMidpointIfNotExists(aIndex, bIndex)
    let midACIndex = this.#makeMidpointIfNotExists(aIndex, cIndex)
    let midBCIndex = this.#makeMidpointIfNotExists(bIndex, cIndex)

    // Three new triangles
    this.#triangleIndexArrays.push([aIndex, midABIndex, midACIndex])
    this.#triangleIndexArrays.push([midACIndex, midABIndex, midBCIndex])
    this.#triangleIndexArrays.push([bIndex, midBCIndex, midABIndex])
    this.#triangleIndexArrays.push([cIndex, midACIndex, midBCIndex])

    // TODO:
    //  associate an array of lines with each triangle
    //  create new ones when new triangles are created (and be sure that they wrap around to the origin)
    //  delete the old set when its triangle is deleted
    //  ??will this even work if the triangle origins are not connect? isn't there still a risk of a cross-line??

    // Delete the old triangle
    delete this.#triangleIndexArrays[triangleIndex]
  }

  #makeMidpointIfNotExists(aIndex, bIndex) {
    let key1 = `${aIndex},${bIndex}`
    let key2 = `${bIndex},${aIndex}` // could be either key
    let midABIndex = this.#triangleIndicesDict[key1]
    if (!midABIndex) {
      midABIndex = this.#triangleIndicesDict[key2]
      if (!midABIndex) {
        // No midpoint on record. Make one.
        let A = this.#vertices[aIndex]
        let B = this.#vertices[bIndex]
        let x = (A[0] + B[0]) * 0.5
        let y = (A[1] + B[1]) * 0.5
        let z = (A[2] + B[2]) * 0.5
        let mid = [x, y, z]
        let newVertexCount = this.#vertices.push(mid)
        midABIndex = newVertexCount - 1

        this.#triangleIndicesDict[key1] = midABIndex
        this.#triangleIndicesDict[key2] = midABIndex
      }
    }

    return midABIndex
  }

  #addLineSegmentIfNotExists(aIndex, bIndex) {
    let key1 = `${aIndex},${bIndex}`
    let key2 = `${bIndex},${aIndex}` // could be either key
    let lineIndex = this.#lineIndicesDict[key1]
    if (!lineIndex) {
      lineIndex = this.#lineIndicesDict[key2]
      if (!lineIndex) {
        let newLineCount = this.#lineIndexArrays.push([aIndex, bIndex])
        lineIndex = newLineCount - 1

        this.#lineIndicesDict[key1] = lineIndex
        this.#lineIndicesDict[key2] = lineIndex
      }
    }
  }
}

// Input:
//  vertices: Array of [x, y, z]
//  sphereRadius: float
const rescaleToSphere = (vertices, sphereRadius) => {
  let scaledVertices = []
  for (let i = 0; i < vertices.length; i++) {
    let x = vertices[i][0]
    let y = vertices[i][1]
    let z = vertices[i][2]

    let v = new THREE.Vector3(x, y, z)
    v.normalize().multiplyScalar(sphereRadius)
    scaledVertices.push(v.toArray())
  }

  return scaledVertices
}

// Input:
//  vertices: Array of [x, y, z]
// Output:
//  {
//    vertices,   // array of [x, y, z] (float)
//    triangles,  // array of [a, b, c] (integer)
//    lines,      // array of [a, b] (integer)
//  }
export const generateRegionMesh = (baseVertices, sphereRadius, maxEdgeLength = 0.5) => {
  // const baseGeometry = triangulatePoints(baseVertices)
  let triangulator = new EarClipping(baseVertices)
  let baseGeometry = triangulator.geometry

  let meshSubdivider = new MeshSubdivider(baseVertices, baseGeometry.triangleIndices, maxEdgeLength)
  let subdividedGeometry = meshSubdivider.geometry

  let scaledVertices = rescaleToSphere(subdividedGeometry.vertices, sphereRadius)
  subdividedGeometry.vertices = scaledVertices



  // TODO
  //  EarClipping
  //    change name to "TriangulateCounterClockwisePlane"
  //    move to its own file
  //    Take array of [x, y, z] arrays and convert to Vec3 internally
  //  MeshSubdivider
  //    move to its own file
  //  make sphere
  //    for each vertex
  //      create vec3 -> normalize -> scale -> vector3.toArray()

  return subdividedGeometry
}


// TODO: ??put main function at the top and then organize down??