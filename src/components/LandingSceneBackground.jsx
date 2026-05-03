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
  const lightRef = useRef(null)
  const fadeOverlayRef = useRef(null)
  const directionRef = useRef(Math.random() > 0.5 ? 1 : -1) // 1 for right, -1 for left
  const isTransitioningRef = useRef(false) // Prevent multiple transitions at once
  const [objects, setObjects] = useState(initialObjects)
  const [colorScheme, setColorScheme] = useState(initialColorScheme)
  const previousColorNameRef = useRef(initialColorScheme?.name)
  
  const SWITCH_INTERVAL = 4 // seconds
  const FADE_DURATION = 1.5 // seconds for fade in/out
  const MOVEMENT_SPEED = 0.4 // units per second (linear movement) - 33% faster

  // Setup camera path for smooth auto-flight
  useEffect(() => {
    camera.position.set(200, 120, 800)
    camera.lookAt(0, 60, 0)
  }, [camera])

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
    // Increment timers (in seconds)
    timeRef.current += 1 / 60
    switchTimerRef.current += 1 / 60

    // Check if it's time to switch scenes (only if not already transitioning)
    if (switchTimerRef.current >= SWITCH_INTERVAL && !isTransitioningRef.current) {
      isTransitioningRef.current = true
      switchTimerRef.current = 0
      directionRef.current = Math.random() > 0.5 ? 1 : -1 // Randomize direction for next cycle
      
      // Fade out -> switch -> fade in
      const switchDuration = FADE_DURATION / 2
      
      // Start fade out
      let fadeOutProgress = 0
      const fadeOutInterval = setInterval(() => {
        fadeOutProgress += 0.016 / switchDuration // Based on ~60fps
        if (fadeOutProgress >= 1) {
          // Switch scenes at halfway point
          setObjects(generateTrees())
          
          // Generate new color scheme, ensuring it's different from previous
          let newColorScheme = getRandomColorScheme()
          while (newColorScheme.name === previousColorNameRef.current) {
            newColorScheme = getRandomColorScheme()
          }
          previousColorNameRef.current = newColorScheme.name
          setColorScheme(newColorScheme)
          
          fadeOutProgress = 1
          clearInterval(fadeOutInterval)
          
          // Start fade in
          let fadeInProgress = 0
          const fadeInInterval = setInterval(() => {
            fadeInProgress += 0.016 / switchDuration
            if (fadeInProgress >= 1) {
              if (fadeOverlayRef.current) {
                fadeOverlayRef.current.material.opacity = 0
              }
              isTransitioningRef.current = false // Allow next transition
              clearInterval(fadeInInterval)
            } else {
              if (fadeOverlayRef.current) {
                fadeOverlayRef.current.material.opacity = 1 - fadeInProgress
              }
            }
          }, 16)
        } else {
          if (fadeOverlayRef.current) {
            fadeOverlayRef.current.material.opacity = fadeOutProgress
          }
        }
      }, 16)
    }

    // Linear left-right movement with random direction
    const x = (timeRef.current * MOVEMENT_SPEED * directionRef.current) % 2400 - 1200 // Move left-right within bounds
    const height = 100 + Math.sin(timeRef.current * 0.05) * 50 // Gentle height variation
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
