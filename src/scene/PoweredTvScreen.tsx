import { useEffect, useRef, useState, type RefObject } from 'react'
import { Html } from '@react-three/drei'
import gsap from 'gsap'
import { TvInterface } from '../components/TvInterface'
import { useTvStore } from '../state/tvStore'
import type { ScreenCalibration } from './screenCalibration'

export function PoweredTvScreen({ htmlPortal, calibration }: { htmlPortal: RefObject<HTMLDivElement | null>; calibration: ScreenCalibration }) {
  const poweredOn = useTvStore((state) => state.poweredOn)
  const screenRef = useRef<HTMLDivElement>(null)
  const lightLineRef = useRef<HTMLDivElement>(null)
  const initialized = useRef(false)
  const [screenInteractive, setScreenInteractive] = useState(poweredOn)

  useEffect(() => {
    const screen = screenRef.current
    const line = lightLineRef.current
    if (!screen || !line) return

    if (!initialized.current) {
      initialized.current = true
      gsap.set(screen, { autoAlpha: poweredOn ? 1 : 0, scaleX: poweredOn ? 1 : 0, scaleY: poweredOn ? 1 : 0 })
      gsap.set(line, { autoAlpha: 0, scaleX: 0 })
      setScreenInteractive(poweredOn)
      return
    }

    const timeline = gsap.timeline({ onComplete: () => setScreenInteractive(poweredOn) })
    setScreenInteractive(false)

    if (poweredOn) {
      gsap.set(screen, { autoAlpha: 1, scaleX: 0, scaleY: 0.008 })
      gsap.set(line, { autoAlpha: 1, scaleX: 0 })
      timeline
        .to([screen, line], { scaleX: 1, duration: 0.09, ease: 'power2.out' })
        .to(screen, { scaleY: 1, duration: 0.08, ease: 'power2.out' })
        .to(line, { autoAlpha: 0, duration: 0.05, ease: 'power1.out' }, '-=0.04')
    } else {
      gsap.set(line, { autoAlpha: 0, scaleX: 1 })
      timeline
        .to(screen, { scaleY: 0.008, duration: 0.08, ease: 'power2.in' })
        .set(line, { autoAlpha: 1 })
        .to(screen, { scaleX: 0, duration: 0.09, ease: 'power2.in' })
        .to(line, { scaleX: 0, duration: 0.09, ease: 'power2.in' }, '<')
        .to(line, { autoAlpha: 0, duration: 0.035, ease: 'power1.out' })
    }

    return () => { timeline.kill() }
  }, [poweredOn])

  return (
    <Html
      transform
      portal={htmlPortal as unknown as RefObject<HTMLElement>}
      position={calibration.position}
      rotation={calibration.rotation}
      distanceFactor={0.74}
      zIndexRange={[35, 5]}
      wrapperClass="crt-html-wrapper"
      style={{ pointerEvents: screenInteractive ? 'auto' : 'none' }}
    >
      <div className="crt-power-stage" aria-hidden={!screenInteractive} style={{ width: calibration.width, height: calibration.height }}>
        <div ref={screenRef} className="crt-power-image">
          <TvInterface />
        </div>
        <div ref={lightLineRef} className="crt-power-line" />
      </div>
    </Html>
  )
}
