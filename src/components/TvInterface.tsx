import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { getReleaseFeed, getRoadmap, formatBytes, formatDate, safeHttpsUrl } from '../data/publicData'
import { playChannelTuningNoise } from '../audio/channelTuningSound'
import { ChannelEasterEgg } from './ChannelEasterEgg'
import { useInterfaceStore } from '../state/interfaceStore'
import { useTvStore } from '../state/tvStore'
import type { PageId, Release, ReleaseFeed, Roadmap } from '../types'

const navigation: { id: PageId; label: string; number: string }[] = [
  { id: 'home', label: 'Inicio', number: '01' },
  { id: 'updates', label: 'Versiones', number: '02' },
  { id: 'downloads', label: 'Archivos', number: '03' },
  { id: 'roadmap', label: 'Roadmap', number: '04' },
]

const channelByPage: Record<PageId, number> = { home: 1, updates: 2, downloads: 3, roadmap: 4 }

type Loadable<T> = { state: 'loading' } | { state: 'ready'; data: T } | { state: 'error' }

function usePublicContent() {
  const [feed, setFeed] = useState<Loadable<ReleaseFeed>>({ state: 'loading' })
  const [roadmap, setRoadmap] = useState<Loadable<Roadmap>>({ state: 'loading' })

  useEffect(() => {
    const controller = new AbortController()
    getReleaseFeed(controller.signal)
      .then((data) => setFeed({ state: 'ready', data }))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) setFeed({ state: 'error' })
      })
    getRoadmap(controller.signal)
      .then((data) => setRoadmap({ state: 'ready', data }))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) setRoadmap({ state: 'error' })
      })
    return () => controller.abort()
  }, [])

  return { feed, roadmap }
}

function MetaLabel({ children }: { children: ReactNode }) {
  return <span className="meta-label">{children}</span>
}

