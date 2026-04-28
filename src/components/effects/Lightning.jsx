import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Global audio context for thunder
let globalAudioContext = null

function Lightning({ rainIntensity }) {
  const { scene, camera } = useThree()
  const lightRef = useRef(null)
  const screenFlashRef = useRef(null)
  const timeoutRef = useRef(null)
  const lastFlashRef = useRef(0)

  // Update light position every frame to follow camera
  useFrame(() => {
    if (lightRef.current && camera) {
      // Position far above camera so it illuminates everything below
      lightRef.current.position.copy(camera.position)
      lightRef.current.position.y += 200 // 200 units above camera
    }
  })

  useEffect(() => {
    console.log('Lightning component - rainIntensity:', rainIntensity)
    
    // Create lightning for ALL weather conditions (testing mode)
    if (!rainIntensity) {
      // Clean up if no rain intensity set yet
      if (lightRef.current) {
        console.log('Removing lightning light - no rain intensity')
        scene.remove(lightRef.current)
        lightRef.current = null
      }
      if (screenFlashRef.current && camera) {
        console.log('Removing screen flash overlay')
        camera.remove(screenFlashRef.current)
        screenFlashRef.current = null
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      return
    }

    // Create lightning effect light if needed
    if (!lightRef.current) {
      console.log('Creating lightning light at camera position:', { x: camera.position.x, y: camera.position.y, z: camera.position.z })
      const lightColor = 0xffffff // White lightning
      // Make it VERY bright and far-reaching to override ambient lighting
      const light = new THREE.PointLight(lightColor, 40, 20000)
      light.position.copy(camera.position)
      light.position.y += 200 // Start 200 units above camera
      light.intensity = 0 // Start off
      scene.add(light)
      lightRef.current = light
      console.log('⚡ Lightning light ADDED to scene, checking:', {
        inScene: scene.children.includes(light),
        intensity: light.intensity,
        range: light.range,
        position: { x: light.position.x, y: light.position.y, z: light.position.z }
      })
    }

    // Create full-screen flash overlay if needed
    if (!screenFlashRef.current) {
      console.log('Creating screen flash overlay')
      // Create a plane that's always in front of camera for full-screen flash effect
      const flashGeometry = new THREE.PlaneGeometry(2, 2)
      const flashMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: false,
        side: THREE.FrontSide,
      })
      const flashMesh = new THREE.Mesh(flashGeometry, flashMaterial)
      // Position it right in front of camera so it always covers screen
      camera.add(flashMesh)
      flashMesh.position.z = -1.5
      screenFlashRef.current = flashMesh
      console.log('Screen flash overlay created and added to camera', {
        opacity: flashMesh.material.opacity,
        color: flashMesh.material.color.getHex(),
        transparent: flashMesh.material.transparent,
        position: flashMesh.position,
        geometry: flashMesh.geometry.type
      })
    }

    const playThunderSound = () => {
      try {
        if (!globalAudioContext) {
          globalAudioContext = new (window.AudioContext || window.webkitAudioContext)()
          console.log('Audio context created')
        }
        
        const audioContext = globalAudioContext
        const now = audioContext.currentTime
        const bufferSize = audioContext.sampleRate * 3
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate)
        const data = buffer.getChannelData(0)

        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() - 0.5) * 2
        }

        const source = audioContext.createBufferSource()
        source.buffer = buffer

        const filter = audioContext.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.value = 150

        const gainNode = audioContext.createGain()
        gainNode.gain.setValueAtTime(1.0, now)
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 2.5)

        source.connect(filter)
        filter.connect(gainNode)
        gainNode.connect(audioContext.destination)

        source.start(now)
        source.stop(now + 2.5)
        
        console.log('🔊 THUNDER SOUND PLAYING at volume 100%')
      } catch (e) {
        console.error('Error playing thunder:', e)
      }
    }

    const triggerLightning = () => {
      if (!lightRef.current) {
        console.log('Lightning not triggered - NO LIGHT')
        return
      }

      console.log('⚡ LIGHTNING FLASH! Intensity going to 600, screen flash opacity going to 0.8, checking light:', {
        exists: !!lightRef.current,
        inScene: scene.children.includes(lightRef.current),
        range: lightRef.current?.range,
        screenFlash: !!screenFlashRef.current,
        screenFlashOpacity: screenFlashRef.current?.material?.opacity
      })
      lastFlashRef.current = Date.now()
      
      // First peak - EXTREMELY bright (10x increase)
      lightRef.current.intensity = 600
      if (screenFlashRef.current) {
        screenFlashRef.current.material.opacity = 0.9 // Bright white flash covers screen
        console.log('Set screen flash opacity to 0.9')
      }
      
      setTimeout(() => {
        if (lightRef.current) {
          lightRef.current.intensity = 0
        }
        if (screenFlashRef.current) {
          screenFlashRef.current.material.opacity = 0
          console.log('Set screen flash opacity to 0 (off)')
        }
      }, 150)

      // Dimmer second peak after brief delay
      setTimeout(() => {
        if (lightRef.current) {
          lightRef.current.intensity = 250
        }
        if (screenFlashRef.current) {
          screenFlashRef.current.material.opacity = 0.4
          console.log('Set screen flash opacity to 0.4 (secondary)')
        }
      }, 200)

      setTimeout(() => {
        if (lightRef.current) {
          lightRef.current.intensity = 0
        }
        if (screenFlashRef.current) {
          screenFlashRef.current.material.opacity = 0
          console.log('Set screen flash opacity to 0 (off again)')
        }
      }, 350)

      // Play thunder slightly delayed to match real lightning
      setTimeout(() => {
        playThunderSound()
      }, 200)

      // Schedule next lightning strike - EVERY 3 SECONDS FOR TESTING
      const nextStrike = 3000
      console.log('Next lightning in', nextStrike, 'ms')
      timeoutRef.current = setTimeout(triggerLightning, nextStrike)
    }

    // Start first lightning strike immediately
    console.log('Starting lightning cycle')
    triggerLightning()

    return () => {
      console.log('Lightning cleanup')
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      if (screenFlashRef.current && camera) {
        camera.remove(screenFlashRef.current)
        screenFlashRef.current = null
      }
    }
  }, [scene, rainIntensity])

  return null
}

export default Lightning
