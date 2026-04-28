import { Canvas } from '@react-three/fiber'
import { useEffect, useState } from 'react'
import * as THREE from 'three'
import Scene from './components/Scene'
import Landing from './pages/Landing'
import Info from './pages/Info'
import './App.css'

function App() {
  const [page, setPage] = useState('landing') // 'landing', 'experience', 'info'
  const [isActive, setIsActive] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [resetCount, setResetCount] = useState(0)

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

  // Landing page
  if (page === 'landing') {
    return <Landing onStartExperience={() => setPage('experience')} onInfo={() => setPage('info')} />
  }

  // Info page
  if (page === 'info') {
    return <Info onBack={() => setPage('landing')} />
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
          shadowMap: { enabled: true, type: THREE.PCFShadowMap }
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
