import { useMemo } from 'react'
import * as THREE from 'three'

function GodRays() {
  const rays = useMemo(() => {
    const rayArray = []
    const rayCount = 8
    const baseAngleX = Math.PI * 0.3 // Upper angle
    const baseAngleY = Math.PI * 0.25 // Right angle
    
    for (let i = 0; i < rayCount; i++) {
      const spreadX = (Math.random() - 0.5) * 0.4
      const spreadY = (Math.random() - 0.5) * 0.4
      const angleX = baseAngleX + spreadX
      const angleY = baseAngleY + spreadY
      
      // Direction from upper right
      const direction = new THREE.Vector3(
        Math.sin(angleY),
        -Math.cos(angleX),
        Math.cos(angleY)
      ).normalize()
      
      rayArray.push({
        direction,
        opacity: 0.3 + Math.random() * 0.2,
        width: 50 + Math.random() * 100,
        length: 2000
      })
    }
    
    return rayArray
  }, [])

  return (
    <group>
      {rays.map((ray, idx) => (
        <mesh
          key={idx}
          position={[
            ray.direction.x * 1000,
            500 + ray.direction.y * 800,
            ray.direction.z * 1000
          ]}
          rotation={[
            Math.atan2(ray.direction.y, Math.sqrt(ray.direction.x ** 2 + ray.direction.z ** 2)),
            Math.atan2(ray.direction.x, ray.direction.z),
            0
          ]}
        >
          <coneGeometry args={[ray.width, ray.length, 8]} />
          <meshBasicMaterial
            color={0xffd9a3}
            transparent={true}
            opacity={ray.opacity * 0.4}
            fog={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  )
}

export default GodRays
