import { useGLTF } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'

// Seeded random number generator for deterministic colors
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function Tree({ opacity, rotation, treeIndex, x, z }) {
  const modelPath = `/models/tree${treeIndex}.glb`
  
  // Cache the loaded GLB to avoid reloading
  const { scene } = useGLTF(modelPath)
  
  const clonedScene = useMemo(() => {
    const cloned = scene.clone(true)
    
    // Generate deterministic colors based on tree position
    const seed = (x * 73856093) ^ (z * 19349663) ^ (treeIndex * 83492791)
    
    const getColorVariation = (baseR, baseG, baseB) => {
      const variation = 0.35
      const r = Math.max(0, Math.min(1, baseR + (seededRandom(seed + 1) - 0.5) * variation))
      const g = Math.max(0, Math.min(1, baseG + (seededRandom(seed + 2) - 0.5) * variation))
      const b = Math.max(0, Math.min(1, baseB + (seededRandom(seed + 3) - 0.5) * variation))
      
      // 50% darker
      return new THREE.Color(r * 0.5, g * 0.5, b * 0.5)
    }
    
    // Green for leaves: brighter green base with variation
    const leafColor = getColorVariation(0.25, 0.65, 0.05)
    
    // Brown for trunks: warm browns with minimal blue (reduce purple tones)
    const trunkColor = getColorVariation(0.45, 0.28, 0.02)
    
    // First pass: count total meshes
    let totalMeshes = 0
    cloned.traverse((node) => {
      if (node.isMesh) totalMeshes++
    })
    
    // Second pass: color meshes
    let currentMeshIndex = 0
    cloned.traverse((node) => {
      if (node.isMesh) {
        // First 35% of meshes = brown (trunk), rest = green (leaves)
        const isTrunkMesh = currentMeshIndex < totalMeshes * 0.35
        currentMeshIndex++
        
        if (Array.isArray(node.material)) {
          node.material = node.material.map((mat, idx) => {
            const clonedMat = mat.clone()
            
            if (isTrunkMesh) {
              clonedMat.color = trunkColor // Use varied brown
            } else {
              clonedMat.color = leafColor // Green
            }
            
            clonedMat.map = null
            clonedMat.normalMap = null
            clonedMat.transparent = false
            clonedMat.side = THREE.DoubleSide
            clonedMat.metalness = 0
            clonedMat.roughness = 0.7
            clonedMat.flatShading = false
            
            return clonedMat
          })
        } else if (node.material) {
          node.material = node.material.clone()
          
          if (isTrunkMesh) {
            node.material.color = trunkColor // Use varied brown
          } else {
            node.material.color = leafColor // Green
          }
          
          node.material.map = null
          node.material.normalMap = null
          node.material.transparent = false
          node.material.side = THREE.DoubleSide
          node.material.metalness = 0
          node.material.roughness = 0.7
          node.material.flatShading = false
        }
        
        node.castShadow = true
        node.receiveShadow = true
      }
    })
    
    return cloned
  }, [scene, opacity, x, z, treeIndex])

  return (
    <primitive 
      object={clonedScene} 
      rotation={rotation}
      scale={[6, 6, 6]}
    />
  )
}

export default Tree
