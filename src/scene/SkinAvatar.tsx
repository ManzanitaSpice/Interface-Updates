import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PlayerObject } from 'skinview3d/libs/model.js'
import { inferModelType, loadSkinToCanvas } from 'skinview-utils'
import { useInterfaceStore } from '../state/interfaceStore'

function normalizeSkin(image: HTMLImageElement) {
  const normalizedSkin = document.createElement('canvas')
  loadSkinToCanvas(normalizedSkin, image)
  const texture = new THREE.CanvasTexture(normalizedSkin)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestMipmapNearestFilter
  texture.generateMipmaps = true
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.needsUpdate = true
  return { texture, normalizedSkin }
}

function disposePlayer(player: PlayerObject) {
  player.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return
    object.geometry.dispose()
    const materials = Array.isArray(object.material) ? object.material : [object.material]
    materials.forEach((material) => material.dispose())
  })
}

export function SkinAvatar() {
  const avatar = useMemo(() => new PlayerObject(), [])
  const textureRef = useRef<THREE.Texture | null>(null)
  const loadRevision = useRef(0)
  const customSkinApplied = useRef(false)
  const skinName = useInterfaceStore((state) => state.skinUsername)
  const requestId = useInterfaceStore((state) => state.skinRequestId)
  const setSkinResult = useInterfaceStore((state) => state.setSkinResult)

  useEffect(() => {
    avatar.skin.modelType = 'default'
    avatar.skin.setInnerLayerVisible(true)
    avatar.skin.setOuterLayerVisible(true)
    avatar.cape.visible = false
    avatar.elytra.visible = false
    avatar.rotation.y = 2.4

    // Lower the hip pivots, bend both legs forward, and rest the torso on the floor.
    avatar.skin.leftLeg.position.y = -9.75
    avatar.skin.rightLeg.position.y = -9.75
    avatar.skin.leftLeg.rotation.x = -Math.PI / 2
    avatar.skin.rightLeg.rotation.x = -Math.PI / 2
    avatar.skin.leftArm.rotation.x = -0.66
    avatar.skin.rightArm.rotation.x = -0.66
    avatar.skin.leftArm.rotation.z = -0.08
    avatar.skin.rightArm.rotation.z = 0.08

    avatar.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true
        object.receiveShadow = true
      }
    })

    let cancelled = false
    const loader = new THREE.TextureLoader()
    loader.load(
      `${import.meta.env.BASE_URL}skins/steve.png`,
      (sourceTexture) => {
        if (cancelled || customSkinApplied.current) {
          sourceTexture.dispose()
          return
        }

        try {
          const { texture: steveTexture } = normalizeSkin(sourceTexture.image as HTMLImageElement)
          avatar.skin.modelType = 'default'
          avatar.skin.setInnerLayerVisible(true)
          avatar.skin.setOuterLayerVisible(true)
          // skinview3d ships Three 0.156 declarations while this scene uses 0.187.
          avatar.skin.map = steveTexture as never
          textureRef.current?.dispose()
          textureRef.current = steveTexture
        } catch {
          setSkinResult('error', 'No se pudo leer la skin local de Steve.')
        } finally {
          sourceTexture.dispose()
        }
      },
      undefined,
      () => {
        if (!cancelled && !customSkinApplied.current) {
          setSkinResult('error', 'No se pudo cargar la skin local de Steve.')
        }
      },
    )

    return () => {
      cancelled = true
      textureRef.current?.dispose()
      textureRef.current = null
      disposePlayer(avatar)
    }
  }, [avatar, setSkinResult])

  useEffect(() => {
    if (!requestId) return
    let cancelled = false

    if (!/^[A-Za-z0-9_]{3,16}$/.test(skinName)) {
      setSkinResult('error', 'Usa un nombre de Minecraft válido (3–16 letras, números o guion bajo).')
      return
    }

    const revision = ++loadRevision.current
    const loader = new THREE.TextureLoader()
    loader.setCrossOrigin('anonymous')
    loader.load(
      `https://mc-heads.net/skin/${encodeURIComponent(skinName)}.png`,
      (sourceTexture) => {
        if (cancelled || revision !== loadRevision.current) {
          sourceTexture.dispose()
          return
        }

        try {
          const { texture: skinTexture, normalizedSkin } = normalizeSkin(sourceTexture.image as HTMLImageElement)
          avatar.skin.modelType = inferModelType(normalizedSkin)
          avatar.skin.setInnerLayerVisible(true)
          avatar.skin.setOuterLayerVisible(true)
          avatar.skin.map = skinTexture as never
          customSkinApplied.current = true
          textureRef.current?.dispose()
          textureRef.current = skinTexture
          setSkinResult('ready', `Skin de ${skinName} cargada.`)
        } catch {
          setSkinResult('error', `No se pudo interpretar la skin de ${skinName}. Se conserva la anterior.`)
        } finally {
          sourceTexture.dispose()
        }
      },
      undefined,
      () => {
        if (!cancelled && revision === loadRevision.current) {
          setSkinResult('error', `No se encontró la skin de ${skinName}. Se conserva la anterior.`)
        }
      },
    )

    return () => {
      cancelled = true
    }
  }, [avatar, requestId, setSkinResult, skinName])

  useFrame(({ clock }) => {
    const time = clock.elapsedTime
    avatar.rotation.y = 2.4 + Math.sin(time * 0.22) * 0.012
    avatar.skin.body.rotation.x = -0.025 + Math.sin(time * 0.58) * 0.006
    avatar.skin.head.rotation.x = Math.sin(time * 0.42) * 0.012
    avatar.skin.head.rotation.y = -0.22 + Math.sin(time * 0.18) * 0.025
    avatar.skin.leftArm.rotation.x = -0.66 + Math.sin(time * 0.48) * 0.012
    avatar.skin.rightArm.rotation.x = -0.66 + Math.sin(time * 0.48 + 0.2) * 0.012
    avatar.skin.leftLeg.rotation.x = -Math.PI / 2 + Math.sin(time * 0.28) * 0.008
    avatar.skin.rightLeg.rotation.x = -Math.PI / 2 + Math.sin(time * 0.28 + 0.12) * 0.008
  })

  return (
    <primitive
      object={avatar}
      position={[-1.38, 0.112, 1.14]}
      scale={0.038}
      dispose={null}
    />
  )
}
