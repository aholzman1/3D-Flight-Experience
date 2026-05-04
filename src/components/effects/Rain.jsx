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
      baseFallSpeed = 2.75
    } else if (intensity === 'heavy') {
      rainCount = 45000
      baseFallSpeed = 4.0
    }

    if (rainCount === 0) {
      return
    }

    const positions = new Float32Array(rainCount * 3)
    const velocities = new Float32Array(rainCount * 3)
    
    // Initialize rain drop positions
    for (let i = 0; i < rainCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 500
      positions[i * 3 + 1] = Math.random() * 300
      positions[i * 3 + 2] = (Math.random() - 0.5) * 500
      
      velocities[i * 3] = 0
      const speedVariation = intensity === 'heavy' ? 1.5 : 2.0
      velocities[i * 3 + 1] = -(baseFallSpeed - speedVariation/2 + Math.random() * speedVariation)
      velocities[i * 3 + 2] = 0
    }

    // Create geometry for line segments (2 vertices per raindrop)
    const linePositions = new Float32Array(rainCount * 2 * 3)
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3))

    // Use line material for motion blur streak effect
    const material = new THREE.LineBasicMaterial({
      color: 0xdddddd,
      transparent: true,
      opacity: 0.8,
      fog: false,
      linewidth: 1,
    })

    const rainMesh = new THREE.LineSegments(geometry, material)
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
    const streakLength = 2.5 // Length of rain streak for motion blur effect

    const linePositions = rainRef.current.geometry.attributes.position.array

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

      // Create line segment for this raindrop (motion blur streak)
      // Start point (top of streak)
      linePositions[i * 6] = positions[i * 3]
      linePositions[i * 6 + 1] = positions[i * 3 + 1] + streakLength
      linePositions[i * 6 + 2] = positions[i * 3 + 2]

      // End point (bottom of streak, where raindrop is)
      linePositions[i * 6 + 3] = positions[i * 3]
      linePositions[i * 6 + 4] = positions[i * 3 + 1]
      linePositions[i * 6 + 5] = positions[i * 3 + 2]
    }

    rainRef.current.geometry.attributes.position.needsUpdate = true
  })

  return null
}

export default Rain
