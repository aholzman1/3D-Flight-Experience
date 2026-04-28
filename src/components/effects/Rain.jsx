import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function Rain({ intensity = 'normal' }) {
  const { camera, scene } = useThree()
  const rainRef = useRef(null)
  const positionsRef = useRef(null)
  const velocitiesRef = useRef(null)

  useEffect(() => {
    // Determine rain particle count and fall speed based on intensity
    let rainCount = 0
    let baseFallSpeed = 0
    
    if (intensity === 'none') {
      rainCount = 0
      baseFallSpeed = 0
    } else if (intensity === 'normal') {
      rainCount = 25000
      baseFallSpeed = 2.75 // average of 2.5-4.5
    } else if (intensity === 'heavy') {
      rainCount = 45000
      baseFallSpeed = 4.0 // faster falling
    }

    // Don't render anything if no rain
    if (rainCount === 0) {
      return
    }

    const positions = new Float32Array(rainCount * 3)
    const velocities = new Float32Array(rainCount * 3)
    
    // Initialize rain drop positions with full distribution across height range
    for (let i = 0; i < rainCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 500 // x - 500 radius
      positions[i * 3 + 1] = Math.random() * 300 // y - random height across full range to start with rain already falling
      positions[i * 3 + 2] = (Math.random() - 0.5) * 500 // z - 500 radius
      
      velocities[i * 3] = 0 // no x velocity
      // Randomize fall speed for each particle
      const speedVariation = intensity === 'heavy' ? 1.5 : 2.0 // less variation for heavy rain (more uniform)
      velocities[i * 3 + 1] = -(baseFallSpeed - speedVariation/2 + Math.random() * speedVariation)
      velocities[i * 3 + 2] = 0 // no z velocity
    }

    // Create geometry and material
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const material = new THREE.PointsMaterial({
      color: 0xdddddd,
      size: 0.8,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.75,
      fog: false,
    })

    const rainMesh = new THREE.Points(geometry, material)
    rainMesh.frustumCulled = false
    scene.add(rainMesh)
    rainRef.current = rainMesh
    positionsRef.current = positions
    velocitiesRef.current = velocities

    return () => {
      scene.remove(rainMesh)
      geometry.dispose()
      material.dispose()
    }
  }, [scene, intensity])

  useFrame(() => {
    if (!rainRef.current || !positionsRef.current || !camera) return

    const positions = positionsRef.current
    const velocities = velocitiesRef.current
    const rainCount = positions.length / 3
    const resetHeight = 300
    const minHeight = 0
    const rainRadius = 500

    for (let i = 0; i < rainCount; i++) {
      // Update position with velocity
      positions[i * 3] += velocities[i * 3]
      positions[i * 3 + 1] += velocities[i * 3 + 1]
      positions[i * 3 + 2] += velocities[i * 3 + 2]

      // Reset to top when falls below ground
      if (positions[i * 3 + 1] < minHeight) {
        positions[i * 3 + 1] = resetHeight
        positions[i * 3] = camera.position.x + (Math.random() - 0.5) * rainRadius
        positions[i * 3 + 2] = camera.position.z + (Math.random() - 0.5) * rainRadius
      }

      // Keep rain within 500 radius of player
      const dx = positions[i * 3] - camera.position.x
      const dz = positions[i * 3 + 2] - camera.position.z
      const distance = Math.sqrt(dx * dx + dz * dz)

      if (distance > rainRadius) {
        positions[i * 3] = camera.position.x + (Math.random() - 0.5) * rainRadius
        positions[i * 3 + 1] = resetHeight
        positions[i * 3 + 2] = camera.position.z + (Math.random() - 0.5) * rainRadius
      }
    }

    rainRef.current.geometry.attributes.position.needsUpdate = true
  })

  return null
}

export default Rain
