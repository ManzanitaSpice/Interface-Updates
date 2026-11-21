export interface ScreenCalibration {
  position: [number, number, number]
  rotation: [number, number, number]
  width: number
  height: number
}

export const TV_CONTROL_IDS = [
  'channel',
  'volume',
  'power',
  'channelDown',
  'channelUp',
  'volumeDown',
  'volumeUp',
] as const

export type TvControlId = typeof TV_CONTROL_IDS[number]

export interface TvControlTransform {
  position: [number, number, number]
  rotation: [number, number, number]
  scale: number
}

export type TvControlCalibration = Record<TvControlId, TvControlTransform>

export const SCREEN_CALIBRATION: ScreenCalibration = {
  position: [-0.289, 1.142, 0.750],
  rotation: [0.003491, 0.000000, 0.000000],
  width: 886,
  height: 678,
}

export const TV_CONTROL_CALIBRATION: TvControlCalibration = {
  channel: { position: [0.945, 1.509, 0.949], rotation: [0.031415926536, -0.137881010908, 0.027925268032], scale: 1.13 },
  volume: { position: [0.945, 1.164, 0.949], rotation: [-0.003490658504, -0.127409035396, 0.000000000000], scale: 1.12 },
  power: { position: [1.089, 0.899, 0.835], rotation: [0.000000000000, 0.000000000000, 0.000000000000], scale: 1.00 },
  channelDown: { position: [-0.911, 0.208, 0.679], rotation: [0.000000000000, 0.000000000000, 0.000000000000], scale: 1.00 },
  channelUp: { position: [-0.771, 0.208, 0.679], rotation: [0.000000000000, 0.000000000000, 0.000000000000], scale: 1.00 },
  volumeDown: { position: [-0.636, 0.208, 0.679], rotation: [0.000000000000, 0.000000000000, 0.000000000000], scale: 1.00 },
  volumeUp: { position: [-0.500, 0.208, 0.679], rotation: [0.000000000000, 0.000000000000, 0.000000000000], scale: 1.00 },
}
