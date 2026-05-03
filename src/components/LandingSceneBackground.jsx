import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import Ground from './shapes/Ground'
import GroundDetails from './shapes/GroundDetails'
import Skybox from './shapes/Skybox'
import VolumetricFog from './VolumetricFog'
import SceneObjects from './shapes/SceneObjects'
import { getTerrainHeight } from '../utils/terrain'
import { getRandomColorScheme } from '../utils/colorSchemes'
import * as THREE from 'three'

function LandingSceneBackground({ objects, colorScheme }) {
  const { camera, scene } = useThree()
  const timeRef = useRef(0)
  const lightRef = useRef(null)

  // Setup camera path for smooth auto-flight
  useEffect(() => {
    // Start camera at a scenic position
    camera.position.set(200, 120, 800)
    camera.lookAt(0, 60, 0)
  }, [camera])

  // Setup shadows
  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    
    const light = new THREE.DirectionalLight(0xffffff, 3)
    light.position.set(600, 800, 600)
    light.castShadow = true
    light.target.position.set(0, 50, 0)
    
    light.shadow.mapSize.width = 2048
    light.shadow.mapSize.height = 2048
    light.shadow.camera.left = -2500
    light.shadow.camera.right = 2500
    light.shadow.camera.top = 2500
    light.shadow.camera.bottom = -2500
    light.shadow.camera.near = 0.5
    light.shadow.camera.far = 2000
    light.bias = -0.0001
    light.shadow.normalBias = 0.02
    
    scene.add(light)
    scene.add(light.target)
    lightRef.current = light
    
    return () => {
      scene.remove(light)
      scene.remove(light.target)
    }
  }, [scene])

  // Auto-flight movement
  useFrame((state) => {
    timeRef.current += 0.003 // Very slow movement

    // Create a smooth circular flight path around the scene
    const radius = 1200
    const height = 100 + Math.sin(timeRef.current * 0.5) * 50 // Gentle height variation
    
    const x = Math.sin(timeRef.current) * radius
    const z = Math.cos(timeRef.current) * radius
    
    camera.position.x = x
    camera.position.y = height
    camera.position.z = z
    
    // Look towards center with slight upward/downward variation
    const lookHeight = 60 + Math.sin(timeRef.current * 0.3) * 20
    camera.lookAt(0, lookHeight, 0)
  })

  return (
    <>
      <Skybox colorScheme={colorScheme} />
      <VolumetricFog colorScheme={colorScheme} />
      <ambientLight intensity={0.6} />
      <pointLight position={[0, 100, 0]} intensity={0.8} />
      <hemisphereLight intensity={0.5} />
      <Ground />
      <GroundDetails />
      <SceneObjects objects={objects} />
    </>
  )
}

export default LandingSceneBackground
