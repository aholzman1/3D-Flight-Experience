import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

function Boids({ count = 20, isActive = true }) {
  const { camera } = useThree()
  const boidRefs = useRef([])
  const groupRef = useRef(null)

  // Initialize boids
  const boids = useMemo(() => {
    const boidsArray = []
    for (let i = 0; i < count; i++) {
      boidsArray.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 1500,
          150 + Math.random() * 200,
          600 + Math.random() * 800
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 4
        ),
        acceleration: new THREE.Vector3()
      })
    }
    return boidsArray
  }, [count])

  // Boids parameters
  const SEPARATION_DISTANCE = 100
  const ALIGNMENT_DISTANCE = 200
  const COHESION_DISTANCE = 200
  const MAX_SPEED = 5
  const MAX_FORCE = 0.2

  const separate = (boid, boids) => {
    const steer = new THREE.Vector3()
    let count = 0

    boids.forEach((other) => {
      const distance = boid.position.distanceTo(other.position)
      if (distance > 0 && distance < SEPARATION_DISTANCE) {
        const diff = new THREE.Vector3()
          .subVectors(boid.position, other.position)
          .normalize()
          .multiplyScalar(1 / distance)
        steer.add(diff)
        count++
      }
    })

    if (count > 0) {
      steer.divideScalar(count)
      steer.setLength(MAX_SPEED)
      steer.sub(boid.velocity)
      steer.clampLength(0, MAX_FORCE)
    }

    return steer
  }

  const align = (boid, boids) => {
    const steer = new THREE.Vector3()
    let count = 0

    boids.forEach((other) => {
      const distance = boid.position.distanceTo(other.position)
      if (distance > 0 && distance < ALIGNMENT_DISTANCE) {
        steer.add(other.velocity)
        count++
      }
    })

    if (count > 0) {
      steer.divideScalar(count)
      steer.setLength(MAX_SPEED)
      steer.sub(boid.velocity)
      steer.clampLength(0, MAX_FORCE)
    }

    return steer
  }

  const cohere = (boid, boids) => {
    const steer = new THREE.Vector3()
    let count = 0

    boids.forEach((other) => {
      const distance = boid.position.distanceTo(other.position)
      if (distance > 0 && distance < COHESION_DISTANCE) {
        steer.add(other.position)
        count++
      }
    })

    if (count > 0) {
      steer.divideScalar(count)
      steer.sub(boid.position)
      steer.setLength(MAX_SPEED)
      steer.sub(boid.velocity)
      steer.clampLength(0, MAX_FORCE)
    }

    return steer
  }

  useFrame(() => {
    if (!groupRef.current || !isActive) return

    boids.forEach((boid, i) => {
      // Calculate forces
      const sep = separate(boid, boids)
      const ali = align(boid, boids)
      const coh = cohere(boid, boids)

      // Weight forces
      sep.multiplyScalar(1.5)
      ali.multiplyScalar(1.0)
      coh.multiplyScalar(1.0)

      // Add forces to acceleration
      boid.acceleration.add(sep)
      boid.acceleration.add(ali)
      boid.acceleration.add(coh)

      // Update velocity
      boid.velocity.add(boid.acceleration)
      boid.velocity.clampLength(0, MAX_SPEED)

      // Update position
      boid.position.add(boid.velocity)

      // Wrap around if out of bounds
      if (boid.position.x < -2000) boid.position.x = 2000
      if (boid.position.x > 2000) boid.position.x = -2000
      if (boid.position.z < -500) boid.position.z = 1500
      if (boid.position.z > 1500) boid.position.z = -500
      if (boid.position.y < 50) boid.position.y = 50
      if (boid.position.y > 400) boid.position.y = 400

      // Keep birds in front of camera and far away
      if (boid.position.z < camera.position.z - 200) {
        boid.position.z = camera.position.z + 800
      }

      // Reset acceleration
      boid.acceleration.multiplyScalar(0)

      // Update mesh position
      if (groupRef.current.children[i]) {
        groupRef.current.children[i].position.copy(boid.position)
        groupRef.current.children[i].scale.set(4, 4, 4)

        // Rotate to face velocity direction
        const direction = new THREE.Vector3().copy(boid.velocity).normalize()
        if (direction.length() > 0) {
          groupRef.current.children[i].lookAt(
            boid.position.x + direction.x,
            boid.position.y + direction.y,
            boid.position.z + direction.z
          )
        }
      }
    })
  })

  return (
    <group ref={groupRef}>
      {boids.map((_, i) => (
        <mesh key={i} position={[0, 0, 0]}>
          <coneGeometry args={[3, 8, 8]} />
          <meshStandardMaterial color={0x444444} emissive={0x222222} />
        </mesh>
      ))}
    </group>
  )
}

export default Boids
