import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import * as THREE from 'three'

function Skybox({ colorScheme }) {
  const { scene } = useThree()

  useEffect(() => {
    // Set background color to match fog color for seamless blending
    const color = colorScheme?.skyColor || 0xffd9a3
    scene.background = new THREE.Color(color)
  }, [scene, colorScheme])

  return null
}

export default Skybox
