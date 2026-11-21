import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { playChannelTuningNoise } from '../audio/channelTuningSound'
import { useInterfaceStore } from '../state/interfaceStore'
import type { PageId } from '../types'
import { useTvStore } from '../state/tvStore'
import { TV_CONTROL_CALIBRATION, type TvControlCalibration, type TvControlId, type TvControlTransform } from './screenCalibration'

interface HumSynth {
  context: AudioContext
  master: GainNode
  oscillators: OscillatorNode[]
}

const pageByChannel: PageId[] = ['home', 'updates', 'downloads', 'roadmap']
const rapidTuneThreshold = 22
const rapidTuneGapMs = 750

function createHumSynth(): HumSynth {
  const context = new AudioContext()
  const master = context.createGain()
  const filter = context.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 230
  filter.Q.value = 0.55
  master.gain.value = 0
  filter.connect(master)
  master.connect(context.destination)

  const first = context.createOscillator()
  first.type = 'sine'
  first.frequency.value = 60
  const second = context.createOscillator()
  second.type = 'sine'
  second.frequency.value = 120
  const harmonicGain = context.createGain()
  harmonicGain.gain.value = 0.11
  first.connect(filter)
  second.connect(harmonicGain)
  harmonicGain.connect(filter)
  first.start()
  second.start()
  return { context, master, oscillators: [first, second] }
}

function updateHum(synth: HumSynth | null, poweredOn: boolean, volume: number) {
  if (!synth) return
  if (synth.context.state === 'suspended') void synth.context.resume().catch(() => undefined)
  const now = synth.context.currentTime
  synth.master.gain.cancelScheduledValues(now)
  synth.master.gain.setTargetAtTime(poweredOn ? volume * 0.005 : 0, now, 0.065)
}

function playPowerTone(synth: HumSynth | null, turningOn: boolean) {
  if (!synth) return
  const { context } = synth
  if (context.state === 'suspended') void context.resume().catch(() => undefined)

  const now = context.currentTime
  const tone = context.createOscillator()
  const envelope = context.createGain()
  const filter = context.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 1150
  tone.type = 'triangle'
  tone.frequency.setValueAtTime(turningOn ? 108 : 440, now)
  tone.frequency.exponentialRampToValueAtTime(turningOn ? 440 : 92, now + 0.28)
  envelope.gain.setValueAtTime(0.0001, now)
  envelope.gain.exponentialRampToValueAtTime(0.045, now + 0.018)
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + 0.34)
  tone.connect(filter)
  filter.connect(envelope)
  envelope.connect(context.destination)
  tone.start(now)
  tone.stop(now + 0.36)

  const noiseBuffer = context.createBuffer(1, Math.ceil(context.sampleRate * 0.028), context.sampleRate)
  const noiseData = noiseBuffer.getChannelData(0)
  for (let index = 0; index < noiseData.length; index += 1) {
    noiseData[index] = (Math.random() * 2 - 1) * (1 - index / noiseData.length)
  }
  const noise = context.createBufferSource()
  const noiseGain = context.createGain()
  const noiseFilter = context.createBiquadFilter()
  noise.buffer = noiseBuffer
  noiseFilter.type = 'lowpass'
  noiseFilter.frequency.value = 1800
  noiseGain.gain.setValueAtTime(0.02, now)
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.028)
  noise.connect(noiseFilter)
  noiseFilter.connect(noiseGain)
  noiseGain.connect(context.destination)
  noise.start(now)
  noise.stop(now + 0.03)
}

function makeLabelTexture(label: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 80
  const context = canvas.getContext('2d')!
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = '#e4c584'
  context.font = '700 48px "Courier New", monospace'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(label, canvas.width / 2, canvas.height / 2 + 1)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.generateMipmaps = false
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  return texture
}

function SurfaceLabel({ label, position, size }: {
  label: string
  position: [number, number, number]
  size: [number, number]
}) {
  const texture = useMemo(() => makeLabelTexture(label), [label])
  useEffect(() => () => texture.dispose(), [texture])

  return (
    <mesh position={position} renderOrder={6}>
      <planeGeometry args={size} />
      <meshBasicMaterial map={texture as never} transparent toneMapped={false} />
    </mesh>
  )
}

