import { create } from 'zustand'

interface TvState {
  poweredOn: boolean
  channel: number
  volume: number
  channelEggActive: boolean
  channelEggNonce: number
  channelEggLockedUntil: number
  setPoweredOn: (poweredOn: boolean) => void
  setChannel: (channel: number) => void
  setVolume: (volume: number) => void
  triggerChannelEgg: () => void
  dismissChannelEgg: () => void
}

const CHANNEL_EGG_LOCK_MS = 5000

export const useTvStore = create<TvState>((set) => ({
  poweredOn: true,
  channel: 1,
  volume: 2,
  channelEggActive: false,
  channelEggNonce: 0,
  channelEggLockedUntil: 0,
  setPoweredOn: (poweredOn) => set({ poweredOn }),
  setChannel: (channel) => set((state) => Date.now() < state.channelEggLockedUntil
    ? state
    : { channel: ((channel - 1) % 4) + 1 }),
  setVolume: (volume) => set({ volume: Math.max(0, Math.min(5, volume)) }),
  triggerChannelEgg: () => set((state) => ({
    channelEggActive: true,
    channelEggNonce: state.channelEggNonce + 1,
    channelEggLockedUntil: Date.now() + CHANNEL_EGG_LOCK_MS,
  })),
  dismissChannelEgg: () => set({ channelEggActive: false }),
}))
