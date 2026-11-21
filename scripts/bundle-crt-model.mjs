import { stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { NodeIO } from '@gltf-transform/core'

const input = resolve('assets/models/television-01-source/Television_01_2k.gltf')
const output = resolve('public/models/television-01.glb')
const io = new NodeIO()
const document = await io.read(input)
const root = document.getRoot()
const materials = root.listMaterials()

if (root.listNodes().length !== 1 || root.listMeshes().length !== 1) {
  throw new Error('La fuente del CRT cambió: revisa el modelo antes de empaquetarlo.')
}

if (materials.length !== 1 || !materials[0].getBaseColorTexture() || !materials[0].getNormalTexture()) {
  throw new Error('La fuente del CRT debe conservar sus mapas PBR de color y normales.')
}

await io.write(output, document)
const { size } = await stat(output)
console.log(`CRT PBR empaquetado: ${output} (${(size / 1024 / 1024).toFixed(2)} MiB)`)
