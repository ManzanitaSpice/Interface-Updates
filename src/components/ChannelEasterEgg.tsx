import { useEffect, useRef, useState } from 'react'
import { useInterfaceStore } from '../state/interfaceStore'

const TUNING_DURATION_MS = 3000
const VIDEO_VOLUME = 0.7

export function ChannelEasterEgg({ onClose }: { onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null)
  const startupTimeout = useRef<number | null>(null)
  const disposed = useRef(false)
  const onCloseRef = useRef(onClose)
  const [tuning, setTuning] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [needsGesture, setNeedsGesture] = useState(false)
  const [failed, setFailed] = useState(false)

  onCloseRef.current = onClose

  function clearStartupTimeout() {
    if (startupTimeout.current !== null) {
      window.clearTimeout(startupTimeout.current)
      startupTimeout.current = null
    }
  }

  function scheduleStartupTimeout() {
    clearStartupTimeout()
    startupTimeout.current = window.setTimeout(() => setFailed(true), 18000)
  }

  function requestPlayback() {
    const media = video.current
    if (!media) return

    media.volume = VIDEO_VOLUME
    scheduleStartupTimeout()
    void media.play()
      .then(() => {
        if (!disposed.current) setNeedsGesture(false)
      })
      .catch(() => {
        clearStartupTimeout()
        if (disposed.current) return
        if (media.error) {
          setFailed(true)
          setNeedsGesture(false)
        } else {
          setNeedsGesture(true)
        }
      })
  }

  function startPlayback() {
    if (tuning) return
    requestPlayback()
  }

  function markPlaying() {
    clearStartupTimeout()
    setFailed(false)
    setNeedsGesture(false)
    setPlaying(true)
  }

  useEffect(() => {
    const interfaceStore = useInterfaceStore.getState()
    const previousZoom = interfaceStore.cameraZoomOffset
    interfaceStore.adjustCameraZoom(-8)

    disposed.current = false
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
    }
    window.addEventListener('keydown', handleKeyDown)

    const tuningTimeout = window.setTimeout(() => {
      setTuning(false)
      const media = video.current
      if (!media) {
        setFailed(true)
        return
      }

      requestPlayback()
    }, TUNING_DURATION_MS)

    return () => {
      disposed.current = true
      window.clearTimeout(tuningTimeout)
      clearStartupTimeout()
      window.removeEventListener('keydown', handleKeyDown)
      video.current?.pause()

      const currentZoom = useInterfaceStore.getState().cameraZoomOffset
      if (Math.abs(currentZoom + 1.5) < 0.001) {
        useInterfaceStore.getState().adjustCameraZoom(previousZoom - currentZoom)
      }
    }
  }, [])

  return (
    <div
      className={`channel-easter-egg${playing ? ' channel-easter-egg--playing' : ''}${failed ? ' channel-easter-egg--failed' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="Señal de video sintonizada. Presiona Escape para salir."
      onClick={startPlayback}
    >
      <video
        className="channel-easter-egg__player"
        ref={video}
        src={`${import.meta.env.BASE_URL}rickroll.mp4`}
        playsInline
        preload="none"
        onPlay={markPlaying}
        onEnded={() => onCloseRef.current()}
        onError={() => {
          if (tuning) return
          clearStartupTimeout()
          setNeedsGesture(false)
          setFailed(true)
        }}
      />
      <div className="channel-easter-egg__static" aria-hidden="true" />
      <div className="channel-easter-egg__osd" aria-hidden="true">
        <span className="channel-easter-egg__channel-number">CANAL 22</span>
        <span>AFINANDO SINTONÍA</span>
        <span className="channel-easter-egg__meter">
          <i /><i /><i /><i /><i /><i />
        </span>
        <span className="channel-easter-egg__frequency">VHF · 60 Hz</span>
      </div>
      {!tuning && needsGesture && !playing && !failed && (
        <button className="channel-easter-egg__status" type="button" onClick={(event) => {
          event.stopPropagation()
          startPlayback()
        }}>
          PRESIONA PARA REPRODUCIR
        </button>
      )}
      {failed && <span className="channel-easter-egg__status">NO SE PUDO CARGAR EL VIDEO · CAMBIA DE CANAL</span>}
    </div>
  )
}
