import { useLoader } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import globeVertShaderText from "../assets/shaders/globe.vert?raw" // Plugin "vite-plugin-string" not necessary
import globeFragShaderText from "../assets/shaders/globe.frag?raw"
import atmosphereVertShaderText from "../assets/shaders/atmosphere.vert?raw"
import atmosphereFragShaderText from "../assets/shaders/atmosphere.frag?raw"
import * as THREE from "three"
import { meshNames, groupNames } from "./constValues"
import { useDispatch } from "react-redux"

export function Globe({ globeRadius }) {
  // console.log("Globe(): begin")

  const sphereRef = useRef()
  const groupRef = useRef()

  const globeMemo = useMemo(() => {
    // console.log("Globe(): useMemo")
    // console.log({ msg: "Globe()/useMemo()", base_url: import.meta.env.BASE_URL })

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

  useEffect(() => {
    // Allign spherical coordinates with globe texture.
    // Note: We rotate around the Y axis (veritcal axis), which makes sense, but I can't figure
    // out any solid math reason why we rotate by -90 degrees. I suspect that it's just the way 
    // that the texture wrapping started on the ThreeJs sphere geometry. With this texture 
    // wrapping and a standard earth rectangular map with Greenwich, England in the center, 
    // spherical coordinates of 0 deg horizontal rotation and 0 deg veritcal rotation end up in
    // the Pacific Ocean, a bit SW of Panama and approximately the island of Puerto Ayora.
    // Rotating the entire globe by -90deg though re-aligns everything. It seems to be a quirk of
    // the ThreeJs sphere geometry + rectangular earth maps.
    groupRef.current.rotation.y = -Math.PI / 2
  }, [groupRef.current])

  const reduxDispatch = useDispatch()
  // useEffect(() => {
  //   reduxDispatch(
  //     intersectableMeshesStateActions.add(sphereRef.current)
  //   )
  //   console.log({ msg: "Globe", value: sphereRef.current })
  // }, [sphereRef.current])

  return (
    <group name={groupNames.GlobeGroup} ref={groupRef}>
      {/* Planet */}
      <mesh name={meshNames.Globe} ref={sphereRef} geometry={globeMemo.geometry}>
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

      {/* Atmosphere */}
      {/* 
        ??what is wrong with the atmosphere? 
        why does it sometimes stop being transparent if you reload enough, and sometimes only when the camera is near the south pole and looking up?? 

        try this?
        https://stackoverflow.com/questions/15994944/transparent-objects-in-three-js

        ??is it even rotating? try wireframe??
      */}
      <mesh name={meshNames.GlobeAtmosphere} geometry={globeAtmosphereMemo.geometry}>
        <shaderMaterial
          vertexShader={atmosphereVertShaderText}
          fragmentShader={atmosphereFragShaderText}

          // "blending" is the only place where the alpha channel really matters (I think)
          blending={THREE.AdditiveBlending}
          transparent={true}

          // Only render the inside of the sphere so that the color appears behind the globe
          side={THREE.BackSide}
          wireframe={false}
        >
        </shaderMaterial>
      </mesh>
    </group>
  )
}
