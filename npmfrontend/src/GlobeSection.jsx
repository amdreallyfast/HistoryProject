import { useEffect, useMemo, useRef } from "react"
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { gsap } from "gsap/gsap-core"
import * as THREE from "three"

const globeInfo = {
  pos: new THREE.Vector3(0, 0, 0),
  radius: 5
}

import globeVertShaderText from "./assets/shaders/globe.vert?raw" // Plugin "vite-plugin-string" not necessary
import globeFragShaderText from "./assets/shaders/globe.frag?raw"
import atmosphereVertShaderText from "./assets/shaders/atmosphere.vert?raw"
import atmosphereFragShaderText from "./assets/shaders/atmosphere.frag?raw"

function Globe({ globeRadius }) {
  // console.log("Globe(): begin")

  const globeMemo = useMemo(() => {
    // console.log("Globe(): useMemo")

    const widthSegments = 50
    const heightSegments = 50
    const geometry = new THREE.SphereGeometry(globeRadius, widthSegments, heightSegments)

    // ??how to load from offline assets instead of public URL? is that a bad idea??
    const texture = useLoader(THREE.TextureLoader, import.meta.env.BASE_URL + "textures/earthmap1k.jpg")

    return {
      geometry: geometry,
      texture: texture
    }
  }, [])

  // Another sphere occupying the same space as the globe, but it shall be transparent and give
  // off a glow.
  const globeAtmosphereMemo = useMemo(() => {
    // console.log("GlobeAtmosphere(): useMemo")

    const radius = globeRadius * 1.2
    const widthSegments = 50
    const heightSegments = 50
    const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments)

    return {
      geometry: geometry,
    }
  }, [])

  const sphereRef = useRef()
  const groupRef = useRef()

  // Only run once when the assets are first rendered.
  const alignSphericalCoordinatesWithEarthTexture = () => {
    // Rotate globe to align the spherical coordinate calculations and the earth texture.
    // Note: We rotate around the Y axis (veritcal axis), which makes sense, but I can't figure
    // out any solid math reason why we rotate by -90 degrees. I suspect that it's just the way 
    // that the texture wrapping started on the ThreeJs sphere geometry. With this texture 
    // wrapping and a standard earth rectangular map with Greenwich, England in the center, 
    // spherical coordinates of 0 deg horizontal rotation and 0 deg veritcal rotation end up in
    // the Pacific Ocean, a bit SW of Panama and approximately the island of Puerto Ayora.
    // Rotating the entire globe by -90deg though re-aligns everything. It seems to be a quirk of
    // the ThreeJs sphere geometry + rectangular earth maps.
    groupRef.current.rotation.y = -Math.PI / 2
  }

  useEffect(() => {
    alignSphericalCoordinatesWithEarthTexture()
  }, [])

  return (
    <group name="GlobeGroup" ref={groupRef}>
      <mesh name="Globe" ref={sphereRef} geometry={globeMemo.geometry}>
        <shaderMaterial
          vertexShader={globeVertShaderText}
          fragmentShader={globeFragShaderText}
          blending={THREE.AdditiveBlending}
          transparent={true}
          uniforms={  // Yes, there are a lot of parenthesis
            {
              globeTexture: {
                value: globeMemo.texture
              }
            }
          }
        >
        </shaderMaterial>
      </mesh >
      <mesh name="GlobeAtmosphere" geometry={globeAtmosphereMemo.geometry}>
        <shaderMaterial
          vertexShader={atmosphereVertShaderText}
          fragmentShader={atmosphereFragShaderText}

          // "blending" is the only place where the alpha channel really matters (I think)
          blending={THREE.AdditiveBlending}
          transparent={true}

          // Only render the inside of the sphere so that the color appears behind the globe
          side={THREE.BackSide}
        >
        </shaderMaterial>
      </mesh>
    </group>
  )
}

function PointsOfInterest({ displayItemsJson, globePos, globeRadius }) {
  const points = displayItemsJson?.map((poiInfoJson, index) => (
    <PointOfInterest key={index} globePos={globePos} globeRadius={globeRadius} poiInfoJson={poiInfoJson} />
  ))
  return (<>
    <group name="PoiGroup">
      {points}
    </group>
  </>)
}


import { Stars } from "./Stars"
import { OrbitControls, PerspectiveCamera } from "@react-three/drei"
import { PointOfInterest } from "./PointOfInterest"

export function GlobeSection({ displayItemsJson, itemSelectedCallback, currSelectedUniqueId }) {

  // threeJsStateModelRef.current = useThree((state) => state)

  // let displayItemsAsHtml = displayItemsJson?.map((jsonValue, index) => {
  //   let className = "text-white"
  //   if (jsonValue.myUniqueId === currSelectedUniqueId) {
  //     className = "text-white font-bold"
  //   }

  //   let html = (
  //     <p key={jsonValue.myUniqueId}
  //       className={className}
  //       onClick={(e) => itemSelectedCallback(jsonValue)}
  //     >
  //       {jsonValue.capital ? jsonValue.capital[0] : "<no capital>"}
  //     </p>
  //   )

  //   return html
  // })

  const mousePosCanvasNormalizedRef = useRef({
    x: 0,
    y: 0
  })
  const poiInfoPopupElementRef = useRef()
  const poiInfoTitleElementRef = useRef()

  // TODO: ??use canvas size instead of window size when calculating normalized mouse coordinates??
  const canvasRef = useRef()

  function onMouseMoveCanvas(e) {
    // Normalize mouse coordinates to [-1,+1] on x and y.
    // Note: This event from React Three Fiber appears to have reversed ThreeJs' default coordinate 
    // system's "y" axis. OpenGL, and consequently ThreeJs, have canvas y=0 at the bottom, but 
    // this event puts y=0 at the top. When the ThreeJs raycaster performs its calculations, it is 
    // expecting the input coordinates to be on the range x,y=[-1,+1], and specifically y=-1 to be 
    // the bottom, just like with OpenGL. So we need to negate the y sign.
    mousePosCanvasNormalizedRef.current = {
      x: ((e.clientX / window.innerWidth) * 2) - 1,
      y: -((e.clientY / window.innerHeight) * 2) + 1
    }

    if (poiInfoPopupElementRef) {
      poiInfoPopupElementRef.current.style.left = `${e.clientX}px`
      poiInfoPopupElementRef.current.style.top = `${e.clientY}px`
    }
  }

  return (
    <>
      <div ref={poiInfoPopupElementRef} className="fixed bg-gray-600 bg-opacity-75 px-4 py-2 w-1/6 rounded-lg">
        <h2 ref={poiInfoTitleElementRef} className="text-white text-xs">
          Title placeholder
        </h2>
      </div>

      <div className='flex flex-col h-full'>
        {/* <div name='GlobeItems' className='flex flex-col h-full overflow-auto'>
          {displayItemsAsHtml}
        </div> */}

        <div className="w-full h-full bg-blue-950 border-4 border-red-500">
          <Canvas ref={canvasRef} onMouseMove={(e) => onMouseMoveCanvas(e)}>
            <PerspectiveCamera makeDefault position={new THREE.Vector3(0, 0, 25)} fov={50} far={3000} />
            <OrbitControls />
            <spotLight position={(10, 15, 10)} angle={0.3} intensity={0.2} />

            <Globe globeRadius={globeInfo.radius} />
            <PointsOfInterest displayItemsJson={displayItemsJson} globePos={globeInfo.pos} globeRadius={globeInfo.radius} />
            <Stars />
          </Canvas>
        </div>
      </div>
    </>
  )
}