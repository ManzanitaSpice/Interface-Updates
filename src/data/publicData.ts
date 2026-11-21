import type { ReleaseFeed, Roadmap } from '../types'

const dataUrl = (name: string) => new URL(`data/${name}`, `${window.location.origin}${import.meta.env.BASE_URL}`).href

export async function getReleaseFeed(signal?: AbortSignal): Promise<ReleaseFeed> {
  const response = await fetch(dataUrl('releases.json'), {
    headers: { Accept: 'application/json' },
    signal,
  })
  if (!response.ok) throw new Error(`El feed respondió con HTTP ${response.status}.`)

  const payload: unknown = await response.json()
  if (!isRecord(payload) || payload.schemaVersion !== 1 || !Array.isArray(payload.releases)) {
    throw new Error('El feed de versiones tiene un formato desconocido.')
  }

  return payload as unknown as ReleaseFeed
}

export async function getRoadmap(signal?: AbortSignal): Promise<Roadmap> {
  const response = await fetch(dataUrl('roadmap.json'), {
    headers: { Accept: 'application/json' },
    signal,
  })
  if (!response.ok) throw new Error(`El roadmap respondió con HTTP ${response.status}.`)

  const payload: unknown = await response.json()
  if (!isRecord(payload) || payload.schemaVersion !== 1 || !Array.isArray(payload.items)) {
    throw new Error('El roadmap tiene un formato desconocido.')
  }

  return payload as unknown as Roadmap
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function safeHttpsUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}

export function formatDate(value: string): string {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return value
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value < 0) return 'Tamaño desconocido'
  if (value < 1024) return `${value} B`
  const units = ['KB', 'MB', 'GB']
  let amount = value / 1024
  let index = 0
  while (amount >= 1024 && index < units.length - 1) {
    amount /= 1024
    index += 1
  }
  return `${amount.toFixed(amount >= 10 ? 0 : 1)} ${units[index]}`
}
