import { useState } from 'react'
import {
  SCREEN_CALIBRATION,
  TV_CONTROL_CALIBRATION,
  type ScreenCalibration,
  type TvControlCalibration,
  type TvControlId,
  type TvControlTransform,
} from '../scene/screenCalibration'

interface ScreenCalibratorProps {
  value: ScreenCalibration
  controls: TvControlCalibration
  selectedControl: TvControlId | null
  selectingControl: boolean
  onChange: (value: ScreenCalibration) => void
  onControlChange: (id: TvControlId, value: TvControlTransform) => void
  onToggleSelectingControl: () => void
  onSave: (screen: ScreenCalibration, controls: TvControlCalibration) => Promise<void>
}

interface RangeControlProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  disabled?: boolean
  format: (value: number) => string
  onChange: (value: number) => void
}

function RangeControl({ label, value, min, max, step, disabled = false, format, onChange }: RangeControlProps) {
  return (
    <label className="screen-calibrator__control">
      <span className="screen-calibrator__label">
        <span>{label}</span>
        <output>{format(value)}</output>
      </span>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
    </label>
  )
}

const positionControls = [
  { label: 'Posición X', index: 0 as const, min: -0.55, max: 0.05 },
  { label: 'Posición Y', index: 1 as const, min: 0.9, max: 1.3 },
  { label: 'Profundidad Z', index: 2 as const, min: 0.75, max: 1.1 },
]

const rotationControls = [
  { label: 'Inclinación X', index: 0 as const },
  { label: 'Inclinación Y', index: 1 as const },
  { label: 'Inclinación Z', index: 2 as const },
]

const controlPositionControls = [
  { label: 'Control X', index: 0 as const, min: -1.25, max: 1.25 },
  { label: 'Control Y', index: 1 as const, min: 0.05, max: 1.9 },
  { label: 'Control Z', index: 2 as const, min: 0.4, max: 1.15 },
]

const controlRotationControls = [
  { label: 'Giro X', index: 0 as const },
  { label: 'Giro Y', index: 1 as const },
  { label: 'Giro Z', index: 2 as const },
]

const controlNames: Record<TvControlId, string> = {
  channel: 'Mando de canal',
  volume: 'Mando de volumen',
  power: 'Botón Power',
  channelDown: 'Botón CH−',
  channelUp: 'Botón CH+',
  volumeDown: 'Botón VOL−',
  volumeUp: 'Botón VOL+',
}

function copyCalibration(value: ScreenCalibration): ScreenCalibration {
  return { ...value, position: [...value.position], rotation: [...value.rotation] }
}

function copyControlCalibration(value: TvControlCalibration): TvControlCalibration {
  return Object.fromEntries(Object.entries(value).map(([id, transform]) => [id, {
    ...transform,
    position: [...transform.position],
    rotation: [...transform.rotation],
  }])) as TvControlCalibration
}

