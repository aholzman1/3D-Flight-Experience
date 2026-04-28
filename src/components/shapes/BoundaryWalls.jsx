import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import * as THREE from 'three'

function BoundaryWall({ position, rotation, wallColor }, ref) {
  const meshRef = useRef()

  useEffect(() => {
    if (meshRef.current && wallColor) {
      const r = Math.max(0, Math.min(1, wallColor[0]))
      const g = Math.max(0, Math.min(1, wallColor[1]))
      const b = Math.max(0, Math.min(1, wallColor[2]))
      meshRef.current.material.color.setRGB(r, g, b)
    }
  }, [wallColor])

  useImperativeHandle(ref, () => meshRef.current, [])

  return (
    <mesh ref={meshRef} position={position} rotation={rotation}>
      <planeGeometry args={[400, 200]} />
      <meshStandardMaterial 
        color={new THREE.Color(wallColor ? wallColor[0] : 1, wallColor ? wallColor[1] : 1, wallColor ? wallColor[2] : 1)} 
        transparent
        opacity={0.15}
      />
    </mesh>
  )
}

const ForwardedBoundaryWall = forwardRef(BoundaryWall)

function GridLines({ position, rotation, wallColor }) {
  const meshRef = useRef()

  useEffect(() => {
    if (!meshRef.current) return

    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 512
    const ctx = canvas.getContext('2d')

    // Transparent background
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Semi-transparent dark grid lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)'
    ctx.lineWidth = 3

    // Vertical lines
    for (let i = 0; i <= 20; i++) {
      const x = (i / 20) * canvas.width
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }

    // Horizontal lines
    for (let i = 0; i <= 10; i++) {
      const y = (i / 10) * canvas.height
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }

    const texture = new THREE.CanvasTexture(canvas)
    meshRef.current.material.map = texture
    meshRef.current.material.needsUpdate = true
  }, [])

  return (
    <mesh ref={meshRef} position={position} rotation={rotation}>
      <planeGeometry args={[400, 200]} />
      <meshStandardMaterial 
        color={new THREE.Color(wallColor ? wallColor[0] : 1, wallColor ? wallColor[1] : 1, wallColor ? wallColor[2] : 1)}
        map={null}
        transparent={true}
      />
    </mesh>
  )
}

function BoundaryWalls({ wallColor }, ref) {
  const wallRefs = useRef([])

  useImperativeHandle(ref, () => ({
    updateColor: (color) => {
      wallRefs.current.forEach((meshRef) => {
        if (meshRef && meshRef.material) {
          const r = Math.max(0, Math.min(1, color[0]))
          const g = Math.max(0, Math.min(1, color[1]))
          const b = Math.max(0, Math.min(1, color[2]))
          meshRef.material.color.setRGB(r, g, b)
        }
      })
    },
  }), [])

  return (
    <group>
      {/* Back wall */}
      <ForwardedBoundaryWall 
        ref={(el) => (wallRefs.current[0] = el)} 
        position={[0, 50, -100]} 
        rotation={[0, 0, 0]} 
        wallColor={wallColor} 
      />
      <GridLines position={[0, 50, -99.9]} rotation={[0, 0, 0]} wallColor={wallColor} />

      {/* Front wall */}
      <ForwardedBoundaryWall 
        ref={(el) => (wallRefs.current[1] = el)} 
        position={[0, 50, 100]} 
        rotation={[0, Math.PI, 0]} 
        wallColor={wallColor} 
      />
      <GridLines position={[0, 50, 99.9]} rotation={[0, Math.PI, 0]} wallColor={wallColor} />

      {/* Left wall */}
      <ForwardedBoundaryWall 
        ref={(el) => (wallRefs.current[2] = el)} 
        position={[-100, 50, 0]} 
        rotation={[0, Math.PI / 2, 0]} 
        wallColor={wallColor} 
      />
      <GridLines position={[-99.9, 50, 0]} rotation={[0, Math.PI / 2, 0]} wallColor={wallColor} />

      {/* Right wall */}
      <ForwardedBoundaryWall 
        ref={(el) => (wallRefs.current[3] = el)} 
        position={[100, 50, 0]} 
        rotation={[0, -Math.PI / 2, 0]} 
        wallColor={wallColor} 
      />
      <GridLines position={[99.9, 50, 0]} rotation={[0, -Math.PI / 2, 0]} wallColor={wallColor} />
    </group>
  )
}

export default forwardRef(BoundaryWalls)
