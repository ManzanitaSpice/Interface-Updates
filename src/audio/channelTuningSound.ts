let audioContext: AudioContext | null = null
let noiseBuffer: AudioBuffer | null = null

function getAudioContext() {
  if (typeof window === 'undefined' || typeof window.AudioContext !== 'function') return null

  if (!audioContext || audioContext.state === 'closed') {
    try {
      audioContext = new window.AudioContext()
    } catch {
      return null
    }
    noiseBuffer = null
  }

  return audioContext
}

export function playChannelTuningNoise(volume: number) {
  if (volume <= 0) return
  const context = getAudioContext()
  if (!context) return

  if (context.state === 'suspended') void context.resume().catch(() => undefined)

  if (!noiseBuffer) {
    const frameCount = Math.ceil(context.sampleRate * 0.5)
    noiseBuffer = context.createBuffer(1, frameCount, context.sampleRate)
    const samples = noiseBuffer.getChannelData(0)
    for (let index = 0; index < samples.length; index += 1) {
      samples[index] = Math.random() * 2 - 1
    }
  }

  const now = context.currentTime
  const source = context.createBufferSource()
  const filter = context.createBiquadFilter()
  const envelope = context.createGain()
  const outputGain = 0.07 * Math.min(5, volume) / 5

  source.buffer = noiseBuffer
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(3200, now)
  filter.frequency.exponentialRampToValueAtTime(460, now + 0.38)
  filter.Q.value = 0.9
  envelope.gain.setValueAtTime(0.0001, now)
  envelope.gain.exponentialRampToValueAtTime(outputGain, now + 0.018)
  envelope.gain.setValueAtTime(outputGain, now + 0.31)
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + 0.5)

  source.connect(filter)
  filter.connect(envelope)
  envelope.connect(context.destination)
  source.start(now)
  source.stop(now + 0.5)
}
