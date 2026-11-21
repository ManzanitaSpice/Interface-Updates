import { useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

const textureSize = 512
const boardsAcross = 8
const boardWidth = textureSize / boardsAcross
const boardLength = textureSize / 4

type WoodTextures = {
  color: THREE.CanvasTexture
  roughness: THREE.CanvasTexture
  height: THREE.CanvasTexture
}

function createRandom(seed = 0x5eed1234) {
  let state = seed >>> 0

  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}

function createCanvas() {
  const canvas = document.createElement('canvas')
  canvas.width = textureSize
  canvas.height = textureSize
  return canvas
}

function getContext(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Could not create the wooden floor texture canvas')
  return context
}

function drawGrain(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  random: () => number,
  color: string,
  width: number,
) {
  const center = x + 5 + random() * (boardWidth - 10)
  const amplitude = 0.6 + random() * 1.2
  const phase = random() * Math.PI * 2

  context.beginPath()
  for (let step = 0; step <= 8; step += 1) {
    const progress = step / 8
    const grainX = center + Math.sin(progress * Math.PI * 3 + phase) * amplitude
    const grainY = y + 3 + progress * (boardLength - 6)
    if (step === 0) context.moveTo(grainX, grainY)
    else context.lineTo(grainX, grainY)
  }
  context.strokeStyle = color
  context.lineWidth = width
  context.stroke()
}

function createWoodTextures(anisotropy: number): WoodTextures {
  const colorCanvas = createCanvas()
  const roughnessCanvas = createCanvas()
  const heightCanvas = createCanvas()
  const colorContext = getContext(colorCanvas)
  const roughnessContext = getContext(roughnessCanvas)
  const heightContext = getContext(heightCanvas)
  const random = createRandom()
  const plankColors = ['#1d140b', '#21170d', '#24190f', '#1b1209', '#261b10', '#20160c']

  colorContext.fillStyle = '#100c07'
  colorContext.fillRect(0, 0, textureSize, textureSize)
  roughnessContext.fillStyle = '#f0f0f0'
  roughnessContext.fillRect(0, 0, textureSize, textureSize)
  heightContext.fillStyle = '#707070'
  heightContext.fillRect(0, 0, textureSize, textureSize)

  const drawPlank = (column: number, y: number, seed: number) => {
    const plankRandom = createRandom(seed)
    const x = column * boardWidth
    const color = plankColors[Math.floor(plankRandom() * plankColors.length)]
    const roughness = 224 + Math.floor(plankRandom() * 25)
    const faceX = x + 1
    const faceY = y + 1
    const faceWidth = boardWidth - 2
    const faceLength = boardLength - 2

    colorContext.fillStyle = color
    colorContext.fillRect(faceX, faceY, faceWidth, faceLength)
    colorContext.fillStyle = 'rgba(0, 0, 0, 0.10)'
    colorContext.fillRect(faceX, faceY, 3, faceLength)
    colorContext.fillStyle = 'rgba(190, 137, 78, 0.035)'
    colorContext.fillRect(faceX + faceWidth - 2, faceY, 2, faceLength)

    roughnessContext.fillStyle = `rgb(${roughness} ${roughness} ${roughness})`
    roughnessContext.fillRect(faceX, faceY, faceWidth, faceLength)
    roughnessContext.fillStyle = 'rgb(250 250 250)'
    roughnessContext.fillRect(faceX, faceY, 2, faceLength)

    heightContext.fillStyle = 'rgb(134 134 134)'
    heightContext.fillRect(faceX, faceY, faceWidth, faceLength)
    heightContext.fillStyle = 'rgb(105 105 105)'
    heightContext.fillRect(x, y, boardWidth, 1)
    heightContext.fillRect(x, y + boardLength - 1, boardWidth, 1)

    for (let line = 0; line < 5; line += 1) {
      drawGrain(colorContext, faceX, faceY, plankRandom, line % 2 === 0
        ? 'rgba(151, 102, 54, 0.10)'
        : 'rgba(7, 4, 2, 0.14)', 0.7 + plankRandom() * 0.6)
      drawGrain(heightContext, faceX, faceY, plankRandom, line % 2 === 0
        ? 'rgba(255, 255, 255, 0.20)'
        : 'rgba(0, 0, 0, 0.15)', 0.6 + plankRandom() * 0.7)
      drawGrain(roughnessContext, faceX, faceY, plankRandom, 'rgba(255, 255, 255, 0.22)', 0.8)
    }

    if (plankRandom() < 0.24) {
      const scratchX = faceX + 7 + plankRandom() * (faceWidth - 14)
      const scratchY = faceY + 12 + plankRandom() * (faceLength - 24)
      const scratchLength = 7 + plankRandom() * 17

      colorContext.beginPath()
      colorContext.moveTo(scratchX, scratchY)
      colorContext.lineTo(scratchX + (plankRandom() - 0.5) * 5, scratchY + scratchLength)
      colorContext.strokeStyle = 'rgba(188, 137, 81, 0.15)'
      colorContext.lineWidth = 0.8
      colorContext.stroke()

      heightContext.beginPath()
      heightContext.moveTo(scratchX, scratchY)
      heightContext.lineTo(scratchX + (plankRandom() - 0.5) * 5, scratchY + scratchLength)
      heightContext.strokeStyle = 'rgba(255, 255, 255, 0.26)'
      heightContext.lineWidth = 1
      heightContext.stroke()

      roughnessContext.beginPath()
      roughnessContext.moveTo(scratchX, scratchY)
      roughnessContext.lineTo(scratchX + (plankRandom() - 0.5) * 5, scratchY + scratchLength)
      roughnessContext.strokeStyle = 'rgba(255, 255, 255, 0.35)'
      roughnessContext.lineWidth = 1
      roughnessContext.stroke()
    }
  }

  for (let column = 0; column < boardsAcross; column += 1) {
    const offset = Math.floor(random() * boardLength)

    for (let row = 0; row < textureSize / boardLength; row += 1) {
      const y = offset + row * boardLength
      const seed = Math.floor(random() * 0xffffffff)
      drawPlank(column, y, seed)
      if (y + boardLength > textureSize) drawPlank(column, y - textureSize, seed)
    }
  }

  const createTexture = (canvas: HTMLCanvasElement, colorSpace: THREE.ColorSpace) => {
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = colorSpace
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(48, 24)
    texture.anisotropy = Math.min(8, anisotropy)
    return texture
  }

  return {
    color: createTexture(colorCanvas, THREE.SRGBColorSpace),
    roughness: createTexture(roughnessCanvas, THREE.NoColorSpace),
    height: createTexture(heightCanvas, THREE.NoColorSpace),
  }
}

export function WoodFloor() {
  const { gl } = useThree()
  const textures = useMemo(
    () => createWoodTextures(gl.capabilities.getMaxAnisotropy()),
    [gl],
  )
  const material = useMemo(() => new THREE.MeshStandardMaterial({
    map: textures.color,
    roughnessMap: textures.roughness,
    bumpMap: textures.height,
    roughness: 0.96,
    metalness: 0,
    bumpScale: 0.018,
  }), [textures])

  useEffect(() => () => {
    material.dispose()
    textures.color.dispose()
    textures.roughness.dispose()
    textures.height.dispose()
  }, [material, textures])

  return (
    <mesh position={[0, -0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[90, 90]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}
