import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { ScreenCalibrator } from './components/ScreenCalibrator'
import { TvInterface } from './components/TvInterface'
import { SCREEN_CALIBRATION, TV_CONTROL_CALIBRATION } from './scene/screenCalibration'
import type { ScreenCalibration, TvControlCalibration, TvControlId, TvControlTransform } from './scene/screenCalibration'

const Scene = lazy(() => import('./scene/Scene').then(({ Scene }) => ({ default: Scene })))

function useReducedMotionPreference() {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(preference.matches)
    update()
    preference.addEventListener('change', update)
    return () => preference.removeEventListener('change', update)
  }, [])

  return reducedMotion
}

function useSmallScreen() {
  const [smallScreen, setSmallScreen] = useState(() => window.matchMedia('(max-width: 760px)').matches)

  useEffect(() => {
    const preference = window.matchMedia('(max-width: 760px)')
    const update = () => setSmallScreen(preference.matches)
    preference.addEventListener('change', update)
    return () => preference.removeEventListener('change', update)
  }, [])

  return smallScreen
}

export default function App() {
  const reducedMotion = useReducedMotionPreference()
  const smallScreen = useSmallScreen()
  const htmlPortal = useRef<HTMLDivElement>(null)
  const [screenCalibration, setScreenCalibration] = useState<ScreenCalibration>(SCREEN_CALIBRATION)
  const [tvControlCalibration, setTvControlCalibration] = useState<TvControlCalibration>(TV_CONTROL_CALIBRATION)
  const [selectingControl, setSelectingControl] = useState(false)
  const [selectedControl, setSelectedControl] = useState<TvControlId | null>(null)
  const calibrationMode = import.meta.env.DEV
    && !smallScreen
    && new URLSearchParams(window.location.search).get('calibrate-screen') === '1'

  async function saveScreenCalibration(screen: ScreenCalibration, controls: TvControlCalibration) {
    const response = await fetch('/__screen-calibration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ screen, controls }),
    })
    if (!response.ok) {
      const message = await response.text()
      throw new Error(message || 'No se pudo guardar la calibración.')
    }
  }

  return (
    <div className={smallScreen ? 'experience-shell experience-shell--mobile' : 'experience-shell'}>
      {smallScreen ? (
        <TvInterface mobile />
      ) : (
        <>
          <div className="scene-backdrop" aria-hidden="true" />
          <div className="html-portal-layer" ref={htmlPortal} />
          <Suspense fallback={<div className="scene-loader" role="status">Preparando la señal…</div>}>
            <Scene
              reducedMotion={reducedMotion}
              htmlPortal={htmlPortal}
              calibration={screenCalibration}
              tvControlCalibration={tvControlCalibration}
              selectingControl={selectingControl}
              onSelectControl={(id) => setSelectedControl(id)}
            />
          </Suspense>
          <div className="scene-vignette" aria-hidden="true" />
          <div className="motion-state" aria-live="polite">
            {reducedMotion ? 'Movimiento reducido' : ''}
          </div>
          {calibrationMode && (
            <ScreenCalibrator
              value={screenCalibration}
              controls={tvControlCalibration}
              selectedControl={selectedControl}
              selectingControl={selectingControl}
              onChange={setScreenCalibration}
              onControlChange={(id, value: TvControlTransform) => setTvControlCalibration((current) => ({ ...current, [id]: value }))}
              onToggleSelectingControl={() => setSelectingControl((active) => !active)}
              onSave={saveScreenCalibration}
            />
          )}
        </>
      )}
    </div>
  )
}
