import { useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import Tree from './Tree'

function SceneObjects({ objects }) {
  const { camera } = useThree()
  const [visibleTrees, setVisibleTrees] = useState([])

  // Update visible trees every frame based on camera position
  useFrame(() => {
    const MAX_DISTANCE = 500 // Only render trees within 500 units
    const cameraPos = camera.position
    
    const filtered = objects.filter(obj => {
      const dx = obj.x - cameraPos.x
      const dz = obj.z - cameraPos.z
      const distance = Math.sqrt(dx * dx + dz * dz)
      return distance < MAX_DISTANCE
    })
    
    setVisibleTrees(filtered)
  })

  return (
    <group>
      {visibleTrees.map((obj, idx) => (
        <group key={idx} position={[obj.x, obj.yOffset || 0, obj.z]}>
          <Tree opacity={1.0} rotation={obj.rotation} treeIndex={obj.treeIndex} x={obj.x} z={obj.z} />
        </group>
      ))}
    </group>
  )
}

export default SceneObjects
