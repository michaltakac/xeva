import { useRef, useEffect, useState, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useXR } from '@react-three/xr'
import * as THREE from 'three'

interface AnchorConfig {
  type: 'wall' | 'floor' | 'ceiling' | 'object' | 'controller' | 'hand' | 'fixed'
  target?: THREE.Object3D | 'left' | 'right' // For object/controller/hand anchoring
  offset?: [number, number, number]
  autoAlign?: boolean // Auto-align to surface normal
  lockRotation?: boolean
  followTarget?: boolean // Continuously follow target
  smoothing?: number // Smoothing factor for following (0-1)
}

interface SpatialAnchorOptions {
  enabled?: boolean
  anchor?: AnchorConfig
  onAnchorUpdate?: (position: THREE.Vector3, rotation: THREE.Quaternion) => void
  debugMode?: boolean
}

export function useSpatialAnchor(
  ref: React.RefObject<THREE.Group | null>,
  options: SpatialAnchorOptions = {}
) {
  const {
    enabled = true,
    anchor,
    onAnchorUpdate,
    debugMode = false
  } = options

  // const store = useXRStore()
  const session = useXR((state) => state.session)
  const controllers = useXR((state) => (state as any).controllers)
  const hands = useXR((state) => (state as any).hands)
  const referenceSpace = useXR((state) => (state as any).referenceSpace)
  
  const [isAnchored, setIsAnchored] = useState(false)
  const [anchorPosition] = useState(new THREE.Vector3())
  const [anchorRotation] = useState(new THREE.Quaternion())
  const [surfaceNormal] = useState(new THREE.Vector3(0, 1, 0))
  
  const raycaster = useRef(new THREE.Raycaster())
  const tempVector = useRef(new THREE.Vector3())
  const tempQuaternion = useRef(new THREE.Quaternion())
  // const tempMatrix = useRef(new THREE.Matrix4())
  const smoothedPosition = useRef(new THREE.Vector3())
  const smoothedRotation = useRef(new THREE.Quaternion())
  const hitTestSource = useRef<XRHitTestSource | null>(null)
  
  const { scene } = useThree()

  // Initialize hit test source for AR plane detection
  useEffect(() => {
    if (!enabled || !session || !referenceSpace || anchor?.type === 'fixed') return
    
    const initHitTestSource = async () => {
      try {
        // Check if hit-test is supported
        if (session.requestHitTestSource) {
          hitTestSource.current = await session.requestHitTestSource({
            space: referenceSpace,
            offsetRay: new XRRay()
          }) as XRHitTestSource
        }
      } catch (error) {
        console.warn('Hit test not supported:', error)
      }
    }
    
    if (anchor?.type === 'floor' || anchor?.type === 'wall' || anchor?.type === 'ceiling') {
      initHitTestSource()
    }
    
    return () => {
      if (hitTestSource.current) {
        hitTestSource.current.cancel()
        hitTestSource.current = null
      }
    }
  }, [enabled, session, referenceSpace, anchor?.type])

  // Detect planes using hit testing
  const detectPlane = useCallback((type: 'floor' | 'wall' | 'ceiling'): { position: THREE.Vector3, normal: THREE.Vector3 } | null => {
    if (!hitTestSource.current || !session) return null
    
    // This is a simplified version - real implementation would use WebXR hit test results
    // For now, we'll use basic plane detection based on type
    switch (type) {
      case 'floor':
        return {
          position: new THREE.Vector3(0, 0, -2),
          normal: new THREE.Vector3(0, 1, 0)
        }
      case 'ceiling':
        return {
          position: new THREE.Vector3(0, 2.5, -2),
          normal: new THREE.Vector3(0, -1, 0)
        }
      case 'wall':
        return {
          position: new THREE.Vector3(0, 1.5, -3),
          normal: new THREE.Vector3(0, 0, 1)
        }
      default:
        return null
    }
  }, [session])

  // Calculate anchor position and rotation
  const calculateAnchor = useCallback(() => {
    if (!anchor || !ref.current) return
    
    const offset = new THREE.Vector3(...(anchor.offset || [0, 0, 0]))
    
    switch (anchor.type) {
      case 'fixed':
        // Fixed position in world space
        anchorPosition.copy(ref.current.position)
        anchorRotation.copy(ref.current.quaternion)
        break
        
      case 'controller':
        // Anchor to controller
        if (typeof anchor.target === 'string') {
          const controller = controllers.get(anchor.target)
          if (controller) {
            controller.grip.getWorldPosition(anchorPosition)
            controller.grip.getWorldQuaternion(anchorRotation)
            anchorPosition.add(offset.applyQuaternion(anchorRotation))
          }
        }
        break
        
      case 'hand':
        // Anchor to hand
        if (typeof anchor.target === 'string') {
          const hand = hands.get(anchor.target)
          if (hand && hand.joints) {
            // Use wrist position
            const wrist = hand.joints[0]
            if (wrist) {
              wrist.getWorldPosition(anchorPosition)
              wrist.getWorldQuaternion(anchorRotation)
              anchorPosition.add(offset.applyQuaternion(anchorRotation))
            }
          }
        }
        break
        
      case 'object':
        // Anchor to another object
        if (anchor.target && anchor.target instanceof THREE.Object3D) {
          anchor.target.getWorldPosition(anchorPosition)
          anchor.target.getWorldQuaternion(anchorRotation)
          anchorPosition.add(offset.applyQuaternion(anchorRotation))
        }
        break
        
      case 'floor':
      case 'wall':
      case 'ceiling':
        // Anchor to detected plane
        const plane = detectPlane(anchor.type)
        if (plane) {
          anchorPosition.copy(plane.position).add(offset)
          surfaceNormal.copy(plane.normal)
          
          if (anchor.autoAlign) {
            // Align to surface normal
            const up = new THREE.Vector3(0, 1, 0)
            tempQuaternion.current.setFromUnitVectors(up, surfaceNormal)
            anchorRotation.copy(tempQuaternion.current)
          }
        }
        break
    }
    
    setIsAnchored(true)
  }, [anchor, controllers, hands, detectPlane])

  // Update anchor position each frame
  useFrame(() => {
    if (!enabled || !anchor || !ref.current) return
    
    calculateAnchor()
    
    if (isAnchored) {
      if (anchor.followTarget) {
        // Smooth following
        const smoothing = anchor.smoothing || 0.1
        
        // Smooth position
        smoothedPosition.current.lerp(anchorPosition, smoothing)
        ref.current.position.copy(smoothedPosition.current)
        
        // Smooth rotation
        if (!anchor.lockRotation) {
          smoothedRotation.current.slerp(anchorRotation, smoothing)
          ref.current.quaternion.copy(smoothedRotation.current)
        }
      } else {
        // Direct positioning
        ref.current.position.copy(anchorPosition)
        if (!anchor.lockRotation) {
          ref.current.quaternion.copy(anchorRotation)
        }
      }
      
      // Callback
      onAnchorUpdate?.(ref.current.position, ref.current.quaternion)
    }
  })

  // Debug visualization
  useEffect(() => {
    if (!debugMode || !ref.current) return
    
    // Create debug helpers
    const axesHelper = new THREE.AxesHelper(0.2)
    const sphereGeometry = new THREE.SphereGeometry(0.05, 8, 8)
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    const anchorMarker = new THREE.Mesh(sphereGeometry, sphereMaterial)
    
    ref.current.add(axesHelper)
    scene.add(anchorMarker)
    
    const updateDebug = () => {
      anchorMarker.position.copy(anchorPosition)
    }
    
    const interval = setInterval(updateDebug, 100)
    
    return () => {
      ref.current?.remove(axesHelper)
      scene.remove(anchorMarker)
      clearInterval(interval)
      axesHelper.dispose()
      sphereGeometry.dispose()
      sphereMaterial.dispose()
    }
  }, [debugMode, scene])

  // Manual anchor adjustment functions
  const setAnchorPosition = useCallback((position: THREE.Vector3) => {
    anchorPosition.copy(position)
    setIsAnchored(true)
  }, [])

  const setAnchorRotation = useCallback((rotation: THREE.Quaternion) => {
    anchorRotation.copy(rotation)
  }, [])

  const resetAnchor = useCallback(() => {
    setIsAnchored(false)
    anchorPosition.set(0, 0, 0)
    anchorRotation.identity()
  }, [])

  const snapToNearestSurface = useCallback(() => {
    if (!ref.current) return
    
    // Cast rays in multiple directions to find nearest surface
    const directions = [
      new THREE.Vector3(0, -1, 0), // Down
      new THREE.Vector3(0, 1, 0),  // Up
      new THREE.Vector3(0, 0, -1), // Forward
      new THREE.Vector3(0, 0, 1),  // Back
      new THREE.Vector3(-1, 0, 0), // Left
      new THREE.Vector3(1, 0, 0),  // Right
    ]
    
    let nearestDistance = Infinity
    let nearestPoint: THREE.Vector3 | null = null
    let nearestNormal: THREE.Vector3 | null = null
    
    ref.current.getWorldPosition(tempVector.current)
    
    directions.forEach(direction => {
      raycaster.current.set(tempVector.current, direction)
      const intersects = raycaster.current.intersectObjects(scene.children, true)
      
      if (intersects.length > 0 && intersects[0].distance < nearestDistance) {
        nearestDistance = intersects[0].distance
        nearestPoint = intersects[0].point.clone()
        nearestNormal = intersects[0].face?.normal.clone() || direction.clone().negate()
      }
    })
    
    if (nearestPoint && nearestNormal) {
      anchorPosition.copy(nearestPoint)
      surfaceNormal.copy(nearestNormal)
      
      if (anchor?.autoAlign) {
        const up = new THREE.Vector3(0, 1, 0)
        tempQuaternion.current.setFromUnitVectors(up, surfaceNormal)
        anchorRotation.copy(tempQuaternion.current)
      }
      
      setIsAnchored(true)
    }
  }, [scene, anchor?.autoAlign])

  return {
    isAnchored,
    anchorPosition,
    anchorRotation,
    surfaceNormal,
    setAnchorPosition,
    setAnchorRotation,
    resetAnchor,
    snapToNearestSurface
  }
}