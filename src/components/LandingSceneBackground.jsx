import { useEffect, useRef, useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import Ground from './shapes/Ground'
import GroundDetails from './shapes/GroundDetails'
import Skybox from './shapes/Skybox'
import VolumetricFog from './VolumetricFog'
import SceneObjects from './shapes/SceneObjects'
import { getTerrainHeight } from '../utils/terrain'
import { getRandomColorScheme } from '../utils/colorSchemes'
import * as THREE from 'three'

function LandingSceneBackground({ objects: initialObjects, colorScheme: initialColorScheme }) {
  const { camera, scene } = useThree()
  const timeRef = useRef(0)
  const switchTimerRef = useRef(0)
  const transitionProgressRef = useRef(0) // Tracks fade transition (0-1)
  const isTransitioningRef = useRef(false)
  const lightRef = useRef(null)
  const fadeOverlayRef = useRef(null)
  const [objects, setObjects] = useState(initialObjects)
  const [colorScheme, setColorScheme] = useState(initialColorScheme)
  const previousColorNameRef = useRef(initialColorScheme?.name)
  
  const SWITCH_INTERVAL = 4 // seconds
  const FADE_DURATION = 1.5 // seconds for fade in/out
  const CAMERA_MIN_HEIGHT = 20 // Starting height (just above ground)
  const CAMERA_MAX_HEIGHT = 350 // Top view height
  const CYCLE_DURATION = 15 // seconds for full up-down cycle

  // Setup camera path for smooth auto-flight
  useEffect(() => {
    // Calculate center of mass for tree positions to find dense area
    if (initialObjects.length > 0) {
      const centerX = initialObjects.reduce((sum, obj) => sum + obj.x, 0) / initialObjects.length
      const centerZ = initialObjects.reduce((sum, obj) => sum + obj.z, 0) / initialObjects.length
      
      // Position camera at bottom starting position, looking at center
      camera.position.set(centerX, CAMERA_MIN_HEIGHT, centerZ)
      camera.lookAt(centerX, 60, centerZ)
    } else {
      camera.position.set(0, CAMERA_MIN_HEIGHT, 0)
      camera.lookAt(0, 60, 0)
    }
  }, [camera, initialObjects])

  // Setup shadows and fade overlay
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
    
    // Create fade overlay plane
    const overlayGeometry = new THREE.PlaneGeometry(2, 2)
    const overlayMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
      side: THREE.FrontSide,
    })
    const overlayMesh = new THREE.Mesh(overlayGeometry, overlayMaterial)
    camera.add(overlayMesh)
    overlayMesh.position.z = -0.5
    fadeOverlayRef.current = overlayMesh
    
    return () => {
      scene.remove(light)
      scene.remove(light.target)
      if (fadeOverlayRef.current) {
        camera.remove(fadeOverlayRef.current)
      }
    }
  }, [scene, camera])

  // Generate new trees
  const generateTrees = () => {
    const trees = []
    const maxAttempts = 30000
    let attempts = 0

    while (trees.length < 1200 && attempts < maxAttempts) {
      const x = (Math.random() - 0.5) * 3000
      const z = (Math.random() - 0.5) * 3000
      let height = Math.random() * 120 + 30

      let collision = false
      const radius = height / 2
      
      if (Math.abs(x) + radius > 1800 || Math.abs(z) + radius > 1800) {
        collision = true
      }

      const playerSpawnRadius = 15
      const distToPlayer = Math.sqrt(x * x + z * z)
      if (distToPlayer < playerSpawnRadius) {
        collision = true
      }

      const PLAYER_PATH_WIDTH = 25
      if (Math.abs(x) < PLAYER_PATH_WIDTH) {
        collision = true
      }

      for (let tree of trees) {
        const dx = x - tree.x
        const dz = z - tree.z
        const distance = Math.sqrt(dx * dx + dz * dz)
        const minDistance = (radius + tree.size / 2 + 2) * 0.35
        if (distance < minDistance) {
          collision = true
          break
        }
      }

      if (!collision) {
        const isBush = Math.random() < 0.5
        const terrainHeight = getTerrainHeight(x, z)
        
        let yOffset
        if (isBush) {
          yOffset = terrainHeight - (height * 2/3)
        } else {
          yOffset = terrainHeight - (height * 0.2)
        }
        
        trees.push({
          x,
          z,
          height,
          type: 'tree',
          size: height / 2,
          rotation: [0, Math.random() * Math.PI * 2, 0],
          treeIndex: Math.floor(Math.random() * 3) + 1,
          isBush: isBush,
          yOffset: yOffset
        })
      }
      attempts++
    }

    return trees
  }

  // Handle continuous vertical camera movement
  useFrame((state) => {
    const deltaTime = 1 / 60 // Roughly 16ms per frame
    
    // Increment time for continuous upward movement
    timeRef.current += deltaTime
    
    // Calculate camera height - moves from bottom to top over CYCLE_DURATION, then resets
    const normalizedTime = (timeRef.current % CYCLE_DURATION) / CYCLE_DURATION
    const height = CAMERA_MIN_HEIGHT + (CAMERA_MAX_HEIGHT - CAMERA_MIN_HEIGHT) * normalizedTime
    
    // Get camera's current center position
    if (objects.length > 0) {
      const centerX = objects.reduce((sum, obj) => sum + obj.x, 0) / objects.length
      const centerZ = objects.reduce((sum, obj) => sum + obj.z, 0) / objects.length
      
      // Move camera upward while maintaining center position
      camera.position.x = centerX
      camera.position.y = height
      camera.position.z = centerZ
      
      // Look down at center as camera rises
      camera.lookAt(centerX, 0, centerZ)
    }
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