function PointerSurface({ radius, position, onPress, onRelease, onClick, onHover }: {
  radius: number
  position: [number, number, number]
  onPress: () => void
  onRelease: () => void
  onClick: () => void
  onHover: (hovering: boolean) => void
}) {
  return (
    <mesh
      position={position}
      rotation={[Math.PI / 2, 0, 0]}
      onPointerOver={(event) => { event.stopPropagation(); onHover(true) }}
      onPointerOut={(event) => { event.stopPropagation(); onHover(false); onRelease() }}
      onPointerDown={(event) => { event.stopPropagation(); onPress() }}
      onPointerUp={(event) => { event.stopPropagation(); onRelease() }}
      onClick={(event) => { event.stopPropagation(); onClick() }}
    >
      <cylinderGeometry args={[radius, radius, 0.2, 40]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  )
}

function RotaryControl({ kind, calibration, radius, value, onClick }: {
  kind: 'channel' | 'volume'
  calibration: TvControlTransform
  radius: number
  value: number
  onClick: () => void
}) {
  const knob = useRef<THREE.Group>(null)
  const pressed = useRef(false)
  const [hovered, setHovered] = useState(false)
  const { gl } = useThree()
  const rotation = kind === 'channel' ? -0.72 + (value - 1) * 0.48 : -1.1 + value * 0.44

  useFrame((_, delta) => {
    if (!knob.current) return
    knob.current.position.z = THREE.MathUtils.damp(knob.current.position.z, pressed.current ? -0.016 : 0, 22, delta)
    knob.current.rotation.z = THREE.MathUtils.damp(knob.current.rotation.z, rotation, 13, delta)
  })

  function setHover(hovering: boolean) {
    setHovered(hovering)
    gl.domElement.style.cursor = hovering ? 'pointer' : ''
  }

  return (
    <group position={calibration.position} rotation={calibration.rotation} scale={calibration.scale}>
      <mesh position={[0, 0, 0.008]} rotation={[Math.PI / 2, 0, 0]} renderOrder={3}>
        <cylinderGeometry args={[radius, radius, 0.016, 64]} />
        <meshStandardMaterial color="#1e1a13" metalness={0.83} roughness={0.31} />
      </mesh>
      <mesh position={[0, 0, 0.016]} renderOrder={4}>
        <torusGeometry args={[radius - 0.014, 0.009, 10, 56]} />
        <meshStandardMaterial color="#c28a3e" metalness={0.78} roughness={0.27} />
      </mesh>
      {Array.from({ length: 16 }, (_, index) => {
        const angle = (index / 16) * Math.PI * 2
        const tickRadius = radius - 0.028
        return (
          <mesh
            key={`tick-${index}`}
            position={[Math.sin(angle) * tickRadius, Math.cos(angle) * tickRadius, 0.018]}
            rotation={[0, 0, -angle]}
            renderOrder={5}
          >
            <boxGeometry args={[0.006, index % 4 === 0 ? 0.017 : 0.01, 0.004]} />
            <meshBasicMaterial color={index % 4 === 0 ? '#e6c47c' : '#92703b'} toneMapped={false} />
          </mesh>
        )
      })}
      <group ref={knob}>
        <mesh position={[0, 0, 0.028]} rotation={[Math.PI / 2, 0, 0]} renderOrder={6}>
          <cylinderGeometry args={[radius - 0.043, radius - 0.043, 0.026, 48]} />
          <meshStandardMaterial
            color={hovered ? '#786039' : '#51422b'}
            metalness={0.58}
            roughness={0.36}
          />
        </mesh>
        <mesh position={[0, 0, 0.043]} renderOrder={7}>
          <torusGeometry args={[radius - 0.052, 0.004, 8, 48]} />
          <meshStandardMaterial color="#c99a4c" metalness={0.72} roughness={0.28} />
        </mesh>
        {Array.from({ length: 20 }, (_, index) => {
          const angle = (index / 20) * Math.PI * 2
          const gripRadius = radius - 0.046
          return (
            <mesh
              key={`grip-${index}`}
              position={[Math.sin(angle) * gripRadius, Math.cos(angle) * gripRadius, 0.029]}
              rotation={[0, 0, -angle]}
              renderOrder={7}
            >
              <boxGeometry args={[0.007, 0.018, 0.016]} />
              <meshStandardMaterial color="#d1a354" metalness={0.72} roughness={0.3} />
            </mesh>
          )
        })}
        <mesh position={[0, radius * 0.36, 0.044]} renderOrder={8}>
          <boxGeometry args={[0.012, radius * 0.32, 0.009]} />
          <meshStandardMaterial color="#f1d99c" emissive="#8e6428" emissiveIntensity={0.35} />
        </mesh>
      </group>
      <PointerSurface
        radius={radius + 0.01}
        position={[0, 0, 0.058]}
        onPress={() => { pressed.current = true }}
        onRelease={() => { pressed.current = false }}
        onHover={setHover}
        onClick={onClick}
      />
    </group>
  )
}

function PowerButton({ calibration, onClick, poweredOn }: { calibration: TvControlTransform; onClick: () => void; poweredOn: boolean }) {
  const cap = useRef<THREE.Group>(null)
  const pressed = useRef(false)
  const [hovered, setHovered] = useState(false)
  const { gl } = useThree()

  useFrame((_, delta) => {
    if (cap.current) cap.current.position.z = THREE.MathUtils.damp(cap.current.position.z, pressed.current ? -0.027 : 0, 25, delta)
  })

  function setHover(hovering: boolean) {
    setHovered(hovering)
    gl.domElement.style.cursor = hovering ? 'pointer' : ''
  }

  return (
    <group position={calibration.position} rotation={calibration.rotation} scale={calibration.scale}>
      <mesh position={[0, 0, 0.012]} rotation={[Math.PI / 2, 0, 0]} renderOrder={3}>
        <cylinderGeometry args={[0.06, 0.06, 0.04, 40]} />
        <meshStandardMaterial color="#1b1711" metalness={0.78} roughness={0.34} />
      </mesh>
      <mesh position={[0, 0, 0.04]} renderOrder={4}>
        <torusGeometry args={[0.047, 0.005, 8, 40]} />
        <meshStandardMaterial color="#b88a44" metalness={0.76} roughness={0.3} />
      </mesh>
      <group ref={cap}>
        <mesh position={[0, 0, 0.045]} rotation={[Math.PI / 2, 0, 0]} renderOrder={5}>
          <cylinderGeometry args={[0.041, 0.045, 0.032, 40]} />
          <meshStandardMaterial
            color={hovered ? '#8d7040' : '#51432b'}
            metalness={0.62}
            roughness={0.3}
            emissive={poweredOn ? '#b97824' : '#000000'}
            emissiveIntensity={poweredOn ? 0.34 : 0}
          />
        </mesh>
        <mesh position={[0, 0, 0.066]} renderOrder={7}>
          <torusGeometry args={[0.018, 0.0028, 8, 24, Math.PI * 1.55]} />
          <meshBasicMaterial color={poweredOn ? '#f1bd55' : '#87704b'} toneMapped={false} />
        </mesh>
        <mesh position={[0, -0.013, 0.068]} renderOrder={7}>
          <boxGeometry args={[0.005, 0.021, 0.003]} />
          <meshBasicMaterial color={poweredOn ? '#f1bd55' : '#87704b'} toneMapped={false} />
        </mesh>
      </group>
      <pointLight position={[0, 0, 0.085]} color="#efa941" intensity={poweredOn ? 0.5 : 0.015} distance={0.36} decay={2} />
      <PointerSurface
        radius={0.061}
        position={[0, 0, 0.11]}
        onPress={() => { pressed.current = true }}
        onRelease={() => { pressed.current = false }}
        onHover={setHover}
        onClick={onClick}
      />
      <SurfaceLabel label="POWER" position={[0, -0.075, 0.007]} size={[0.14, 0.035]} />
    </group>
  )
}

function BottomButton({ calibration, onClick }: {
  calibration: TvControlTransform
  onClick: () => void
}) {
  const cap = useRef<THREE.Group>(null)
  const pressed = useRef(false)
  const [hovered, setHovered] = useState(false)
  const { gl } = useThree()

  useFrame((_, delta) => {
    if (cap.current) cap.current.position.z = THREE.MathUtils.damp(cap.current.position.z, pressed.current ? -0.023 : 0, 25, delta)
  })

  function setHover(hovering: boolean) {
    setHovered(hovering)
    gl.domElement.style.cursor = hovering ? 'pointer' : ''
  }

  return (
    <group position={calibration.position} rotation={calibration.rotation} scale={calibration.scale}>
      <mesh position={[0, 0, 0.012]} rotation={[Math.PI / 2, 0, 0]} renderOrder={3}>
        <cylinderGeometry args={[0.042, 0.042, 0.035, 28]} />
        <meshStandardMaterial color="#18150f" metalness={0.68} roughness={0.36} />
      </mesh>
      <group ref={cap}>
        <mesh position={[0, 0, 0.041]} rotation={[Math.PI / 2, 0, 0]} renderOrder={4}>
          <cylinderGeometry args={[0.033, 0.038, 0.028, 28]} />
          <meshStandardMaterial color={hovered ? '#be914b' : '#80643a'} metalness={0.58} roughness={0.34} />
        </mesh>
        <mesh position={[0, 0, 0.058]} renderOrder={5}>
          <circleGeometry args={[0.024, 28]} />
          <meshBasicMaterial color={hovered ? '#f6dfa7' : '#d0ad6d'} toneMapped={false} />
        </mesh>
      </group>
      <PointerSurface
        radius={0.047}
        position={[0, 0, 0.085]}
        onPress={() => { pressed.current = true }}
        onRelease={() => { pressed.current = false }}
        onHover={setHover}
        onClick={onClick}
      />
    </group>
  )
}

interface TvPhysicalControlsProps {
  calibration?: TvControlCalibration
  selectingControl?: boolean
  onSelectControl?: (id: TvControlId) => void
}

export function TvPhysicalControls({
  calibration = TV_CONTROL_CALIBRATION,
  selectingControl = false,
  onSelectControl = () => undefined,
}: TvPhysicalControlsProps) {
  const channel = useTvStore((state) => state.channel)
  const volume = useTvStore((state) => state.volume)
  const poweredOn = useTvStore((state) => state.poweredOn)
  const setPoweredOn = useTvStore((state) => state.setPoweredOn)
  const setChannel = useTvStore((state) => state.setChannel)
  const setVolume = useTvStore((state) => state.setVolume)
  const channelEggActive = useTvStore((state) => state.channelEggActive)
  const triggerChannelEgg = useTvStore((state) => state.triggerChannelEgg)
  const dismissChannelEgg = useTvStore((state) => state.dismissChannelEgg)
  const setPage = useInterfaceStore((state) => state.setPage)
  const synth = useRef<HumSynth | null>(null)
  const rapidTune = useRef({ count: 0, lastAt: 0 })

  useEffect(() => () => {
    synth.current?.oscillators.forEach((oscillator) => oscillator.stop())
    if (synth.current && synth.current.context.state !== 'closed') void synth.current.context.close()
  }, [])

  function ensureAudio() {
    if (!synth.current && typeof window.AudioContext !== 'undefined') {
      try {
        synth.current = createHumSynth()
      } catch {
        synth.current = null
      }
    }
    return synth.current
  }

  function tuneChannel(target: number) {
    if (Date.now() < useTvStore.getState().channelEggLockedUntil) return

    const next = ((target - 1 + pageByChannel.length) % pageByChannel.length) + 1
    if (next === channel) return

    const now = performance.now()
    const consecutiveCount = now - rapidTune.current.lastAt <= rapidTuneGapMs
      ? rapidTune.current.count + 1
      : 1
    rapidTune.current = { count: consecutiveCount, lastAt: now }

    playChannelTuningNoise(volume)
    setChannel(next)
    setPage(pageByChannel[next - 1])

    if (channelEggActive) {
      rapidTune.current = { count: 0, lastAt: 0 }
      dismissChannelEgg()
      return
    }

    if (consecutiveCount >= rapidTuneThreshold) {
      rapidTune.current = { count: 0, lastAt: 0 }
      triggerChannelEgg()
    }
  }

  function adjustVolume(next: number) {
    rapidTune.current = { count: 0, lastAt: 0 }
    const clamped = Math.max(0, Math.min(5, next))
    setVolume(clamped)
    if (poweredOn && clamped > 0) updateHum(ensureAudio(), true, clamped)
    else updateHum(synth.current, poweredOn, clamped)
  }

  function cycleVolume() {
    adjustVolume((volume + 1) % 6)
  }

  function activateControl(id: TvControlId, action: () => void) {
    if (selectingControl || !['channel', 'channelDown', 'channelUp'].includes(id)) {
      rapidTune.current = { count: 0, lastAt: 0 }
    }
    if (selectingControl) onSelectControl(id)
    else action()
  }

  function handlePower() {
    rapidTune.current = { count: 0, lastAt: 0 }
    if (channelEggActive) dismissChannelEgg()
    const next = !poweredOn
    const audio = ensureAudio()
    updateHum(audio, next, volume)
    playPowerTone(audio, next)
    setPoweredOn(next)
  }

  return (
    <>
      <RotaryControl
        kind="channel"
        calibration={calibration.channel}
        radius={0.12}
        value={channel}
        onClick={() => activateControl('channel', () => tuneChannel(channel + 1))}
      />
      <RotaryControl
        kind="volume"
        calibration={calibration.volume}
        radius={0.12}
        value={volume}
        onClick={() => activateControl('volume', cycleVolume)}
      />
      <PowerButton calibration={calibration.power} poweredOn={poweredOn} onClick={() => activateControl('power', handlePower)} />

      <BottomButton calibration={calibration.channelDown} onClick={() => activateControl('channelDown', () => tuneChannel(channel - 1))} />
      <BottomButton calibration={calibration.channelUp} onClick={() => activateControl('channelUp', () => tuneChannel(channel + 1))} />
      <BottomButton calibration={calibration.volumeDown} onClick={() => activateControl('volumeDown', () => adjustVolume(volume - 1))} />
      <BottomButton calibration={calibration.volumeUp} onClick={() => activateControl('volumeUp', () => adjustVolume(volume + 1))} />
    </>
  )
}
