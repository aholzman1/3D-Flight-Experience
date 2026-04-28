import * as THREE from 'three'

function Pyramid({ height, opacity = 1 }) {
  const baseSize = height / 2

  const vertices = [
    // Apex
    0, height, 0,
    // Base vertices
    -baseSize, 0, baseSize,
    baseSize, 0, baseSize,
    baseSize, 0, -baseSize,
    -baseSize, 0, -baseSize,
  ]

  const indices = [
    // Front
    0, 1, 2,
    // Right
    0, 2, 3,
    // Back
    0, 3, 4,
    // Left
    0, 4, 1,
    // Bottom face
    1, 2, 3,
    1, 3, 4,
  ]

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3))
  geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1))
  geometry.computeVertexNormals()

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial 
        color="#964b00"
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

export default Pyramid
