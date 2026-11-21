import { Bloom, EffectComposer } from '@react-three/postprocessing'

export default function PostProcessing() {
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom luminanceThreshold={1.05} luminanceSmoothing={0.22} intensity={0.38} mipmapBlur />
    </EffectComposer>
  )
}
