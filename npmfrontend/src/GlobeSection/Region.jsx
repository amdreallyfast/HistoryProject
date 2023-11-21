import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import Delaunator from "delaunator"
import * as d3Geo from "d3-geo-voronoi"

function ConvertLatLongToXYZ(lat, long, sphereRadius) {
  let latRad = (lat / 180.0) * Math.PI
  let longRad = (long / 180.0) * Math.PI

  let projectionOfRadiusOntoXZPlane = sphereRadius * Math.cos(latRad)
  let x = Math.sin(longRad) * projectionOfRadiusOntoXZPlane
  let y = Math.sin(latRad) * sphereRadius
  let z = Math.cos(longRad) * projectionOfRadiusOntoXZPlane

  return [x, y, z,]
}

export function Region() {
  const meshRef = useRef()
  useEffect(() => {
    // Testing
    let testLongLatArr = [
      [34.99902026115871, -5.311780837060211],
      [34.382157360924246, -8.247675958196918],
      [35.61588316139318, -2.375885715923504],
      [31.966457021422954, -4.674606933353613],
      [31.34959412118849, -7.61050205449032],
      [32.58331992165742, -1.7387118122169052],
      [28.933893781687196, -4.037433029647014],
      [28.31703088145273, -6.973328150783721],
      [29.550756681921662, -1.1015379085103068],
      [25.901330541951438, -3.4002591259404156],
      [25.284467641716972, -6.336154247077123],
      [26.518193442185904, -0.4643640048037081],
      [22.86876730221568, -2.763085222233817],
      [22.251904401981214, -5.698980343370524],
      [23.485630202450146, 0.17280989890289034],
      [19.836204062479922, -2.1259113185272183],
      [19.219341162245456, -5.0618064396639255],
      [20.453066962714388, 0.809983802609489],
      [16.803640822744164, -1.4887374148206196],
      [16.186777922509698, -4.424632535957327],
      [17.42050372297863, 1.4471577063160876],
      [13.771077583008406, -0.851563511114021],
      [13.15421468277394, -3.787458632250728],
      [14.387940483242872, 2.0843316100226863],
      [10.738514343272648, -0.21438960740742274],
      [10.121651443038182, -3.15028472854413],
      [11.355377243507114, 2.7215055137292845],
      [7.7059511035368935, 0.42278429629917547],
      [7.089088203302428, -2.513110824837532],
      [8.32281400377136, 3.3586794174358827],
      [4.6733878638011355, 1.0599582000057746],
      [4.05652496356667, -1.8759369211309327],
      [5.290250764035601, 3.995853321142482],
      [1.6408246240653739, 1.6971321037123728],
      [1.023961723830908, -1.2387630174243345],
      [2.2576875242998398, 4.63302722484908],
      [-1.3917386156703841, 2.334306007418972],
      [-2.00860151590485, -0.6015891137177354],
      [-0.7748757154359183, 5.270201128555679],
      [-4.424301855406142, 2.971479911125571],
      [-5.041164755640608, 0.03558478998886372],
      [-3.8074389551716763, 5.907375032262278],
      [-7.4568650951419, 3.608653814832169],
      [-8.073727995376366, 0.6727586936954619],
      [-6.840002194907434, 6.544548935968876],
      [-10.489428334877658, 4.245827718538767],
      [-11.106291235112124, 1.3099325974020601],
      [-9.872565434643192, 7.181722839675475],
      [-13.521991574613416, 4.883001622245366],
      [-14.138854474847882, 1.9471065011086583],
      [-12.90512867437895, 7.818896743382073],
      [-16.554554814349167, 5.520175525951964],
      [-17.171417714583633, 2.5842804048152566],
      [-15.937691914114701, 8.456070647088671]
    ]

    let pointsArr = []
    testLongLatArr.forEach((longLat) => {
      let lat = longLat[1]
      let long = longLat[0]
      let sphereRadius = 10
      const [x, y, z] = ConvertLatLongToXYZ(lat, long, sphereRadius)
      pointsArr.push(x, y, z)
    })

    // let expectedIndicesArr = [24, 21, 25, 21, 22, 25, 24, 26, 21, 26, 23, 21, 18, 19, 22, 28, 27, 24, 24, 27, 26, 25, 28, 24, 18, 22, 21, 22, 19, 25, 25, 19, 28, 23, 18, 21, 27, 29, 26, 26, 29, 23, 30, 29, 27, 23, 20, 18, 29, 20, 23, 28, 30, 27, 28, 31, 30, 19, 31, 28, 18, 16, 19, 15, 16, 18, 20, 15, 18, 35, 32, 30, 30, 32, 29, 29, 17, 20, 20, 17, 15, 53, 17, 29, 31, 33, 30, 37, 34, 31, 31, 34, 33, 16, 13, 19, 15, 13, 16, 12, 13, 15, 17, 12, 15, 33, 35, 30, 17, 14, 12, 12, 10, 13, 34, 37, 33, 33, 36, 35, 19, 37, 31, 37, 36, 33, 13, 10, 19, 9, 10, 12, 14, 9, 12, 36, 38, 35, 35, 38, 32, 17, 11, 14, 14, 11, 9, 9, 7, 10, 37, 39, 36, 36, 41, 38, 6, 7, 9, 19, 40, 37, 37, 40, 39, 11, 6, 9, 44, 41, 39, 39, 41, 36, 11, 8, 6, 40, 43, 39, 43, 42, 39, 3, 4, 6, 6, 4, 7, 7, 4, 10, 8, 3, 6, 42, 44, 39, 41, 44, 38, 38, 53, 32, 32, 53, 29, 11, 5, 8, 8, 5, 3, 3, 1, 4, 43, 46, 42, 42, 47, 44, 40, 46, 43, 0, 1, 3, 46, 45, 42, 5, 0, 3, 45, 47, 42, 5, 2, 0, 46, 49, 45, 45, 50, 47, 40, 49, 46, 49, 48, 45, 48, 50, 45, 47, 50, 44, 44, 53, 38, 52, 51, 48, 48, 51, 50, 49, 52, 48, 52, 53, 51, 51, 53, 50, 50, 53, 44, 17, 53, 11]
    // const testTypedArr = new Float32Array(testLongLatArr.flat())
    // let delaunator = new Delaunator(testTypedArr)
    // let indicesArr = delaunator.triangles
    let delaunator = new d3Geo.geoDelaunay(testLongLatArr)
    let indicesArr = delaunator.triangles.flat()
    console.log({ edges: delaunator.edges })
    // TODO: go through all index pairs of vertices and remove pairs that are longer than 3

    // Create geometry for the points
    let valuesPerVertex = 3
    let valuesPerIndex = 1
    let positionAttribute = new THREE.Float32BufferAttribute(pointsArr, valuesPerVertex)
    let indicesAttribute = new THREE.Uint32BufferAttribute(indicesArr, valuesPerIndex)

    meshRef.current.geometry.setAttribute("position", positionAttribute)
    meshRef.current.geometry.setIndex(indicesAttribute)
  }, [meshRef.current])

  return (
    <>
      <mesh name="IntermediatePointsMesh" ref={meshRef}>
        <meshBasicMaterial color={0x00ff00} side={THREE.DoubleSide} wireframe={true} />
      </mesh>
    </>
  )
}