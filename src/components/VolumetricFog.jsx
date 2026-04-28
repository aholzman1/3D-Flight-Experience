import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

function VolumetricFog({ colorScheme }) {
  const { scene } = useThree()

  useEffect(() => {
    // Get color scheme values (default to sunset if not provided)
    const scheme = colorScheme || {
      lightColor: '#fff8dc',
      lightIntensity: 1.5,
      fogColor: 0xffd9a3,
      fogDensity: 0.004,
    }

    // Add volumetric light
    const light = new THREE.PointLight(scheme.lightColor, scheme.lightIntensity, 1500)
    light.position.set(100, 150, 100)
    scene.add(light)

    // Add exponential fog for atmospheric effect
    scene.fog = new THREE.FogExp2(scheme.fogColor, scheme.fogDensity)

    return () => {
      scene.remove(light)
      scene.fog = null
    }
  }, [scene, colorScheme])

  return null
}

export default VolumetricFog

