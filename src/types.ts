export type PageId = 'home' | 'updates' | 'downloads' | 'roadmap'

export interface ReleaseAsset {
  name: string
  downloadUrl: string
  sizeBytes: number
  contentType: string
  digest?: string
}

export interface Release {
  version: string
  title: string
  publishedAt: string
  releaseUrl: string
  notesMarkdown: string
  prerelease: boolean
  assets: ReleaseAsset[]
}

export interface ReleaseFeed {
  schemaVersion: 1
  sourceRepository: string
  generatedAt: string
  releases: Release[]
}

export type RoadmapStatus = 'completado' | 'en_progreso' | 'planeado'

export interface RoadmapItem {
  id: string
  title: string
  description: string
  status: RoadmapStatus
  target?: string
}

export interface Roadmap {
  schemaVersion: 1
  lastUpdated: string
  items: RoadmapItem[]
}
