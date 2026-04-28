import { useEffect, useRef, forwardRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'

const FirstPersonController = forwardRef(({ camera, isActive = true, resetCount = 0 }, ref) => {
  const keys = useRef({})
  const yaw = useRef(Math.PI) // Start facing origin
  const pitch = useRef(0)
  const velocity = useRef([0, 0, 0])
  
  const CAMERA_SPEED = 1.2
  const CONSTANT_FORWARD_SPEED = 0.525 // Increased by 5%
  const VERTICAL_SPEED = 0.525 // Increased by 5%
  const MOUSE_SENSITIVITY = 0.1125
  const MIN_HEIGHT = 1.0
  const MAX_HEIGHT = 190  // Doubled from 95

  // Reset camera position and orientation when resetCount changes
  useEffect(() => {
    if (camera) {
      camera.position.set(0, 51, 1200)
      yaw.current = Math.PI
      pitch.current = 0
    }
  }, [resetCount, camera])

  useEffect(() => {
    const handleKeyDown = (e) => {
      keys.current[e.key.toLowerCase()] = true
    }

    const handleKeyUp = (e) => {
      keys.current[e.key.toLowerCase()] = false
    }

    const handleMouseMove = (e) => {
      // Only update camera if pointer is locked
      if (document.pointerLockElement) {
        const deltaX = e.movementX || 0
        const deltaY = e.movementY || 0

        yaw.current -= deltaX * MOUSE_SENSITIVITY * 0.01
        pitch.current -= deltaY * MOUSE_SENSITIVITY * 0.01

        // Clamp pitch
        if (pitch.current > Math.PI / 2 - 0.1) pitch.current = Math.PI / 2 - 0.1
        if (pitch.current < -Math.PI / 2 + 0.1) pitch.current = -Math.PI / 2 + 0.1
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('click', () => {
      document.body.requestPointerLock?.()
    })

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  useFrame(() => {
    // Calculate forward vectors - one for movement (horizontal only), one for looking
    const forwardHorizontal = [
      Math.sin(yaw.current),
      0,
      Math.cos(yaw.current),
    ]

    const forwardLook = [
      Math.sin(yaw.current) * Math.cos(pitch.current),
      Math.sin(pitch.current),
      Math.cos(yaw.current) * Math.cos(pitch.current),
    ]

    const right = [Math.cos(yaw.current), 0, -Math.sin(yaw.current)]

    // Handle movement
    const acc = [0, 0, 0]

    // Only move if simulation is active
    if (isActive) {
      // Always move forward at constant speed
      acc[0] += forwardHorizontal[0] * CONSTANT_FORWARD_SPEED
      acc[2] += forwardHorizontal[2] * CONSTANT_FORWARD_SPEED
    }
    
    // Strafing uses same constant speed for smooth motion
    if (keys.current['a']) {
      acc[0] += right[0] * CONSTANT_FORWARD_SPEED
      acc[2] += right[2] * CONSTANT_FORWARD_SPEED
    }
    if (keys.current['d']) {
      acc[0] -= right[0] * CONSTANT_FORWARD_SPEED
      acc[2] -= right[2] * CONSTANT_FORWARD_SPEED
    }
    if (keys.current[' ']) {
      acc[1] += VERTICAL_SPEED
    }
    if (keys.current['shift']) {
      acc[1] -= VERTICAL_SPEED
    }

    // Update position (no collision detection)
    camera.position.x += acc[0]
    camera.position.y += acc[1]
    camera.position.z += acc[2]

    // Clamp height
    if (camera.position.y < MIN_HEIGHT) camera.position.y = MIN_HEIGHT
    if (camera.position.y > MAX_HEIGHT) camera.position.y = MAX_HEIGHT

    // Clamp horizontal bounds - invisible boundary box
    const BOUNDARY = 1800
    if (camera.position.x < -BOUNDARY) camera.position.x = -BOUNDARY
    if (camera.position.x > BOUNDARY) camera.position.x = BOUNDARY
    if (camera.position.z < -BOUNDARY) camera.position.z = -BOUNDARY
    if (camera.position.z > BOUNDARY) camera.position.z = BOUNDARY

    // Update camera look direction
    const lookAt = [
      camera.position.x + forwardLook[0],
      camera.position.y + forwardLook[1],
      camera.position.z + forwardLook[2],
    ]

    camera.lookAt(lookAt[0], lookAt[1], lookAt[2])
  })

  return null
})

FirstPersonController.displayName = 'FirstPersonController'

export default FirstPersonController
