import { useMemo } from 'react'
import * as THREE from 'three'
import { getTerrainHeight } from '../../utils/terrain'

// Simple noise function for color patches - creates more frequent variation
function getNoisePatch(x, z) {
  const scale = 0.01
  const noise = Math.sin(x * scale) * Math.cos(z * scale) + Math.sin(x * scale * 0.5) * Math.cos(z * scale * 0.5) * 0.5
  return noise
}

function Ground() {
  const { geometry, material } = useMemo(() => {
    const width = 4000
    const depth = 4000
    const widthSegments = 640
    const depthSegments = 640
    
    // Create plane geometry
    const geo = new THREE.PlaneGeometry(width, depth, widthSegments, depthSegments)
    geo.rotateX(-Math.PI / 2)
    
    // Get position attribute BEFORE any modifications
    const posAttribute = geo.getAttribute('position')
    const posAttr = posAttribute
    
    // Create color attribute based on ORIGINAL flat positions
    const colors = new Float32Array(posAttr.count * 3)
    
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i)
      const z = posAttr.getZ(i)
      
      // Get noise value for color variation
      const noise = getNoisePatch(x, z)
      
      let r, g, b
      
      // Heavily weight green, darker brown
      if (noise > 0.1) {
        // Dark forest green patches
        r = 0.2
        g = 0.35
        b = 0.12
      } else if (noise > -0.4) {
        // Grass green patches  
        r = 0.35
        g = 0.5
        b = 0.2
      } else if (noise > -0.7) {
        // Orange/brown sandy patches
        r = 0.65
        g = 0.45
        b = 0.25
      } else {
        // Very dark brown earth patches
        r = 0.25
        g = 0.18
        b = 0.1
      }
      
      colors[i * 3] = r
      colors[i * 3 + 1] = g
      colors[i * 3 + 2] = b
    }
    
    // Set color attribute BEFORE modifying positions
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    
    // NOW apply height displacement
    const positions = posAttr.array
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i]
      const z = positions[i + 2]
      
      // Generate height using procedural noise
      const heightValue = getTerrainHeight(x, z)
      positions[i + 1] = heightValue
    }
    
    // Mark position attribute as needs update
    posAttr.needsUpdate = true
    
    // Compute normals for proper lighting
    geo.computeVertexNormals()
    geo.normalizeNormals()
    
    // Create material with vertex colors enabled and shadow support
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.7,
      metalness: 0,
      shadowSide: THREE.FrontSide
    })
    
    console.log('Ground geometry created with', geo.attributes.position.count, 'vertices')
    console.log('Color attribute exists:', geo.hasAttribute('color'))
    console.log('Material vertexColors:', mat.vertexColors)
    
    return { geometry: geo, material: mat }
  }, [])

  return (
    <mesh position={[0, 0, 0]} geometry={geometry} material={material} receiveShadow={true} castShadow={true} />
  )
}

export default Ground


