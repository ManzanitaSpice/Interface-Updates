import { lazy, Suspense, useEffect, useMemo, useRef, type RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import gsap from 'gsap'
import * as THREE from 'three'
import { useInterfaceStore } from '../state/interfaceStore'
import { useTvStore } from '../state/tvStore'
import { CrtTelevision } from './CrtTelevision'
import { SkinAvatar } from './SkinAvatar'
import { PoweredTvScreen } from './PoweredTvScreen'
import { TvPhysicalControls } from './TvPhysicalControls'
import { TV_CONTROL_CALIBRATION, type ScreenCalibration, type TvControlCalibration, type TvControlId } from './screenCalibration'
import { WoodFloor } from './WoodFloor'

const PostProcessing = lazy(() => import('./PostProcessing'))

function CameraMotion({ reducedMotion }: { reducedMotion: boolean }) {
  const { camera, gl } = useThree()
  const page = useInterfaceStore((state) => state.page)
  const cameraZoomOffset = useInterfaceStore((state) => state.cameraZoomOffset)
  const adjustCameraZoom = useInterfaceStore((state) => state.adjustCameraZoom)
  const basePosition = useRef(new THREE.Vector2(0.18, 1.02))
  const target = useRef(new THREE.Vector3(0.03, 1.07, -0.18))
  const swayWeight = useRef(0)
  const frontalWeight = useRef(0)

  useEffect(() => {
    const distance = THREE.MathUtils.clamp(4.65 + cameraZoomOffset, 1.9, 7.4)

    if (reducedMotion) {
      camera.position.z = distance
      return
    }

    const tween = gsap.to(camera.position, {
      z: distance,
      duration: 0.45,
      ease: 'power3.out',
    })
    return () => { tween.kill() }
  }, [camera, cameraZoomOffset, reducedMotion])

  useEffect(() => {
    const canvas = gl.domElement
    const experience = canvas.closest('.experience-shell')
    if (!(experience instanceof HTMLElement)) return

    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey || event.deltaY === 0) return

      const target = event.target instanceof Element ? event.target : null
      if (target?.closest('.screen-calibrator')) return

      const scrollView = target?.closest<HTMLElement>('.scroll-view') ?? null
      if (scrollView && scrollView.scrollHeight > scrollView.clientHeight) {
        const canScroll = event.deltaY < 0
          ? scrollView.scrollTop > 0
          : scrollView.scrollTop + scrollView.clientHeight < scrollView.scrollHeight - 1
        if (canScroll) return
      }

      if (event.cancelable) event.preventDefault()
      const unitInPixels = event.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? 16
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
          ? Math.max(experience.clientHeight, window.innerHeight)
          : 1
      const deltaInPixels = event.deltaY * unitInPixels
      adjustCameraZoom(THREE.MathUtils.clamp(deltaInPixels * 0.0018, -0.6, 0.6))
    }

    experience.addEventListener('wheel', handleWheel, { passive: false })
    return () => experience.removeEventListener('wheel', handleWheel)
  }, [gl, adjustCameraZoom])

  useFrame(({ pointer, clock }, delta) => {
    const requestedFrontalWeight = THREE.MathUtils.clamp(-cameraZoomOffset / 1.5, 0, 1)
    frontalWeight.current = reducedMotion
      ? requestedFrontalWeight
      : THREE.MathUtils.damp(frontalWeight.current, requestedFrontalWeight, 4.5, delta)
    const frontalCameraShift = frontalWeight.current * -0.58

    if (reducedMotion) {
      swayWeight.current = 0
      camera.position.x = basePosition.current.x + frontalCameraShift
      camera.position.y = basePosition.current.y
      camera.lookAt(target.current.x, target.current.y, target.current.z)
      return
    }

    const overview = page === 'home'
    swayWeight.current = THREE.MathUtils.damp(swayWeight.current, overview ? 1 : 0, 1.6, delta)

    const time = clock.elapsedTime
    const positionSwayX = (Math.sin(time * 0.24) * 0.035 + Math.sin(time * 0.41 + 1.5) * 0.015) * swayWeight.current
    const positionSwayY = (Math.sin(time * 0.19 + 0.7) * 0.022 + Math.sin(time * 0.33 + 2) * 0.01) * swayWeight.current
    const aimSwayX = (Math.sin(time * 0.28 + 0.4) * 0.014 + Math.sin(time * 0.46 + 2.1) * 0.007) * swayWeight.current
    const aimSwayY = (Math.sin(time * 0.22 + 1.2) * 0.009 + Math.sin(time * 0.37 + 0.2) * 0.005) * swayWeight.current

    camera.position.x = basePosition.current.x + positionSwayX + frontalCameraShift
    camera.position.y = basePosition.current.y + positionSwayY

    camera.lookAt(
      target.current.x + pointer.x * 0.018 + aimSwayX,
      target.current.y + pointer.y * 0.012 + aimSwayY,
      target.current.z,
    )
  })

  return null
}

const reflectionVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const reflectionFragmentShader = /* glsl */ `
  uniform float uPower;
  varying vec2 vUv;
  void main() {
    vec2 offset = vUv - vec2(0.5);
    float horizontalFalloff = exp(-offset.x * offset.x * 8.0);
    float floorFalloff = exp(-offset.y * offset.y * 12.0);
    float lightPool = horizontalFalloff * floorFalloff * 0.058 * uPower;
    vec3 amber = vec3(0.68, 0.32, 0.08);
    vec3 cream = vec3(0.92, 0.62, 0.25);
    vec3 tint = mix(amber, cream, smoothstep(0.15, 0.92, vUv.x));
    gl_FragColor = vec4(tint, lightPool);
  }
`

