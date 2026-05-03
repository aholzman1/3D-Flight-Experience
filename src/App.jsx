import { Canvas } from '@react-three/fiber'
import { useEffect, useState } from 'react'
import * as THREE from 'three'
import Scene from './components/Scene'
import LandingSceneBackground from './components/LandingSceneBackground'
import Landing from './pages/Landing'
import Info from './pages/Info'
import { getTerrainHeight } from './utils/terrain'
import { getRandomColorScheme } from './utils/colorSchemes'
import './App.css'

function App() {
  const [page, setPage] = useState('landing') // 'landing', 'experience', 'info'
  const [isActive, setIsActive] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [resetCount, setResetCount] = useState(0)
  const [objects, setObjects] = useState([])
  const [colorScheme, setColorScheme] = useState(null)

  // Generate trees and color scheme for landing background
  useEffect(() => {
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
    
    setObjects(generateTrees())
    // Always use sunset for landing page
    const sunsetScheme = { name: 'Sunset', skyColor: 0xffd9a3, fogColor: 0xffd9a3, fogDensity: 0.004, lightColor: '#fff8dc', lightIntensity: 1.5 }
    setColorScheme(sunsetScheme)
  }, [])

  // Handle Escape key to pause/unpause
  useEffect(() => {
    if (page !== 'experience') return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsPaused(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [page])

  // Stop simulation after 60 seconds (1 minute)
  useEffect(() => {
    if (!isActive) return

    const timer = setTimeout(() => {
      setIsActive(false)
      console.log('Simulation ended - 60 seconds reached')
    }, 60000)

    return () => clearTimeout(timer)
  }, [isActive])

  const handleRestart = () => {
    setResetCount(prev => prev + 1)
    setIsActive(true)
  }

  // Landing page with background scene
  if (page === 'landing') {
    return (
      <div className="app-landing">
        <Canvas
          className="landing-canvas"
          camera={{
            position: [200, 120, 800],
            fov: 45,
            near: 0.1,
            far: 5000,
          }}
          gl={{ 
            antialias: true, 
            shadowMap: { 
              enabled: true, 
              type: THREE.VSMShadowMap,
              autoUpdate: true
            }
          }}
        >
          {colorScheme && <LandingSceneBackground objects={objects} colorScheme={colorScheme} />}
        </Canvas>
        <div className="landing-fade-overlay"></div>
        <Landing onStartExperience={() => setPage('experience')} onInfo={() => setPage('info')} />
      </div>
    )
  }

  // Info page with background scene
  if (page === 'info') {
    return (
      <div className="app-info">
        <Canvas
          className="info-canvas"
          camera={{
            position: [0, 150, 600],
            fov: 45,
            near: 0.1,
            far: 5000,
          }}
          gl={{ 
            antialias: true, 
            shadowMap: { 
              enabled: true, 
              type: THREE.VSMShadowMap,
              autoUpdate: true
            }
          }}
        >
          {colorScheme && objects.length > 0 && <LandingSceneBackground objects={objects} colorScheme={colorScheme} />}
        </Canvas>
        <Info onBack={() => setPage('landing')} />
      </div>
    )
  }

  // Experience page
  return (
    <div className="app">
      <Canvas
        camera={{
          position: [0, 64, 1200],
          fov: 45,
          near: 0.1,
          far: 5000,
        }}
        gl={{ 
          antialias: true, 
          shadowMap: { 
            enabled: true, 
            type: THREE.VSMShadowMap,
            autoUpdate: true
          }
        }}
      >
        <Scene isActive={isActive && !isPaused} resetCount={resetCount} />
      </Canvas>
      
      {/* Menu overlay for pause/end screen */}
      {(isPaused || !isActive) && (
        <div className="end-screen">
          <button className="restart-button" onClick={() => {
            if (!isActive) {
              handleRestart()
            } else {
              setIsPaused(false)
            }
          }}>
            {!isActive ? 'Restart' : 'Resume'}
          </button>
          <button className="back-button" onClick={() => setPage('landing')}>
            Home
          </button>
        </div>
      )}
    </div>
  )
}

export default App
