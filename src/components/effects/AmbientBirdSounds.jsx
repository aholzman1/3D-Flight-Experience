import { useEffect, useRef } from 'react'

function AmbientBirdSounds({ rainIntensity = 'normal', isActive = true }) {
  const audioContextRef = useRef(null)
  const isPlayingRef = useRef(false)
  const rainIntensityRef = useRef(rainIntensity)
  const playingSourcesRef = useRef([]) // Track active sources to stop them

  // Update ref when rainIntensity changes
  useEffect(() => {
    rainIntensityRef.current = rainIntensity
  }, [rainIntensity])

  useEffect(() => {
    // Initialize audio context
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    audioContextRef.current = audioContext

    const playThunder = () => {
      if (!isPlayingRef.current) return

      const now = audioContextRef.current.currentTime
      const bufferSize = audioContextRef.current.sampleRate * 3 // 3 second buffer
      const buffer = audioContextRef.current.createBuffer(1, bufferSize, audioContextRef.current.sampleRate)
      const data = buffer.getChannelData(0)

      // Generate low frequency rumble for thunder
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() - 0.5) * 2
      }

      const source = audioContextRef.current.createBufferSource()
      source.buffer = buffer

      // Low pass filter for deep thunder sound
      const filter = audioContextRef.current.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 200

      const gainNode = audioContextRef.current.createGain()
      gainNode.gain.setValueAtTime(0.15, now)
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 2.5)

      source.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(audioContextRef.current.destination)

      source.start(now)
      source.stop(now + 2.5)
    }

    const playLightningAndThunder = () => {
      if (rainIntensityRef.current !== 'heavy' || !isPlayingRef.current) return

      // Random interval between lightning strikes (15-30 seconds)
      const nextStrike = 15000 + Math.random() * 15000

      setTimeout(() => {
        if (!isPlayingRef.current) return
        
        // Play thunder sound
        playThunder()

        // Schedule next lightning strike
        playLightningAndThunder()
      }, nextStrike)
    }

    const playBirdChirp = () => {
      if (!audioContextRef.current) return

      const now = audioContextRef.current.currentTime
      const oscillator = audioContextRef.current.createOscillator()
      const gainNode = audioContextRef.current.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContextRef.current.destination)

      // Random bird chirp frequency pattern
      const baseFreq = 2000 + Math.random() * 2000
      const duration = 0.1 + Math.random() * 0.2

      oscillator.frequency.setValueAtTime(baseFreq, now)
      oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 0.6, now + duration)

      gainNode.gain.setValueAtTime(0.05, now)
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration)

      oscillator.start(now)
      oscillator.stop(now + duration)
    }

    const playWindGust = () => {
      if (!audioContextRef.current) return

      const now = audioContextRef.current.currentTime
      const bufferSize = audioContextRef.current.sampleRate * 2 // 2 second buffer
      const buffer = audioContextRef.current.createBuffer(1, bufferSize, audioContextRef.current.sampleRate)
      const data = buffer.getChannelData(0)

      // Generate white noise filtered to low frequencies (wind sound)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() - 0.5) * 2
      }

      const source = audioContextRef.current.createBufferSource()
      source.buffer = buffer

      // Create filter for wind sound (low pass)
      const filter = audioContextRef.current.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 800

      const gainNode = audioContextRef.current.createGain()
      gainNode.gain.setValueAtTime(0.08, now)
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.5)

      source.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(audioContextRef.current.destination)

      source.start(now)
      source.stop(now + 1.5)
    }

    const playRustle = () => {
      if (!audioContextRef.current) return

      const now = audioContextRef.current.currentTime
      const bufferSize = audioContextRef.current.sampleRate * 0.5 // 0.5 second buffer
      const buffer = audioContextRef.current.createBuffer(1, bufferSize, audioContextRef.current.sampleRate)
      const data = buffer.getChannelData(0)

      // Generate filtered noise for rustling
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() - 0.5) * 2
      }

      const source = audioContextRef.current.createBufferSource()
      source.buffer = buffer

      // High pass filter for rustle
      const filter = audioContextRef.current.createBiquadFilter()
      filter.type = 'highpass'
      filter.frequency.value = 2000

      const gainNode = audioContextRef.current.createGain()
      gainNode.gain.setValueAtTime(0.04, now)
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5)

      source.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(audioContextRef.current.destination)

      source.start(now)
      source.stop(now + 0.5)
    }

    const playConstantWind = () => {
      if (!isPlayingRef.current) return

      const now = audioContextRef.current.currentTime
      const bufferSize = audioContextRef.current.sampleRate * 3 // 3 second buffer
      const buffer = audioContextRef.current.createBuffer(1, bufferSize, audioContextRef.current.sampleRate)
      const data = buffer.getChannelData(0)

      // Generate filtered white noise for constant wind
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() - 0.5) * 2
      }

      const source = audioContextRef.current.createBufferSource()
      source.buffer = buffer
      source.loop = true

      // Create filter for wind sound
      const filter = audioContextRef.current.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 600

      const gainNode = audioContextRef.current.createGain()
      // Adjust wind volume based on rain intensity: 10% when no rain, 4% with normal rain, 15% with heavy rain
      let windVolume = 0.04
      if (rainIntensityRef.current === 'none') {
        windVolume = 0.10
      } else if (rainIntensityRef.current === 'heavy') {
        windVolume = 0.15
      }
      gainNode.gain.setValueAtTime(windVolume, now)

      source.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(audioContextRef.current.destination)

      source.start(now)
      playingSourcesRef.current.push({ source, gainNode })

      return { source, gainNode }
    }

    const playRainSound = () => {
      if (!isPlayingRef.current) return

      const now = audioContextRef.current.currentTime
      const bufferSize = audioContextRef.current.sampleRate * 8 // 8 second rain sound
      const buffer = audioContextRef.current.createBuffer(1, bufferSize, audioContextRef.current.sampleRate)
      const data = buffer.getChannelData(0)

      // Generate white noise for rain sound
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() - 0.5) * 2
      }

      const source = audioContextRef.current.createBufferSource()
      source.buffer = buffer
      source.loop = true

      // Create multiple filters for rain texture
      const filter1 = audioContextRef.current.createBiquadFilter()
      filter1.type = 'highpass'
      filter1.frequency.value = 1500

      const filter2 = audioContextRef.current.createBiquadFilter()
      filter2.type = 'lowpass'
      filter2.frequency.value = 8000

      const gainNode = audioContextRef.current.createGain()
      // Adjust rain volume based on intensity: 5% normal, 25% heavy
      const rainVolume = rainIntensityRef.current === 'heavy' ? 0.25 : 0.05
      gainNode.gain.setValueAtTime(rainVolume, now)

      source.connect(filter1)
      filter1.connect(filter2)
      filter2.connect(gainNode)
      gainNode.connect(audioContextRef.current.destination)

      source.start(now)
      playingSourcesRef.current.push({ source, gainNode })

      return { source, gainNode }
    }

    const playRandomForestSound = () => {
      if (!isPlayingRef.current) return

      // Bird chirps only
      const chirpCount = 2 + Math.floor(Math.random() * 3)
      let delay = 0

      for (let i = 0; i < chirpCount; i++) {
        setTimeout(() => {
          playBirdChirp()
        }, delay)
        delay += 100 + Math.random() * 200
      }

      // Schedule next bird chirps (less frequent)
      const nextDelay = 4000 + Math.random() * 5000
      setTimeout(playRandomForestSound, nextDelay)
    }

    // Resume audio context on user interaction
    const resumeAudio = () => {
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume()
      }
      isPlayingRef.current = true
      playConstantWind() // Start constant background wind
      if (rainIntensityRef.current !== 'none') {
        playRainSound() // Start rain sound if not in 'none' state
      }
      if (rainIntensityRef.current === 'heavy') {
        playLightningAndThunder() // Start lightning and thunder for heavy rain
      }
      playRandomForestSound() // Start occasional bird chirps
      document.removeEventListener('click', resumeAudio)
    }

    document.addEventListener('click', resumeAudio)

    return () => {
      document.removeEventListener('click', resumeAudio)
      isPlayingRef.current = false
    }
  }, [rainIntensity])

  // Stop all audio when experience ends
  useEffect(() => {
    if (!isActive) {
      // Stop all playing sources
      playingSourcesRef.current.forEach(({ source, gainNode }) => {
        try {
          source.stop()
          gainNode.gain.setValueAtTime(0, audioContextRef.current?.currentTime || 0)
        } catch (e) {
          // Ignore errors if source already stopped
        }
      })
      playingSourcesRef.current = []
      isPlayingRef.current = false
      console.log('All audio stopped')
    }
  }, [isActive])

  return null
}

export default AmbientBirdSounds
