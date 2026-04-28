function Cylinder({ radius, height, opacity = 1 }) {
  return (
    <mesh castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius, height, 8, 1]} />
      <meshStandardMaterial 
        color="#1a5c1a"
        transparent
        opacity={opacity}
      />
    </mesh>
  )
}

export default Cylinder
