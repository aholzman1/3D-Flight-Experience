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
  const directionRef = useRef(Math.random() > 0.5 ? 1 : -1) // 1 for right, -1 for left
  const [objects, setObjects] = useState(initialObjects)
  const [colorScheme, setColorScheme] = useState(initialColorScheme)
  const previousColorNameRef = useRef(initialColorScheme?.name)
  
  const SWITCH_INTERVAL = 4 // seconds
  const FADE_DURATION = 1.5 // seconds for fade in/out
  const MOVEMENT_SPEED = 0.4 // units per second (linear movement) - 33% faster

  // Setup camera path for smooth auto-flight
  useEffect(() => {
    // Calculate center of mass for tree positions to find dense area
    if (initialObjects.length > 0) {
      const centerX = initialObjects.reduce((sum, obj) => sum + obj.x, 0) / initialObjects.length
      const centerZ = initialObjects.reduce((sum, obj) => sum + obj.z, 0) / initialObjects.length
      
      // Position camera where trees are visible, looking at center of tree cluster
      camera.position.set(centerX - 300, 120, centerZ + 800)
      camera.lookAt(centerX, 60, centerZ)
    } else {
      camera.position.set(200, 120, 800)
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

  // Handle scene switching with fade transitions
  useFrame((state) => {
    const deltaTime = 1 / 60 // Roughly 16ms per frame
    
    // Increment timers
    timeRef.current += deltaTime
    
    if (isTransitioningRef.current) {
      // Update transition progress
      transitionProgressRef.current += deltaTime / FADE_DURATION
      
      if (transitionProgressRef.current >= 0.5 && transitionProgressRef.current < 0.5001) {
        // Switch scenes at halfway point (50%)
        setObjects(generateTrees())
        
        // Generate new color scheme - only sunset and sunny for landing page
        const schemes = [
          { name: 'Sunset', skyColor: 0xffd9a3, fogColor: 0xffd9a3, fogDensity: 0.004, lightColor: '#fff8dc', lightIntensity: 1.5 },
          { name: 'Sunny Day', skyColor: 0x87ceeb, fogColor: 0xb0d9ff, fogDensity: 0.002, lightColor: '#ffff99', lightIntensity: 2.0 }
        ]
        let newColorScheme = schemes[Math.floor(Math.random() * schemes.length)]
        while (newColorScheme.name === previousColorNameRef.current) {
          newColorScheme = schemes[Math.floor(Math.random() * schemes.length)]
        }
        previousColorNameRef.current = newColorScheme.name
        setColorScheme(newColorScheme)
      }
      
      // Update fade overlay opacity based on transition progress
      if (fadeOverlayRef.current) {
        if (transitionProgressRef.current < 0.5) {
          // Fade out (0 to 1)
          fadeOverlayRef.current.material.opacity = transitionProgressRef.current * 2
        } else {
          // Fade in (1 to 0)
          fadeOverlayRef.current.material.opacity = (1 - transitionProgressRef.current) * 2
        }
      }
      
      // Check if transition is complete
      if (transitionProgressRef.current >= 1) {
        isTransitioningRef.current = false
        transitionProgressRef.current = 0
        switchTimerRef.current = 0
        if (fadeOverlayRef.current) {
          fadeOverlayRef.current.material.opacity = 0
        }
      }
    } else {
      // Count up to switch interval
      switchTimerRef.current += deltaTime
      
      if (switchTimerRef.current >= SWITCH_INTERVAL) {
        isTransitioningRef.current = true
        transitionProgressRef.current = 0
        directionRef.current = Math.random() > 0.5 ? 1 : -1 // Randomize direction for next cycle
      }
    }

    // Camera movement - ALWAYS ACTIVE, continuous panning
    const x = (timeRef.current * MOVEMENT_SPEED * directionRef.current) % 2400 - 1200 // Move left-right within bounds
    let height = 80 + Math.sin(timeRef.current * 0.05) * 40 // Oscillate between 40 and 120
    // Clamp height to keep camera within viewing range
    height = Math.max(40, Math.min(120, height))
    const z = 800 // Keep Z fixed for forward-looking view
    
    camera.position.x = x
    camera.position.y = height
    camera.position.z = z
    
    // Look straight ahead with slight upward/downward variation
    const lookHeight = 60 + Math.sin(timeRef.current * 0.03) * 20
    camera.lookAt(x + directionRef.current * 500, lookHeight, z - 100)
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
