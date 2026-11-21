import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import sharp from 'sharp'

const textureDirectory = resolve('assets/models/television-01-source/textures')
const patches = [
  { file: 'Television_01_diff_2k.jpg', variant: 'diffuse' },
  { file: 'Television_01_nor_gl_2k.jpg', variant: 'normal' },
  { file: 'Television_01_arm_2k.jpg', variant: 'material' },
]

function makeOverlay(variant) {
  const svg = variant === 'diffuse'
    ? `
      <defs>
        <linearGradient id="badge" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="#54452e" />
          <stop offset=".48" stop-color="#403522" />
          <stop offset="1" stop-color="#30281b" />
        </linearGradient>
        <linearGradient id="serial" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stop-color="#d2cdc1" />
          <stop offset="0.55" stop-color="#b9b3a8" />
          <stop offset="1" stop-color="#d1cabb" />
        </linearGradient>
      </defs>
      <!-- Blank original badge; the fitted control plate carries the single INTERFACE mark. -->
      <rect x="761" y="1418" width="193" height="44" rx="2" fill="url(#badge)" stroke="#9b7944" stroke-width="2" />
      <path d="M768 1422h179M768 1458h179" stroke="#ead39b" stroke-opacity=".22" stroke-width="1" />
      <path d="M773 1427l18 0M931 1453l12 0" stroke="#d3b16e" stroke-opacity=".3" stroke-width="1" />

      <!-- Replaces the four obsolete lower bezel legends, in place on the original face. -->
      <rect x="690" y="543" width="126" height="21" fill="#393737" />
      <text x="704" y="561" text-anchor="middle" fill="#c8a66c" font-family="Arial, sans-serif" font-size="8" font-weight="700" letter-spacing=".35">CH−</text>
      <text x="738" y="561" text-anchor="middle" fill="#c8a66c" font-family="Arial, sans-serif" font-size="8" font-weight="700" letter-spacing=".35">CH+</text>
      <text x="771" y="561" text-anchor="middle" fill="#c8a66c" font-family="Arial, sans-serif" font-size="7" font-weight="700" letter-spacing=".2">VOL−</text>
      <text x="804" y="561" text-anchor="middle" fill="#c8a66c" font-family="Arial, sans-serif" font-size="7" font-weight="700" letter-spacing=".2">VOL+</text>

      <!-- Side factory mark: removes the remaining VTECH emblem and leaves a small maker stamp. -->
      <rect x="1038" y="1528" width="62" height="168" rx="2" fill="#30281b" stroke="#81663d" stroke-width="2" />
      <path d="M1044 1534v155M1094 1534v155" stroke="#d2b270" stroke-opacity=".2" stroke-width="1" />

      <!-- Replaces the unrelated OEM serial sticker on the rear shell. -->
      <rect x="1706" y="101" width="58" height="135" rx="2" fill="url(#serial)" stroke="#77736f" stroke-width="2" />
      <path d="M1711 106h48M1711 231h48" stroke="#ffffff" stroke-opacity=".38" stroke-width="1" />
      <text x="1735" y="166" transform="rotate(-90 1735 166)" text-anchor="middle" fill="#38363a" font-family="Arial, sans-serif" font-size="10" font-weight="700" letter-spacing="1">INTERFACE</text>
      <text x="1749" y="167" transform="rotate(-90 1749 167)" text-anchor="middle" fill="#5a5557" font-family="Arial, sans-serif" font-size="6" letter-spacing=".8">CRT-01</text>
    `
    : variant === 'normal'
      ? `
        <rect x="761" y="1418" width="193" height="44" rx="2" fill="#8080ff" />
        <rect x="1038" y="1528" width="62" height="168" rx="2" fill="#8080ff" />
        <rect x="1706" y="101" width="58" height="135" rx="2" fill="#8080ff" />
      `
      : `
        <rect x="761" y="1418" width="193" height="44" rx="2" fill="#ff8c60" />
        <rect x="1038" y="1528" width="62" height="168" rx="2" fill="#ff8c60" />
        <rect x="1706" y="101" width="58" height="135" rx="2" fill="#ff8c60" />
      `

  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="2048">${svg}</svg>`)
}

for (const { file, variant } of patches) {
  const path = resolve(textureDirectory, file)
  const source = await readFile(path)
  const metadata = await sharp(source).metadata()
  if (metadata.width !== 2048 || metadata.height !== 2048) {
    throw new Error(`${file} cambió de tamaño; revisa las coordenadas UV antes de sustituirlo.`)
  }

  const branded = await sharp(source)
    .composite([{ input: makeOverlay(variant) }])
    .jpeg({ quality: 97, chromaSubsampling: '4:4:4' })
    .toBuffer()
  await writeFile(path, branded)
}

console.log('Marcas originales del CRT sustituidas por INTERFACE en los mapas PBR.')
