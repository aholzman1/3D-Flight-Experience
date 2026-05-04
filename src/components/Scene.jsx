import { useEffect, useRef, useState } from 'react'
import { useThree } from '@react-three/fiber'
import Ground from './shapes/Ground'
import GroundDetails from './shapes/GroundDetails'
import Skybox from './shapes/Skybox'
import VolumetricFog from './VolumetricFog'
import AmbientBirdSounds from './effects/AmbientBirdSounds'
import Rain from './effects/Rain'
import SoftEffects from './effects/PostProcessing'
import SceneObjects from './shapes/SceneObjects'
import FirstPersonController from './controls/FirstPersonController'
import { getTerrainHeight } from '../utils/terrain'
import { getRandomColorScheme } from '../utils/colorSchemes'
import * as THREE from 'three'

function Scene({ isActive, resetCount }) {
  const { camera, scene } = useThree()
  const [objects, setObjects] = useState([])
  const [rainIntensity, setRainIntensity] = useState('normal') // 'none', 'normal', 'heavy'
  const [colorScheme, setColorScheme] = useState(getRandomColorScheme())
  const controllerRef = useRef(null)
  const lightRef = useRef(null)

  // Generate trees for static scene
  const generateTrees = () => {
    const trees = []
    const maxAttempts = 30000
    let attempts = 0

    while (trees.length < 1200 && attempts < maxAttempts) {
      const x = (Math.random() - 0.5) * 3000
      const z = (Math.random() - 0.5) * 3000
      let height = Math.random() * 120 + 30  // 30-150

      // Check collision
      let collision = false
      const radius = height / 2
      
      // Check boundaries
      if (Math.abs(x) + radius > 1800 || Math.abs(z) + radius > 1800) {
        collision = true
      }

      // Check player spawn area
      const playerSpawnRadius = 15
      const distToPlayer = Math.sqrt(x * x + z * z)
      if (distToPlayer < playerSpawnRadius) {
        collision = true
      }

      // Prevent tree generation in player's direct path (25 unit wide corridor along X=0)
      const PLAYER_PATH_WIDTH = 25
      if (Math.abs(x) < PLAYER_PATH_WIDTH) {
        collision = true
      }

      // Check collision with existing trees
      for (let tree of trees) {
        const dx = x - tree.x
        const dz = z - tree.z
        const distance = Math.sqrt(dx * dx + dz * dz)
        // Allow more overlap - reduce minimum distance further for denser packing
        const minDistance = (radius + tree.size / 2 + 2) * 0.35
        if (distance < minDistance) {
          collision = true
          break
        }
      }

      if (!collision) {
        const isBush = Math.random() < 0.5 // 50% chance to be a bush
        const terrainHeight = getTerrainHeight(x, z)
        
        // Bury trees/bushes in the ground so trunks are rooted
        let yOffset
        if (isBush) {
          yOffset = terrainHeight - (height * 2/3) // Bushes: mostly underground
        } else {
          yOffset = terrainHeight - (height * 0.2) // Trees: 20% of trunk buried
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

  // Initialize trees once
  useEffect(() => {
    const initialTrees = generateTrees()
    setObjects(initialTrees)
    
    // Randomly pick rain intensity: 50% none, 35% normal, 15% heavy
    const rand = Math.random()
    if (rand < 0.5) {
      setRainIntensity('none')
    } else if (rand < 0.85) {
      setRainIntensity('normal')
    } else {
      setRainIntensity('heavy')
    }
    
    // Pick random color scheme for each experience
    setColorScheme(getRandomColorScheme())
  }, [resetCount])

  // Setup shadows properly using THREE.js directly
  useEffect(() => {
    // Enable shadow map in renderer  
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        // Ensure materials have correct properties for shadow receiving
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => {
              mat.flatShading = false
              mat.side = THREE.DoubleSide
            })
          } else {
            child.material.flatShading = false
            child.material.side = THREE.DoubleSide
          }
        }
      }
    })
    
    // Create directional light for shadows - positioned to shine down on ground
    const light = new THREE.DirectionalLight(0xffffff, 4)
    light.position.set(600, 800, 600)
    light.castShadow = true
    
    // Target the center of the world
    light.target.position.set(0, 50, 0)
    
    // Configure shadow map - large coverage area with proper format
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
    light.shadow.radius = 4
    
    scene.add(light)
    scene.add(light.target)
    lightRef.current = light
    
    console.log('✓ Shadow light configured')
    console.log('✓ Light height:', light.position.y)
    
    return () => {
      scene.remove(light)
      scene.remove(light.target)
    }
  }, [scene])

  return (
    <>
      {/* Soft atmospheric effects */}
      <SoftEffects colorScheme={colorScheme} />
      
      {/* Skybox background */}
      <Skybox colorScheme={colorScheme} />
      
      {/* Volumetric fog atmosphere */}
      <VolumetricFog colorScheme={colorScheme} />
      
      {/* Rain effect */}
      <Rain intensity={rainIntensity} />
      
      {/* Bird sounds */}
      <AmbientBirdSounds rainIntensity={rainIntensity} isActive={isActive} />
      
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <pointLight position={[0, 100, 0]} intensity={0.8} />
      <hemisphereLight intensity={0.5} />
      
      {/* Scene components */}
      <Ground />
      <GroundDetails />
      <SceneObjects objects={objects} />
      
      {/* Controls with invisible boundary */}
      <FirstPersonController ref={controllerRef} camera={camera} isActive={isActive} resetCount={resetCount} />
    </>
  )
}

export default Scene
