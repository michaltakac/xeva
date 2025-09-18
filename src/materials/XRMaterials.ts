import { MeshPhysicalMaterial } from 'three'

export class GlassMaterial extends MeshPhysicalMaterial {
  constructor() {
    super({
      transmission: 0.5,
      roughness: 0.3,
      reflectivity: 0.5,
      iridescence: 0.4,
      thickness: 0.05,
      specularIntensity: 1,
      metalness: 0.3,
      ior: 2,
      envMapIntensity: 1,
    })
  }
}

export class MetalMaterial extends MeshPhysicalMaterial {
  constructor() {
    super({
      metalness: 0.9,
      roughness: 0.2,
      reflectivity: 1,
      specularIntensity: 1,
      envMapIntensity: 1.5,
    })
  }
}