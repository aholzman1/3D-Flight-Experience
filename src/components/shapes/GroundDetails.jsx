import { useMemo } from 'react'
import * as THREE from 'three'
import { getTerrainHeight } from '../../utils/terrain'

function GroundDetails() {
  const { grassTufts, rocks } = useMemo(() => {
    const grassTufts = []
    const rocks = []
    
    // Generate grass tufts
    for (let i = 0; i < 2400; i++) {
      const x = (Math.random() - 0.5) * 3000
      const z = (Math.random() - 0.5) * 3000
      const y = getTerrainHeight(x, z)
      
      grassTufts.push({
        x,
        y,
        z,
        scale: 0.3 + Math.random() * 0.2,
        rotation: [0, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.3]
      })
    }
    
    // Generate rocks
    for (let i = 0; i < 900; i++) {
      const x = (Math.random() - 0.5) * 3000
      const z = (Math.random() - 0.5) * 3000
      const y = getTerrainHeight(x, z)
      
      rocks.push({
        x,
        y,
        z,
        scale: 0.5 + Math.random() * 1.5,
        color: new THREE.Color(0.4 + Math.random() * 0.2, 0.4 + Math.random() * 0.2, 0.4 + Math.random() * 0.15)
      })
    }
    
    return { grassTufts, rocks }
  }, [])

  return (
    <>
      {/* Grass tufts */}
      {grassTufts.map((grass, idx) => (
        <group key={`grass-${idx}`} position={[grass.x, grass.y, grass.z]} rotation={grass.rotation}>
          <mesh scale={[grass.scale, grass.scale * 1.5, grass.scale]} castShadow receiveShadow>
            <coneGeometry args={[1, 2, 4]} />
            <meshStandardMaterial color="#4a9d5f" roughness={0.9} metalness={0} />
          </mesh>
        </group>
      ))}
      
      {/* Rocks */}
      {rocks.map((rock, idx) => (
        <mesh
          key={`rock-${idx}`}
          position={[rock.x, rock.y + rock.scale * 0.5, rock.z]}
          scale={[rock.scale, rock.scale * 0.7, rock.scale]}
          castShadow
          receiveShadow
        >
          <icosahedronGeometry args={[1, 2]} />
          <meshStandardMaterial color={rock.color} roughness={0.95} metalness={0} />
        </mesh>
      ))}
    </>
  )
}

export default GroundDetails
