import { randomUUID } from 'node:crypto'
import { mkdir, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

const sourceRepository = 'ManzanitaSpice/Interface-2'
const apiUrl = `https://api.github.com/repos/${sourceRepository}/releases`
const pageSize = 100

function requireString(value, field, releaseTag) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Release ${releaseTag} has an invalid ${field}.`)
  }
  return value
}

function requireHttpsUrl(value, field, releaseTag) {
  const url = requireString(value, field, releaseTag)
  let parsedUrl
  try {
    parsedUrl = new URL(url)
  } catch {
    throw new Error(`Release ${releaseTag} contains an invalid ${field}.`)
  }
  if (parsedUrl.protocol !== 'https:') {
    throw new Error(`Release ${releaseTag} contains a non-HTTPS ${field}.`)
  }
  return parsedUrl.href
}

function normalizeAsset(asset, releaseTag) {
  if (!asset || typeof asset !== 'object') {
    throw new Error(`Release ${releaseTag} contains an invalid asset.`)
  }

  const name = requireString(asset.name, 'asset name', releaseTag)
  const downloadUrl = requireHttpsUrl(asset.browser_download_url, `download URL for ${name}`, releaseTag)
  if (!Number.isSafeInteger(asset.size) || asset.size < 0) {
    throw new Error(`Release ${releaseTag} contains an invalid byte size for ${name}.`)
  }
  const contentType = requireString(asset.content_type, `content type for ${name}`, releaseTag)
  if (asset.digest !== undefined && asset.digest !== null && typeof asset.digest !== 'string') {
    throw new Error(`Release ${releaseTag} contains an invalid digest for ${name}.`)
  }

  return {
    name,
    downloadUrl,
    sizeBytes: asset.size,
    contentType,
    ...(typeof asset.digest === 'string' && asset.digest.trim() ? { digest: asset.digest } : {}),
  }
}

function normalizeRelease(release) {
  if (!release || typeof release !== 'object') {
    throw new Error('GitHub returned an invalid release entry.')
  }

  const tag = requireString(release.tag_name, 'tag name', 'unknown')
  if (release.draft === true || !release.published_at) return null
  if (release.draft !== false || typeof release.prerelease !== 'boolean') {
    throw new Error(`Release ${tag} has invalid publication metadata.`)
  }
  if (release.name !== undefined && release.name !== null && typeof release.name !== 'string') {
    throw new Error(`Release ${tag} has an invalid title.`)
  }
  if (release.body !== undefined && release.body !== null && typeof release.body !== 'string') {
    throw new Error(`Release ${tag} has invalid release notes.`)
  }

  const publishedAt = requireString(release.published_at, 'publication date', tag)
  if (!Number.isFinite(Date.parse(publishedAt))) {
    throw new Error(`Release ${tag} has an invalid publication date.`)
  }

  const releaseUrl = requireHttpsUrl(release.html_url, 'release URL', tag)
  if (!Array.isArray(release.assets)) {
    throw new Error(`Release ${tag} has an invalid asset list.`)
  }

  const assets = release.assets
    .filter((asset) => asset?.state === 'uploaded' && typeof asset.browser_download_url === 'string')
    .map((asset) => normalizeAsset(asset, tag))

  return {
    version: tag,
    title: typeof release.name === 'string' && release.name.trim() ? release.name : tag,
    publishedAt,
    releaseUrl,
    notesMarkdown: typeof release.body === 'string' ? release.body : '',
    prerelease: release.prerelease,
    assets,
  }
}

async function fetchAllPublishedReleases() {
  const releases = []

  for (let page = 1; ; page += 1) {
    const url = new URL(apiUrl)
    url.searchParams.set('per_page', String(pageSize))
    url.searchParams.set('page', String(page))

    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'Interface-Updates-feed',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })

    if (!response.ok) {
      const rateLimit = response.headers.get('x-ratelimit-remaining')
      const rateLimitHint = response.status === 403 && rateLimit === '0'
        ? ' GitHub reports that the unauthenticated rate limit is exhausted.'
        : ''
      throw new Error(`GitHub releases request failed with HTTP ${response.status}.${rateLimitHint}`)
    }

    let pageReleases
    try {
      pageReleases = await response.json()
    } catch {
      throw new Error(`GitHub returned invalid JSON for release page ${page}.`)
    }

    if (!Array.isArray(pageReleases)) {
      throw new Error(`GitHub returned an invalid release list for page ${page}.`)
    }

    releases.push(...pageReleases)
    if (pageReleases.length < pageSize) break
  }

  const normalizedReleases = releases
    .map(normalizeRelease)
    .filter(Boolean)
    .sort((left, right) => Date.parse(right.publishedAt) - Date.parse(left.publishedAt))

  if (normalizedReleases.length === 0) {
    throw new Error(`No published releases were found in ${sourceRepository}; refusing to write an empty feed.`)
  }

  return normalizedReleases
}

async function writeJsonAtomically(outputPath, payload) {
  const absolutePath = path.resolve(outputPath)
  const directory = path.dirname(absolutePath)
  const temporaryPath = `${absolutePath}.${randomUUID()}.tmp`

  await mkdir(directory, { recursive: true })
  try {
    await writeFile(temporaryPath, `${JSON.stringify(payload, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' })
    await rename(temporaryPath, absolutePath)
  } catch (error) {
    await rm(temporaryPath, { force: true }).catch(() => {})
    throw error
  }
}

async function main() {
  const outputPath = process.argv[2] || path.join('dist', 'data', 'releases.json')
  const releases = await fetchAllPublishedReleases()
  const payload = {
    schemaVersion: 1,
    sourceRepository,
    generatedAt: new Date().toISOString(),
    releases,
  }

  await writeJsonAtomically(outputPath, payload)
  process.stdout.write(`Wrote ${releases.length} releases to ${path.resolve(outputPath)}\n`)
}

main().catch((error) => {
  process.stderr.write(`Failed to build the release feed: ${error.message}\n`)
  process.exitCode = 1
})
