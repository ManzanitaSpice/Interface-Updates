const statusElement = document.querySelector('#feed-status')
const releaseList = document.querySelector('#release-list')
const feedUrl = new URL('./data/releases.json', import.meta.url)

function safeHttpsUrl(value) {
  if (typeof value !== 'string') return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}

function formatDate(value) {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return String(value ?? '')
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

function appendPlainTextWithLineBreaks(element, value) {
  const lines = value.split(/\r?\n/)
  lines.forEach((line, index) => {
    element.append(document.createTextNode(line))
    if (index < lines.length - 1) element.append(document.createElement('br'))
  })
}

function renderRelease(release) {
  const item = document.createElement('li')
  const title = document.createElement('h2')
  title.textContent = typeof release.title === 'string' && release.title.trim()
    ? release.title
    : release.version
  item.append(title)

  const details = document.createElement('p')
  const date = document.createElement('time')
  date.dateTime = release.publishedAt
  date.textContent = formatDate(release.publishedAt)
  details.append(document.createTextNode(`Versión ${release.version} · `), date)
  if (release.prerelease) details.append(document.createTextNode(' · Prelanzamiento'))
  item.append(details)

  const releaseUrl = safeHttpsUrl(release.releaseUrl)
  if (releaseUrl) {
    const releaseLink = document.createElement('p')
    const anchor = document.createElement('a')
    anchor.href = releaseUrl
    anchor.textContent = 'Ver publicación en GitHub'
    releaseLink.append(anchor)
    item.append(releaseLink)
  }

  const notes = document.createElement('p')
  if (typeof release.notesMarkdown === 'string' && release.notesMarkdown.trim()) {
    appendPlainTextWithLineBreaks(notes, release.notesMarkdown)
  } else {
    notes.textContent = 'Esta versión no incluye notas.'
  }
  item.append(notes)

  const assets = Array.isArray(release.assets)
    ? release.assets.filter((asset) => safeHttpsUrl(asset?.downloadUrl))
    : []

  if (assets.length > 0) {
    const downloads = document.createElement('ul')
    for (const asset of assets) {
      const listItem = document.createElement('li')
      const anchor = document.createElement('a')
      anchor.href = safeHttpsUrl(asset.downloadUrl)
      anchor.textContent = typeof asset.name === 'string' && asset.name.trim()
        ? asset.name
        : 'Descargar archivo'
      anchor.rel = 'noopener noreferrer'
      listItem.append(anchor)
      downloads.append(listItem)
    }
    item.append(downloads)
  } else {
    const noDownloads = document.createElement('p')
    noDownloads.textContent = 'Esta versión no tiene archivos de descarga adjuntos.'
    item.append(noDownloads)
  }

  item.append(document.createElement('hr'))
  return item
}

async function loadReleases() {
  try {
    const response = await fetch(feedUrl, { headers: { Accept: 'application/json' } })
    if (!response.ok) throw new Error(`Feed request failed with HTTP ${response.status}`)

    const payload = await response.json()
    if (payload?.schemaVersion !== 1 || !Array.isArray(payload.releases)) {
      throw new Error('The release feed has an unsupported format')
    }

    if (payload.releases.length === 0) {
      statusElement.textContent = 'No hay versiones publicadas por ahora.'
      return
    }

    const releases = document.createDocumentFragment()
    for (const release of payload.releases) releases.append(renderRelease(release))
    releaseList.replaceChildren(releases)
    releaseList.hidden = false
    statusElement.textContent = `Se encontraron ${payload.releases.length} versiones publicadas.`
  } catch {
    statusElement.textContent = 'No se pudieron cargar las actualizaciones. Inténtalo de nuevo más tarde.'
  }
}

loadReleases()
