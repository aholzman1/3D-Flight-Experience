import { useEffect, useRef, forwardRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'

const FirstPersonController = forwardRef(({ camera, isActive = true, resetCount = 0 }, ref) => {
  const keys = useRef({})
  const yaw = useRef(Math.PI) // Start facing origin
  const pitch = useRef(0)
  const velocity = useRef([0, 0, 0])
  const gyroEnabled = useRef(false)
  const touchControlsEnabled = useRef(true)
  const lastTouchPosition = useRef({ x: 0, y: 0 })
  const deviceOrientation = useRef({ alpha: 0, beta: 0, gamma: 0 })
  const gyroButtonRef = useRef(null)
  
  const CAMERA_SPEED = 1.2
  const CONSTANT_FORWARD_SPEED = 0.525 // Increased by 5%
  const VERTICAL_SPEED = 0.525 // Increased by 5%
  const MOUSE_SENSITIVITY = 0.1125
  const GYRO_SENSITIVITY = 0.05 // Sensitivity for gyroscopic rotation
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

  // Request gyroscope permission (iOS 13+)
  const requestGyroPermission = (onGranted) => {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then(permissionState => {
          if (permissionState === 'granted') {
            gyroEnabled.current = true
            touchControlsEnabled.current = false
            console.log('Gyroscope permission granted')
            if (onGranted) onGranted()
          }
        })
        .catch(console.error)
    } else {
      // Non-iOS or older devices - gyro is allowed by default
      gyroEnabled.current = true
      touchControlsEnabled.current = false
      console.log('Gyroscope enabled (non-iOS device)')
      if (onGranted) onGranted()
    }
  }

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

    const handleTouchStart = (e) => {
      if (!touchControlsEnabled.current) return
      lastTouchPosition.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      }
    }

    const handleTouchMove = (e) => {
      if (!touchControlsEnabled.current) return

      const touch = e.touches[0]
      const deltaX = touch.clientX - lastTouchPosition.current.x
      const deltaY = touch.clientY - lastTouchPosition.current.y

      yaw.current -= deltaX * MOUSE_SENSITIVITY * 0.01
      pitch.current -= deltaY * MOUSE_SENSITIVITY * 0.01

      // Clamp pitch
      if (pitch.current > Math.PI / 2 - 0.1) pitch.current = Math.PI / 2 - 0.1
      if (pitch.current < -Math.PI / 2 + 0.1) pitch.current = -Math.PI / 2 + 0.1

      lastTouchPosition.current = {
        x: touch.clientX,
        y: touch.clientY,
      }
    }

    const handleDeviceOrientation = (event) => {
      if (!gyroEnabled.current) return

      // Get device orientation angles
      const alpha = event.alpha || 0 // Z axis rotation (0-360)
      const beta = event.beta || 0   // X axis rotation (-180 to 180) - pitch
      const gamma = event.gamma || 0 // Y axis rotation (-90 to 90) - roll

      // Map device orientation to camera control
      // When phone is perpendicular to floor (upright, beta=90), camera faces forward
      // Beta offset by 90 so upright phone = looking straight ahead
      pitch.current = ((beta - 90) / 90) * (Math.PI / 2 - 0.1)
      
      // Gamma controls yaw (left/right) - but add to base yaw
      // This creates a natural head-tracking feel
      yaw.current = Math.PI + (gamma / 90) * (Math.PI / 3)

      deviceOrientation.current = { alpha, beta, gamma }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('touchstart', handleTouchStart)
    document.addEventListener('touchmove', handleTouchMove)
    window.addEventListener('deviceorientation', handleDeviceOrientation)
    
    // Add button to request gyro on mobile
    const enableGyroButton = document.createElement('button')
    enableGyroButton.id = 'gyro-enable-btn'
    
    const setButtonEnabledStyle = () => {
      enableGyroButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 200;
        padding: 12px 20px;
        background: #000000;
        color: white;
        border: none;
        border-radius: 25px;
        font-size: 14px;
        font-family: 'Future', 'Futura', 'Arial', sans-serif;
        font-weight: 600;
        letter-spacing: 1px;
        cursor: pointer;
        display: block;
        transition: all 0.3s ease;
      `
    }

    const setButtonDisabledStyle = () => {
      enableGyroButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 200;
        padding: 12px 20px;
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: 2px solid white;
        border-radius: 25px;
        font-size: 14px;
        font-family: 'Future', 'Futura', 'Arial', sans-serif;
        font-weight: 600;
        letter-spacing: 1px;
        cursor: pointer;
        display: block;
        transition: all 0.3s ease;
        box-shadow: 0 8px 32px rgba(255, 255, 255, 0.2);
      `
    }

    setButtonEnabledStyle()
    enableGyroButton.textContent = 'Enable Gyro'
    
    enableGyroButton.onclick = () => {
      if (!gyroEnabled.current) {
        // Enable gyro
        requestGyroPermission(() => {
          enableGyroButton.textContent = 'Disable Gyro'
          setButtonDisabledStyle()
          enableGyroButton.onmouseover = () => {
            enableGyroButton.style.background = 'rgba(255, 255, 255, 0.3)'
            enableGyroButton.style.boxShadow = '0 12px 40px rgba(255, 255, 255, 0.3)'
            enableGyroButton.style.transform = 'translateY(-2px)'
          }
          enableGyroButton.onmouseout = () => {
            enableGyroButton.style.background = 'rgba(255, 255, 255, 0.2)'
            enableGyroButton.style.boxShadow = '0 8px 32px rgba(255, 255, 255, 0.2)'
            enableGyroButton.style.transform = 'translateY(0)'
          }
        })
      } else {
        // Disable gyro
        gyroEnabled.current = false
        touchControlsEnabled.current = true
        enableGyroButton.textContent = 'Enable Gyro'
        setButtonEnabledStyle()
        enableGyroButton.onmouseover = () => {
          enableGyroButton.style.background = '#1a1a1a'
        }
        enableGyroButton.onmouseout = () => {
          enableGyroButton.style.background = '#000000'
        }
      }
    }
    
    document.body.appendChild(enableGyroButton)

    // Show button on mobile devices
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    if (isMobile && typeof DeviceOrientationEvent !== 'undefined') {
      enableGyroButton.style.display = 'block'
    }

    document.addEventListener('click', () => {
      document.body.requestPointerLock?.()
    })

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('deviceorientation', handleDeviceOrientation)
      document.body.removeChild(enableGyroButton)
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