export function ScreenCalibrator({
  value,
  controls,
  selectedControl,
  selectingControl,
  onChange,
  onControlChange,
  onToggleSelectingControl,
  onSave,
}: ScreenCalibratorProps) {
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')

  function updatePosition(index: 0 | 1 | 2, next: number) {
    const position = [...value.position] as ScreenCalibration['position']
    position[index] = next
    onChange({ ...value, position })
    setStatus('Cambios sin guardar')
  }

  function updateRotation(index: 0 | 1 | 2, degrees: number) {
    const rotation = [...value.rotation] as ScreenCalibration['rotation']
    rotation[index] = degrees * Math.PI / 180
    onChange({ ...value, rotation })
    setStatus('Cambios sin guardar')
  }

  function updateSize(field: 'width' | 'height', next: number) {
    onChange({ ...value, [field]: next })
    setStatus('Cambios sin guardar')
  }

  function updateControlPosition(index: 0 | 1 | 2, next: number) {
    if (!selectedControl) return
    const position = [...controls[selectedControl].position] as TvControlTransform['position']
    position[index] = next
    onControlChange(selectedControl, { ...controls[selectedControl], position })
    setStatus('Cambios sin guardar')
  }

  function updateControlRotation(index: 0 | 1 | 2, degrees: number) {
    if (!selectedControl) return
    const rotation = [...controls[selectedControl].rotation] as TvControlTransform['rotation']
    rotation[index] = degrees * Math.PI / 180
    onControlChange(selectedControl, { ...controls[selectedControl], rotation })
    setStatus('Cambios sin guardar')
  }

  function updateControlScale(next: number) {
    if (!selectedControl) return
    onControlChange(selectedControl, { ...controls[selectedControl], scale: next })
    setStatus('Cambios sin guardar')
  }

  async function save() {
    setSaving(true)
    setStatus('Guardando…')
    try {
      await onSave(copyCalibration(value), copyControlCalibration(controls))
      setStatus('Guardado en código.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'No se pudo guardar.')
    } finally {
      setSaving(false)
    }
  }

  function reset() {
    onChange(copyCalibration(SCREEN_CALIBRATION))
    setStatus('Pantalla restaurada a sus valores guardados')
  }

  function resetSelectedControl() {
    if (!selectedControl) return
    const original = TV_CONTROL_CALIBRATION[selectedControl]
    onControlChange(selectedControl, {
      ...original,
      position: [...original.position],
      rotation: [...original.rotation],
    })
    setStatus('Control restaurado a sus valores guardados')
  }

  return (
    <aside className="tv-interface screen-calibrator" aria-label="Ajustar panel del televisor">
      <header className="screen-calibrator__header">
        <div>
          <strong>Ajustar pantalla</strong>
          <span>Calibración temporal · desarrollo</span>
        </div>
        <span className="screen-calibrator__live">EN VIVO</span>
      </header>

      <section className="screen-calibrator__group" aria-label="Posición">
        <h2>Posición</h2>
        {positionControls.map(({ label, index, min, max }) => (
          <RangeControl
            key={label}
            label={label}
            value={value.position[index]}
            min={min}
            max={max}
            step={0.001}
            disabled={saving}
            format={(next) => next.toFixed(3)}
            onChange={(next) => updatePosition(index, next)}
          />
        ))}
      </section>

      <section className="screen-calibrator__group" aria-label="Tamaño">
        <h2>Tamaño</h2>
        <RangeControl label="Ancho" value={value.width} min={820} max={1050} step={1} disabled={saving} format={(next) => `${Math.round(next)} px`} onChange={(next) => updateSize('width', next)} />
        <RangeControl label="Alto" value={value.height} min={650} max={850} step={1} disabled={saving} format={(next) => `${Math.round(next)} px`} onChange={(next) => updateSize('height', next)} />
      </section>

      <section className="screen-calibrator__group" aria-label="Inclinación">
        <h2>Inclinación</h2>
        {rotationControls.map(({ label, index }) => (
          <RangeControl
            key={label}
            label={label}
            value={value.rotation[index] * 180 / Math.PI}
            min={-8}
            max={8}
            step={0.1}
            disabled={saving}
            format={(next) => `${next.toFixed(1)}°`}
            onChange={(next) => updateRotation(index, next)}
          />
        ))}
      </section>

      <section className="screen-calibrator__group" aria-label="Controles físicos">
        <h2>Controles de la TV</h2>
        <button
          className="screen-calibrator__selection-button"
          type="button"
          aria-pressed={selectingControl}
          onClick={onToggleSelectingControl}
          disabled={saving}
        >
          {selectingControl ? 'Seleccionar: activado' : 'Seleccionar control 3D'}
        </button>
        <p className="screen-calibrator__selection-hint">
          {selectingControl
            ? 'Haz clic en un mando de la TV. No se activará mientras seleccionas.'
            : selectedControl
              ? `Seleccionado: ${controlNames[selectedControl]}`
              : 'Activa la selección y haz clic en un mando de la TV.'}
        </p>
        {selectedControl && (
          <>
            <h3 className="screen-calibrator__selected-name">{controlNames[selectedControl]}</h3>
            {controlPositionControls.map(({ label, index, min, max }) => (
              <RangeControl
                key={label}
                label={label}
                value={controls[selectedControl].position[index]}
                min={min}
                max={max}
                step={0.001}
                disabled={saving}
                format={(next) => next.toFixed(3)}
                onChange={(next) => updateControlPosition(index, next)}
              />
            ))}
            {controlRotationControls.map(({ label, index }) => (
              <RangeControl
                key={label}
                label={label}
                value={controls[selectedControl].rotation[index] * 180 / Math.PI}
                min={-12}
                max={12}
                step={0.1}
                disabled={saving}
                format={(next) => `${next.toFixed(1)}°`}
                onChange={(next) => updateControlRotation(index, next)}
              />
            ))}
            <RangeControl
              label="Escala"
              value={controls[selectedControl].scale}
              min={0.6}
              max={1.4}
              step={0.01}
              disabled={saving}
              format={(next) => `${next.toFixed(2)}×`}
              onChange={updateControlScale}
            />
            <button
              className="screen-calibrator__selection-button"
              type="button"
              onClick={resetSelectedControl}
              disabled={saving}
            >
              Restaurar este control
            </button>
          </>
        )}
      </section>

      <div className="screen-calibrator__actions">
        <button type="button" onClick={reset} disabled={saving}>Restaurar pantalla</button>
        <button type="button" onClick={save} disabled={saving}>{saving ? 'Guardando…' : 'Guardar en código'}</button>
      </div>
      <p className="screen-calibrator__status" role="status" aria-live="polite">{status}</p>
    </aside>
  )
}
