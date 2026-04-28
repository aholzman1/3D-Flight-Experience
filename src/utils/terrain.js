// Procedural terrain utilities

function perlinNoise(x, y, scale = 1) {
  let value = 0
  let amplitude = 1
  let frequency = 1
  let maxAmplitude = 0

  for (let i = 0; i < 4; i++) {
    const sampleX = x * frequency * scale
    const sampleY = y * frequency * scale
    
    value += Math.sin(sampleX) * Math.cos(sampleY) * amplitude
    maxAmplitude += amplitude
    
    amplitude *= 0.5
    frequency *= 2
  }

  return (value / maxAmplitude + 1) / 2
}

// Get terrain height at any x, z position
export function getTerrainHeight(x, z) {
  const heightValue = perlinNoise(x, z, 0.0004) * 120 - 60 // Range: -60 to +60
  return heightValue
}
