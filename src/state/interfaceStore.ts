import { create } from 'zustand'
import type { PageId } from '../types'

type SkinStatus = 'default' | 'loading' | 'ready' | 'error'

interface InterfaceState {
  page: PageId
  setPage: (page: PageId) => void
  cameraZoomOffset: number
  adjustCameraZoom: (delta: number) => void
  skinUsername: string
  skinRequestId: number
  skinStatus: SkinStatus
  skinMessage: string
  requestSkin: (username: string) => void
  setSkinResult: (status: SkinStatus, message: string) => void
}

export const useInterfaceStore = create<InterfaceState>((set) => ({
  page: 'home',
  setPage: (page) => set({ page }),
  cameraZoomOffset: 0,
  adjustCameraZoom: (delta) => set((state) => ({
    cameraZoomOffset: Math.max(-1.5, Math.min(2.5, state.cameraZoomOffset + delta)),
  })),
  skinUsername: 'Steve',
  skinRequestId: 0,
  skinStatus: 'default',
  skinMessage: 'Skin clásica de Steve.',
  requestSkin: (username) => set((state) => ({
    skinUsername: username,
    skinRequestId: state.skinRequestId + 1,
    skinStatus: 'loading',
    skinMessage: `Buscando la skin de ${username}…`,
  })),
  setSkinResult: (skinStatus, skinMessage) => set({ skinStatus, skinMessage }),
}))
