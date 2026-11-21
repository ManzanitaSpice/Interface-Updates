import * as THREE from 'three'
import type { ThreeElements } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { useMemo } from 'react'

const modelPath = `${import.meta.env.BASE_URL}models/television-01.glb?rev=controls-axis-03`

export function CrtTelevision(props: ThreeElements['group']) {
  const { scene } = useGLTF(modelPath)
  const model = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true
        object.receiveShadow = true
      }
    })
    return clone
  }, [scene])

  return (
    <primitive object={model} {...props} dispose={null} />
  )
}

useGLTF.preload(modelPath)
