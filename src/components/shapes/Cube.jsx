function Cube({ size, opacity = 1 }) {
  return (
    <mesh castShadow receiveShadow>
      <boxGeometry args={[size, size, size]} />
      <meshStandardMaterial 
        color="#2a2a2a"
        transparent
        opacity={opacity}
      />
    </mesh>
  )
}

export default Cube