function ScreenReflection() {
  const poweredOn = useTvStore((state) => state.poweredOn)
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uPower: { value: 1 } },
    vertexShader: reflectionVertexShader,
    fragmentShader: reflectionFragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), [])

  useEffect(() => {
    const tween = gsap.to(material.uniforms.uPower, {
      value: poweredOn ? 1 : 0,
      duration: 0.32,
      ease: 'power2.inOut',
    })
    return () => { tween.kill() }
  }, [material, poweredOn])

  useEffect(() => () => material.dispose(), [material])

  return (
    <mesh position={[0.05, -0.023, 1.63]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
      <planeGeometry args={[5.5, 3.8]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

function Television({ reducedMotion, htmlPortal, calibration, tvControlCalibration, selectingControl, onSelectControl }: {
  reducedMotion: boolean
  htmlPortal: RefObject<HTMLDivElement | null>
  calibration: ScreenCalibration
  tvControlCalibration: TvControlCalibration
  selectingControl: boolean
  onSelectControl: (id: TvControlId) => void
}) {
  const warmKeyLight = useRef<THREE.PointLight>(null)
  const warmFillLight = useRef<THREE.PointLight>(null)
  const lightEnvelope = useRef({ value: 1 })
  const poweredOn = useTvStore((state) => state.poweredOn)

  useEffect(() => {
    const tween = gsap.to(lightEnvelope.current, {
      value: poweredOn ? 1 : 0,
      duration: 0.32,
      ease: 'power2.inOut',
    })
    return () => { tween.kill() }
  }, [poweredOn])

  useFrame(({ clock }) => {
    const flicker = reducedMotion ? 0 : Math.sin(clock.elapsedTime * 4.4) * 0.22 + Math.sin(clock.elapsedTime * 11.7) * 0.07
    const power = lightEnvelope.current.value
    if (warmKeyLight.current) warmKeyLight.current.intensity = (4.8 + flicker * 0.3) * power
    if (warmFillLight.current) warmFillLight.current.intensity = (1.9 - flicker * 0.12) * power
  })

  return (
    <group position={[0.34, -0.04, -0.45]} rotation={[0, -0.24, 0]}>
      <CrtTelevision scale={4.4} />
      <mesh position={[-0.25, 1.10, 0.914]} renderOrder={0} visible={!poweredOn}>
        <planeGeometry args={[1.73, 1.36]} />
        <meshBasicMaterial color="#000000" toneMapped={false} />
      </mesh>
      <pointLight
        ref={warmKeyLight}
        position={[-0.48, 1.16, 1.06]}
        color="#d99435"
        intensity={4.8}
        distance={6.3}
        decay={2}
      />
      <pointLight
        ref={warmFillLight}
        position={[-0.1, 0.88, 1.0]}
        color="#e8b75b"
        intensity={1.9}
        distance={5.1}
        decay={2}
      />
      <TvPhysicalControls
        calibration={tvControlCalibration}
        selectingControl={selectingControl}
        onSelectControl={onSelectControl}
      />
      <PoweredTvScreen htmlPortal={htmlPortal} calibration={calibration} />
    </group>
  )
}

function Room({ reducedMotion, htmlPortal, calibration, tvControlCalibration, selectingControl, onSelectControl }: {
  reducedMotion: boolean
  htmlPortal: RefObject<HTMLDivElement | null>
  calibration: ScreenCalibration
  tvControlCalibration: TvControlCalibration
  selectingControl: boolean
  onSelectControl: (id: TvControlId) => void
}) {
  return (
    <>
      <color attach="background" args={['#080704']} />
      <fog attach="fog" args={['#080704', 8, 18]} />
      <ambientLight color="#493822" intensity={0.17} />
      <hemisphereLight args={['#71522d', '#090704', 0.24]} />
      <pointLight position={[-0.66, 1.24, 2.08]} color="#bf8740" intensity={0.85} distance={3.7} decay={2} />
      <directionalLight
        position={[-3.1, 3.8, 2.2]}
        color="#9c784a"
        intensity={0.34}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.00008}
        shadow-normalBias={0.025}
      />
      <WoodFloor />
      <ScreenReflection />
      <Television
        reducedMotion={reducedMotion}
        htmlPortal={htmlPortal}
        calibration={calibration}
        tvControlCalibration={tvControlCalibration}
        selectingControl={selectingControl}
        onSelectControl={onSelectControl}
      />
      <SkinAvatar />
    </>
  )
}

export function Scene({
  reducedMotion,
  htmlPortal,
  calibration,
  tvControlCalibration = TV_CONTROL_CALIBRATION,
  selectingControl = false,
  onSelectControl = () => undefined,
}: {
  reducedMotion: boolean
  htmlPortal: RefObject<HTMLDivElement | null>
  calibration: ScreenCalibration
  tvControlCalibration?: TvControlCalibration
  selectingControl?: boolean
  onSelectControl?: (id: TvControlId) => void
}) {
  return (
    <Canvas
      camera={{ position: [0.18, 1.02, 4.65], fov: 28, near: 0.1, far: 60 }}
      dpr={[1, 1.25]}
      shadows="percentage"
      performance={{ min: 0.55 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      className="scene-canvas"
    >
      <CameraMotion reducedMotion={reducedMotion} />
      <Room
        reducedMotion={reducedMotion}
        htmlPortal={htmlPortal}
        calibration={calibration}
        tvControlCalibration={tvControlCalibration}
        selectingControl={selectingControl}
        onSelectControl={onSelectControl}
      />
      <Suspense fallback={null}><PostProcessing /></Suspense>
    </Canvas>
  )
}
