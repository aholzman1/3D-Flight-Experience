import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useEffect } from 'react'

function SoftEffects({ colorScheme }) {
  const { scene, camera } = useThree()

  useEffect(() => {
    if (!colorScheme) return

    // Add soft fog for atmospheric depth
    const fog = new THREE.Fog(
      colorScheme.fogColor,
      2500,  // far distance where fog reaches full opacity
      500    // near distance where fog starts
    )
    scene.fog = fog

    // Adjust camera settings for softer appearance
    camera.far = 3500
    camera.near = 0.1
    camera.updateProjectionMatrix()

    return () => {
      scene.fog = null
    }
  }, [scene, camera, colorScheme])

  return null
}

export default SoftEffects

