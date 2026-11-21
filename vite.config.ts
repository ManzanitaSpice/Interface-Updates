import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import type { ScreenCalibration, TvControlCalibration, TvControlId, TvControlTransform } from './src/scene/screenCalibration'

const MAX_CALIBRATION_BODY = 4096
const MAX_ROTATION = 8 * Math.PI / 180
const MAX_CONTROL_ROTATION = 12 * Math.PI / 180
const TV_CONTROL_IDS = ['channel', 'volume', 'power', 'channelDown', 'channelUp', 'volumeDown', 'volumeUp'] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNumberTuple(value: unknown, min: number, max: number): value is [number, number, number] {
  return Array.isArray(value)
    && value.length === 3
    && value.every((item) => typeof item === 'number' && Number.isFinite(item) && item >= min && item <= max)
}

interface CalibrationPayload {
  screen: ScreenCalibration
  controls: TvControlCalibration
}

function isControlTransform(value: unknown): value is TvControlTransform {
  if (!isRecord(value) || Object.keys(value).sort().join(',') !== 'position,rotation,scale') return false
  if (!isNumberTuple(value.position, -Infinity, Infinity)) return false
  if (!isNumberTuple(value.rotation, -MAX_CONTROL_ROTATION, MAX_CONTROL_ROTATION)) return false
  if (value.position[0] < -1.25 || value.position[0] > 1.25) return false
  if (value.position[1] < 0.05 || value.position[1] > 1.9) return false
  if (value.position[2] < 0.4 || value.position[2] > 1.15) return false
  return typeof value.scale === 'number'
    && Number.isFinite(value.scale)
    && value.scale >= 0.6
    && value.scale <= 1.4
}

function parseCalibration(value: unknown): CalibrationPayload | null {
  if (!isRecord(value)) return null
  if (Object.keys(value).sort().join(',') !== 'controls,screen') return null
  if (!isRecord(value.screen) || Object.keys(value.screen).sort().join(',') !== 'height,position,rotation,width') return null
  if (!isNumberTuple(value.screen.position, -Infinity, Infinity)) return null
  if (!isNumberTuple(value.screen.rotation, -MAX_ROTATION, MAX_ROTATION)) return null
  if (value.screen.position[0] < -0.55 || value.screen.position[0] > 0.05) return null
  if (typeof value.screen.width !== 'number' || !Number.isInteger(value.screen.width) || value.screen.width < 820 || value.screen.width > 1050) return null
  if (typeof value.screen.height !== 'number' || !Number.isInteger(value.screen.height) || value.screen.height < 650 || value.screen.height > 850) return null
  if (value.screen.position[1] < 0.9 || value.screen.position[1] > 1.3) return null
  if (value.screen.position[2] < 0.75 || value.screen.position[2] > 1.1) return null
  if (!isRecord(value.controls)) return null
  const expectedIds = [...TV_CONTROL_IDS].sort().join(',')
  if (Object.keys(value.controls).sort().join(',') !== expectedIds) return null

  const controls = {} as TvControlCalibration
  for (const id of TV_CONTROL_IDS) {
    const transform = value.controls[id]
    if (!isControlTransform(transform)) return null
    controls[id as TvControlId] = transform
  }

  return {
    screen: {
      position: value.screen.position,
      rotation: value.screen.rotation,
      width: value.screen.width,
      height: value.screen.height,
    },
    controls,
  }
}

function formatTuple(values: number[], decimals: number) {
  return `[${values.map((value) => (Object.is(value, -0) ? 0 : value).toFixed(decimals)).join(', ')}]`
}

function screenCalibrationPlugin(): Plugin {
  return {
    name: 'screen-calibration-source-writer',
    apply: 'serve' as const,
    configureServer(server) {
      const calibrationPath = fileURLToPath(new URL('./src/scene/screenCalibration.ts', import.meta.url))

      server.middlewares.use('/__screen-calibration', (request, response) => {
        if (request.method !== 'POST') {
          response.statusCode = 405
          response.setHeader('Allow', 'POST')
          response.end('Método no permitido.')
          return
        }

        const contentType = request.headers['content-type']?.split(';', 1)[0].trim().toLowerCase()
        if (contentType !== 'application/json') {
          response.statusCode = 415
          response.end('Se requiere application/json.')
          return
        }

        const contentLength = Number(request.headers['content-length'] ?? 0)
        if (contentLength > MAX_CALIBRATION_BODY) {
          response.statusCode = 413
          response.end('La calibración excede el tamaño permitido.')
          request.resume()
          return
        }

        const chunks: Buffer[] = []
        let received = 0
        let tooLarge = false
        request.on('data', (chunk: Buffer) => {
          received += chunk.length
          if (received > MAX_CALIBRATION_BODY) {
            tooLarge = true
            chunks.length = 0
            return
          }
          if (!tooLarge) chunks.push(chunk)
        })

        request.on('end', async () => {
          if (tooLarge) {
            response.statusCode = 413
            response.end('La calibración excede el tamaño permitido.')
            return
          }

          let payload: unknown
          try {
            payload = JSON.parse(Buffer.concat(chunks).toString('utf8'))
          } catch {
            response.statusCode = 400
            response.end('JSON inválido.')
            return
          }

          const calibration = parseCalibration(payload)
          if (!calibration) {
            response.statusCode = 400
            response.end('Valores de calibración inválidos o fuera de rango.')
            return
          }

          const source = `export interface ScreenCalibration {
  position: [number, number, number]
  rotation: [number, number, number]
  width: number
  height: number
}

export const TV_CONTROL_IDS = [
${TV_CONTROL_IDS.map((id) => "  '" + id + "',").join('\n')}
] as const

export type TvControlId = typeof TV_CONTROL_IDS[number]

export interface TvControlTransform {
  position: [number, number, number]
  rotation: [number, number, number]
  scale: number
}

export type TvControlCalibration = Record<TvControlId, TvControlTransform>

export const SCREEN_CALIBRATION: ScreenCalibration = {
  position: ${formatTuple(calibration.screen.position, 3)},
  rotation: ${formatTuple(calibration.screen.rotation, 6)},
  width: ${calibration.screen.width},
  height: ${calibration.screen.height},
}

export const TV_CONTROL_CALIBRATION: TvControlCalibration = {
${TV_CONTROL_IDS.map((id) => `  ${id}: { position: ${formatTuple(calibration.controls[id].position, 3)}, rotation: ${formatTuple(calibration.controls[id].rotation, 12)}, scale: ${calibration.controls[id].scale.toFixed(2)} },`).join('\n')}
}
`

          try {
            await writeFile(calibrationPath, source, 'utf8')
            response.statusCode = 200
            response.setHeader('Content-Type', 'application/json; charset=utf-8')
            response.end(JSON.stringify({ saved: true }))
          } catch (error) {
            console.error('[screen-calibration] No se pudo guardar:', error)
            response.statusCode = 500
            response.end('No se pudo escribir screenCalibration.ts.')
          }
        })
      })
    },
  }
}

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/Interface-Updates/' : '/',
  plugins: [react(), tailwindcss(), screenCalibrationPlugin()],
  resolve: { dedupe: ['three'] },
  build: {
    target: 'es2022',
    assetsInlineLimit: 4096,
    sourcemap: false,
  },
})
