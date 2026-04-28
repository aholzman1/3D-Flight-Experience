// Color schemes for different weather variations
export const colorSchemes = {
  sunset: {
    name: 'Sunset',
    skyColor: 0xffd9a3,
    fogColor: 0xffd9a3,
    fogDensity: 0.004,
    lightColor: '#fff8dc',
    lightIntensity: 1.5,
  },
  overcast: {
    name: 'Overcast',
    skyColor: 0xb0b0b0,
    fogColor: 0xa5a5a5,
    fogDensity: 0.006,
    lightColor: '#e0e0e0',
    lightIntensity: 0.9,
  },
  sunny: {
    name: 'Sunny Day',
    skyColor: 0x87ceeb,
    fogColor: 0xb0d9ff,
    fogDensity: 0.002,
    lightColor: '#ffff99',
    lightIntensity: 2.0,
  },
  stormy: {
    name: 'Stormy',
    skyColor: 0x4a4a6a,
    fogColor: 0x505070,
    fogDensity: 0.008,
    lightColor: '#d0d0e0',
    lightIntensity: 0.6,
  },
}

export const getRandomColorScheme = () => {
  const schemes = Object.values(colorSchemes)
  return schemes[Math.floor(Math.random() * schemes.length)]
}