function ReleaseNotes({ markdown, version }: { markdown: string; version: string }) {
  const blocks = useMemo(() => markdown.trim()
    .split(/\n\s*\n/)
    .filter(Boolean)
    .filter((block) => block.replace(/^#{1,6}\s*/, '').trim() !== version), [markdown, version])
  if (blocks.length === 0) return <p className="muted-copy">Esta versión no incluye notas.</p>

  return (
    <div className="release-notes">
      {blocks.map((block, index) => {
        const lines = block.split(/\r?\n/)
        const listLines = lines.map((line) => line.match(/^\s*[-*]\s+(.+)$/)?.[1])
        if (listLines.every(Boolean)) {
          return <ul key={index}>{listLines.map((line, lineIndex) => <li key={lineIndex}>{line}</li>)}</ul>
        }
        return <p key={index}>{lines.map((line, lineIndex) => (
          <span key={lineIndex}>
            {line.replace(/^#{1,6}\s+/, '')}
            {lineIndex < lines.length - 1 && <br />}
          </span>
        ))}</p>
      })}
    </div>
  )
}

function ReleaseMeta({ release }: { release: Release }) {
  return (
    <p className="release-meta">
      <span>Versión {release.version}</span>
      <span className="meta-dot" aria-hidden="true">/</span>
      <time dateTime={release.publishedAt}>{formatDate(release.publishedAt)}</time>
      {release.prerelease && <span className="prerelease-tag">Prelanzamiento</span>}
    </p>
  )
}

function releaseSummary(release: Release | undefined) {
  if (!release) return undefined
  const note = (release.notesMarkdown || '')
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-*#]+\s*/, '').replace(/[*_`]/g, '').trim())
    .find((line) => line && line !== release.version && !/^(cambios|novedades|notas)$/i.test(line))
  const title = release.title && release.title !== release.version ? release.title : undefined
  return (title || note || 'Notas de esta versión disponibles en el archivo.').slice(0, 140)
}

function FeedMessage({ state }: { state: Loadable<ReleaseFeed>['state'] }) {
  if (state === 'loading') return <p className="system-message">Conectando con el archivo de versiones…</p>
  if (state === 'error') {
    return <p className="system-message system-message--error" role="alert">
      No fue posible cargar el feed. Inténtalo de nuevo más tarde.
    </p>
  }
  return <p className="system-message">Aún no hay versiones publicadas.</p>
}

function HomeView({ feed, mobile, navigateTo }: {
  feed: Loadable<ReleaseFeed>
  mobile: boolean
  navigateTo: (page: PageId) => void
}) {
  const skinUsername = useInterfaceStore((state) => state.skinUsername)
  const latest = feed.state === 'ready' ? feed.data.releases[0] : undefined
  const summary = releaseSummary(latest)
  const [skinInput, setSkinInput] = useState(skinUsername)
  const skinStatus = useInterfaceStore((state) => state.skinStatus)
  const skinMessage = useInterfaceStore((state) => state.skinMessage)
  const requestSkin = useInterfaceStore((state) => state.requestSkin)

  function submitSkin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalized = skinInput.trim()
    if (normalized) requestSkin(normalized)
  }

  return (
    <div className="home-view screen-page">
      <div className="hero-copy">
        <MetaLabel>Último lanzamiento</MetaLabel>
        <h1>{latest?.version || (feed.state === 'loading' ? 'Sintonizando…' : 'INTERFACE')}</h1>
        <p>{summary || (feed.state === 'loading' ? 'Buscando la última señal…' : 'Las próximas versiones aparecerán aquí.')}</p>
        {latest && <div className="home-release-meta">
          <time dateTime={latest.publishedAt}>{formatDate(latest.publishedAt)}</time>
          <span>{latest.prerelease ? 'PRELANZAMIENTO' : 'VERSIÓN ESTABLE'}</span>
        </div>}
        <button className="primary-action" onClick={() => navigateTo('updates')}>
          Leer notas <span aria-hidden="true">↗</span>
        </button>
      </div>

      <div className="home-lower">
        {!mobile && <form className="skin-form" onSubmit={submitSkin}>
          <label htmlFor="player-name">Skin del avatar</label>
          <div className="skin-input-row">
            <input
              id="player-name"
              autoComplete="off"
              maxLength={16}
              pattern="[A-Za-z0-9_]{3,16}"
              placeholder="Steve"
              value={skinInput}
              onChange={(event) => setSkinInput(event.target.value)}
            />
            <button type="submit" aria-label="Cargar skin" disabled={skinStatus === 'loading'}>Cargar</button>
          </div>
          <p className={`skin-status skin-status--${skinStatus}`} role="status" aria-live="polite">{skinMessage}</p>
          <a className="skin-credit" href="https://mc-heads.net/" target="_blank" rel="noopener noreferrer">Skins por MCHeads ↗</a>
        </form>}
      </div>
    </div>
  )
}

function UpdatesView({ feed }: { feed: Loadable<ReleaseFeed> }) {
  if (feed.state !== 'ready') return <FeedMessage state={feed.state} />
  if (feed.data.releases.length === 0) return <FeedMessage state="ready" />

  return (
    <div className="scroll-view screen-page">
      <div className="page-heading">
        <MetaLabel>Archivo de versiones</MetaLabel>
        <h2>Actualizaciones</h2>
      <p>{feed.data.releases.length} lanzamientos</p>
      </div>
      <div className="release-list">
        {feed.data.releases.map((release) => (
          <article className="release-entry" key={release.version}>
            <ReleaseMeta release={release} />
            {release.title && release.title !== release.version && <h3>{release.title}</h3>}
            <ReleaseNotes markdown={release.notesMarkdown || ''} version={release.version} />
          </article>
        ))}
      </div>
    </div>
  )
}

function DownloadsView({ feed }: { feed: Loadable<ReleaseFeed> }) {
  if (feed.state !== 'ready') return <FeedMessage state={feed.state} />
  const latestRelease = feed.data.releases[0]
  if (!latestRelease) return <FeedMessage state="ready" />

  const installer = latestRelease.assets.find((asset) =>
    /\.exe$/i.test(asset.name) && safeHttpsUrl(asset.downloadUrl) !== null,
  )
  const downloadUrl = installer ? safeHttpsUrl(installer.downloadUrl) : null

  return (
    <div className="scroll-view screen-page">
      <div className="page-heading">
        <MetaLabel>Instaladores y archivos</MetaLabel>
        <h2>Archivos</h2>
      </div>
      <div className="download-groups">
        <section className="download-group" aria-label={`Descarga de la versión ${latestRelease.version}`}>
          <div className="download-version">
            <strong>{latestRelease.version}</strong>
            <time dateTime={latestRelease.publishedAt}>{formatDate(latestRelease.publishedAt)}</time>
          </div>
          {installer && downloadUrl ? (
            <>
              <ul>
                <li>
                  <span className="file-mark" aria-hidden="true">•</span>
                  <span className="file-detail"><strong>{installer.name}</strong><small>{formatBytes(installer.sizeBytes)}</small></span>
                </li>
              </ul>
              <a className="primary-action" href={downloadUrl} aria-label={`Descargar la versión ${latestRelease.version}`}>
                Descargar {latestRelease.version} <span aria-hidden="true">↓</span>
              </a>
            </>
          ) : (
            <p className="system-message">La versión más reciente no incluye un instalador descargable.</p>
          )}
        </section>
      </div>
    </div>
  )
}

function RoadmapView({ roadmap }: { roadmap: Loadable<Roadmap> }) {
  if (roadmap.state === 'loading') return <p className="system-message">Abriendo el roadmap…</p>
  if (roadmap.state === 'error') return <p className="system-message system-message--error" role="alert">No fue posible cargar el roadmap.</p>
  if (roadmap.data.items.length === 0) {
    return (
      <div className="screen-page roadmap-empty">
        <MetaLabel>En preparación</MetaLabel>
        <h2>Roadmap</h2>
        <p>Las próximas prioridades se publicarán aquí cuando estén definidas.</p>
      </div>
    )
  }

  return (
    <div className="scroll-view screen-page">
      <div className="page-heading"><MetaLabel>Próximos hitos</MetaLabel><h2>Roadmap</h2></div>
      <ol className="roadmap-list">
        {roadmap.data.items.map((item) => (
          <li className="roadmap-item" key={item.id}>
            <span className={`roadmap-status roadmap-status--${item.status}`}>{item.status.replace('_', ' ')}</span>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            {item.target && <time>{item.target}</time>}
          </li>
        ))}
      </ol>
    </div>
  )
}

export function TvInterface({ mobile = false }: { mobile?: boolean }) {
  const page = useInterfaceStore((state) => state.page)
  const setPage = useInterfaceStore((state) => state.setPage)
  const channel = useTvStore((state) => state.channel)
  const setChannel = useTvStore((state) => state.setChannel)
  const volume = useTvStore((state) => state.volume)
  const channelEggActive = useTvStore((state) => state.channelEggActive)
  const channelEggNonce = useTvStore((state) => state.channelEggNonce)
  const dismissChannelEgg = useTvStore((state) => state.dismissChannelEgg)
  const { feed, roadmap } = usePublicContent()
  const [tuning, setTuning] = useState(false)
  const [tuningNonce, setTuningNonce] = useState(0)
  const previousChannel = useRef(channel)
  const channelEggStartChannel = useRef<number | null>(null)

  useEffect(() => {
    if (channel !== channelByPage[page]) setChannel(channelByPage[page])
  }, [channel, page, setChannel])

  useEffect(() => {
    if (previousChannel.current === channel) return
    previousChannel.current = channel
    setTuning(true)
    setTuningNonce((nonce) => nonce + 1)
    const timeout = window.setTimeout(() => setTuning(false), 500)
    return () => window.clearTimeout(timeout)
  }, [channel])

  useEffect(() => {
    if (!channelEggActive) {
      channelEggStartChannel.current = null
      return
    }
    if (channelEggStartChannel.current === null) {
      channelEggStartChannel.current = channel
    } else if (channelEggStartChannel.current !== channel) {
      dismissChannelEgg()
    }
  }, [channel, channelEggActive, dismissChannelEgg])

  function navigateTo(nextPage: PageId) {
    if (channelByPage[nextPage] !== channel) playChannelTuningNoise(volume)
    setPage(nextPage)
  }

  return (
    <main
      className={mobile ? 'tv-interface tv-interface--mobile' : 'tv-interface'}
      aria-label="Actualizaciones del launcher INTERFACE"
    >
      <header className="screen-header">
        <div className="screen-brand">
          <img
            className="brand-mascot"
            src={`${import.meta.env.BASE_URL}interface-mascot.svg`}
            alt=""
            aria-hidden="true"
          />
          <div><strong>INTERFACE</strong></div>
        </div>
        <span className="channel-label"><span className="signal-dot" /> CANAL {String(channel).padStart(2, '0')}</span>
      </header>

      <div className="screen-layout">
        <nav className="screen-nav" aria-label="Secciones">
          {navigation.map((item) => (
            <button
              type="button"
              key={item.id}
              className={page === item.id ? 'nav-item nav-item--active' : 'nav-item'}
              aria-current={page === item.id ? 'page' : undefined}
              onClick={() => navigateTo(item.id)}
            >
              <span className="nav-number">{item.number}</span>
              <span>{item.label}</span>
              {page === item.id && <span className="nav-arrow" aria-hidden="true">↗</span>}
            </button>
          ))}
        </nav>

        <div className="screen-content" key={page}>
          {page === 'home' && <HomeView feed={feed} mobile={mobile} navigateTo={navigateTo} />}
          {page === 'updates' && <UpdatesView feed={feed} />}
          {page === 'downloads' && <DownloadsView feed={feed} />}
          {page === 'roadmap' && <RoadmapView roadmap={roadmap} />}
        </div>
      </div>

      <footer className="screen-footer">
        <span>INTERFACE · ARCHIVO DE VERSIONES</span>
        <span>FIN DE EMISIÓN <b aria-hidden="true">●</b></span>
      </footer>
      {tuning && <div key={tuningNonce} className="channel-tuning-overlay" aria-hidden="true" />}
      {channelEggActive && <ChannelEasterEgg key={channelEggNonce} onClose={dismissChannelEgg} />}
      <div className="crt-glass-curvature" aria-hidden="true" />
      <div className="scanline-overlay" aria-hidden="true" />
      <svg className="crt-noise-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <filter id="crt-screen-warp" x="-1%" y="-1%" width="102%" height="102%">
          <feTurbulence type="fractalNoise" baseFrequency="0.003 0.012" numOctaves="1" seed="7" result="glass-curve" />
          <feDisplacementMap in="SourceGraphic" in2="glass-curve" scale="1.8" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="crt-noise-filter">
          <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="2" seed="19" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="table" tableValues="0 0.18" />
          </feComponentTransfer>
        </filter>
        <rect width="100%" height="100%" filter="url(#crt-noise-filter)" />
      </svg>
    </main>
  )
}
