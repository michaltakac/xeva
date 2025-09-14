import { useRef, useEffect, useState, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { useXR } from '@react-three/xr'
import * as THREE from 'three'

interface DualHandInteractionOptions {
  enabled?: boolean
  grabHand?: 'left' | 'right' | 'both' // Which hand can grab
  interactHand?: 'left' | 'right' | 'both' // Which hand can interact
  grabButton?: 'trigger' | 'squeeze' | 'both' // Which button to grab with
  interactButton?: 'trigger' | 'squeeze' // Which button to interact with
  grabDistance?: number // Max distance to grab from
  interactDistance?: number // Max distance to interact from
  hapticFeedback?: {
    onGrab?: number
    onRelease?: number
    onInteract?: number
    onHover?: number
  }
  onGrab?: (hand: 'left' | 'right') => void
  onRelease?: (hand: 'left' | 'right') => void
  onInteract?: (hand: 'left' | 'right', target: THREE.Object3D) => void
  onMove?: (position: THREE.Vector3, rotation: THREE.Quaternion) => void
}

export function useDualHandInteraction(
  panelRef: React.RefObject<THREE.Group | null>,
  options: DualHandInteractionOptions = {}
) {
  const {
    enabled = true,
    grabHand = 'left', // Default: left hand grabs
    interactHand = 'right', // Default: right hand interacts
    grabButton = 'squeeze', // Default: grip button to grab
    interactButton = 'trigger', // Default: trigger to interact
    grabDistance = 3,
    interactDistance = 2,
    hapticFeedback = {
      onGrab: 0.3,
      onRelease: 0.1,
      onInteract: 0.2,
      onHover: 0.05
    },
    onGrab,
    onRelease,
    onInteract,
    onMove
  } = options

  // const store = useXRStore()
  const session = useXR((state) => state.session)
  const controllers = useXR((state) => (state as any).controllers || [])
  
  // State
  const [isGrabbed, setIsGrabbed] = useState(false)
  const [grabbedBy, setGrabbedBy] = useState<'left' | 'right' | null>(null)
  const [grabbedController, setGrabbedController] = useState<THREE.XRTargetRaySpace | THREE.XRGripSpace | null>(null)
  const [hoveredControl, setHoveredControl] = useState<THREE.Object3D | null>(null)
  const [isInteracting, setIsInteracting] = useState(false)
  
  // Refs for calculations
  const grabOffset = useRef(new THREE.Matrix4())
  const worldPosition = useRef(new THREE.Vector3())
  const worldQuaternion = useRef(new THREE.Quaternion())
  const tempMatrix = useRef(new THREE.Matrix4())
  const initialScale = useRef(new THREE.Vector3(1, 1, 1))
  const raycaster = useRef(new THREE.Raycaster())
  const tempDirection = useRef(new THREE.Vector3())
  
  // Haptic feedback helper
  const applyHapticFeedback = useCallback((handedness: 'left' | 'right', intensity: number, duration: number = 50) => {
    if (!session) return
    
    const controller = controllers.get(handedness)
    if (!controller?.inputSource?.gamepad?.hapticActuators?.[0]) return
    
    controller.inputSource.gamepad.hapticActuators[0].pulse(intensity, duration)
  }, [session, controllers])
  
  // Check if a hand can perform an action
  const canGrab = (hand: 'left' | 'right') => {
    return grabHand === 'both' || grabHand === hand
  }
  
  const canInteract = (hand: 'left' | 'right') => {
    return interactHand === 'both' || interactHand === hand
  }
  
  // Handle grab events (trigger or squeeze based on settings)
  useEffect(() => {
    if (!enabled || !session || !panelRef.current) return
    
    const handleGrabStart = (event: THREE.Event & { target: THREE.XRTargetRaySpace | THREE.XRGripSpace }) => {
      if (isGrabbed) return
      
      // Determine which hand
      let handedness: 'left' | 'right' | null = null
      controllers.forEach((controller: any, hand: any) => {
        if (controller.controller === event.target || controller.grip === event.target) {
          handedness = hand as 'left' | 'right'
        }
      })
      
      if (!handedness || !canGrab(handedness) || !panelRef.current) return
      
      const controller = controllers.get(handedness)
      if (!controller) return
      
      // Check distance
      const controllerPos = grabButton === 'squeeze' ? controller.grip : controller.controller
      const distance = controllerPos.position.distanceTo(panelRef.current.position)
      
      if (distance <= grabDistance) {
        // Calculate grab offset
        tempMatrix.current.copy(controllerPos.matrixWorld)
        tempMatrix.current.invert()
        tempMatrix.current.multiply(panelRef.current.matrixWorld)
        grabOffset.current.copy(tempMatrix.current)
        
        // Store initial scale
        panelRef.current.getWorldScale(initialScale.current)
        
        setIsGrabbed(true)
        setGrabbedBy(handedness)
        setGrabbedController(controllerPos)
        
        // Haptic feedback
        applyHapticFeedback(handedness, hapticFeedback.onGrab || 0.3)
        
        // Callback
        onGrab?.(handedness)
      }
    }
    
    const handleGrabEnd = (event: THREE.Event & { target: THREE.XRTargetRaySpace | THREE.XRGripSpace }) => {
      if (!isGrabbed) return
      
      // Determine which hand
      let handedness: 'left' | 'right' | null = null
      controllers.forEach((controller: any, hand: any) => {
        if (controller.controller === event.target || controller.grip === event.target) {
          handedness = hand as 'left' | 'right'
        }
      })
      
      if (handedness === grabbedBy) {
        setIsGrabbed(false)
        setGrabbedBy(null)
        setGrabbedController(null)
        
        // Haptic feedback
        if (handedness) applyHapticFeedback(handedness, hapticFeedback.onRelease || 0.1)
        
        // Callback
        if (handedness) onRelease?.(handedness)
      }
    }
    
    // Add listeners based on button settings
    controllers.forEach((controller: any) => {
      if (grabButton === 'trigger' || grabButton === 'both') {
        controller.controller.addEventListener('selectstart', handleGrabStart as any)
        controller.controller.addEventListener('selectend', handleGrabEnd as any)
      }
      if (grabButton === 'squeeze' || grabButton === 'both') {
        controller.grip.addEventListener('squeezestart', handleGrabStart as any)
        controller.grip.addEventListener('squeezeend', handleGrabEnd as any)
      }
    })
    
    return () => {
      controllers.forEach((controller: any) => {
        if (grabButton === 'trigger' || grabButton === 'both') {
          controller.controller.removeEventListener('selectstart', handleGrabStart as any)
          controller.controller.removeEventListener('selectend', handleGrabEnd as any)
        }
        if (grabButton === 'squeeze' || grabButton === 'both') {
          controller.grip.removeEventListener('squeezestart', handleGrabStart as any)
          controller.grip.removeEventListener('squeezeend', handleGrabEnd as any)
        }
      })
    }
  }, [enabled, session, isGrabbed, grabbedBy, controllers, panelRef, canGrab, grabButton, grabDistance, applyHapticFeedback])
  
  // Handle interaction events (for controls within the panel)
  useEffect(() => {
    if (!enabled || !session || !panelRef.current) return
    
    const handleInteractStart = (event: THREE.Event & { target: THREE.XRTargetRaySpace }) => {
      // Determine which hand
      let handedness: 'left' | 'right' | null = null
      controllers.forEach((controller: any, hand: any) => {
        if (controller.controller === event.target) {
          handedness = hand as 'left' | 'right'
        }
      })
      
      if (!handedness || !canInteract(handedness) || !panelRef.current) return
      
      const controller = controllers.get(handedness)
      if (!controller) return
      
      // Raycast to find what control we're pointing at
      tempMatrix.current.identity()
      tempMatrix.current.extractRotation(controller.controller.matrixWorld)
      tempDirection.current.set(0, 0, -1)
      tempDirection.current.applyMatrix4(tempMatrix.current)
      
      raycaster.current.set(controller.controller.position, tempDirection.current)
      const intersects = raycaster.current.intersectObject(panelRef.current, true)
      
      if (intersects.length > 0 && intersects[0].distance <= interactDistance) {
        setIsInteracting(true)
        
        // Haptic feedback
        applyHapticFeedback(handedness, hapticFeedback.onInteract || 0.2)
        
        // Callback with the intersected object
        onInteract?.(handedness, intersects[0].object as any)
      }
    }
    
    const handleInteractEnd = (_event: THREE.Event & { target: THREE.XRTargetRaySpace }) => {
      setIsInteracting(false)
    }
    
    // Add interaction listeners
    controllers.forEach((controller: any) => {
      if (interactButton === 'trigger') {
        controller.controller.addEventListener('selectstart', handleInteractStart as any)
        controller.controller.addEventListener('selectend', handleInteractEnd as any)
      } else if (interactButton === 'squeeze') {
        controller.grip.addEventListener('squeezestart', handleInteractStart as any)
        controller.grip.addEventListener('squeezeend', handleInteractEnd as any)
      }
    })
    
    return () => {
      controllers.forEach((controller: any) => {
        if (interactButton === 'trigger') {
          controller.controller.removeEventListener('selectstart', handleInteractStart as any)
          controller.controller.removeEventListener('selectend', handleInteractEnd as any)
        } else if (interactButton === 'squeeze') {
          controller.grip.removeEventListener('squeezestart', handleInteractStart as any)
          controller.grip.removeEventListener('squeezeend', handleInteractEnd as any)
        }
      })
    }
  }, [enabled, session, panelRef, canInteract, interactButton, interactDistance, applyHapticFeedback])
  
  // Update grabbed panel position
  useFrame(() => {
    if (!isGrabbed || !panelRef.current || !grabbedController) return
    
    // Apply grab offset to controller transform
    tempMatrix.current.copy(grabbedController.matrixWorld)
    tempMatrix.current.multiply(grabOffset.current)
    
    // Extract position and rotation
    tempMatrix.current.decompose(
      worldPosition.current,
      worldQuaternion.current,
      new THREE.Vector3() // scale (ignored)
    )
    
    // Apply transform
    panelRef.current.position.copy(worldPosition.current)
    panelRef.current.quaternion.copy(worldQuaternion.current)
    panelRef.current.scale.copy(initialScale.current)
    
    // Callback
    onMove?.(worldPosition.current, worldQuaternion.current)
  })
  
  // Hover detection for interaction hand
  useFrame(() => {
    if (!enabled || !session || !panelRef.current) return
    
    let newHovered: THREE.Object3D | null = null
    
    controllers.forEach((controller: any, handedness: any) => {
      if (!canInteract(handedness as 'left' | 'right')) return
      
      // Raycast for hover
      tempMatrix.current.identity()
      tempMatrix.current.extractRotation(controller.controller.matrixWorld)
      tempDirection.current.set(0, 0, -1)
      tempDirection.current.applyMatrix4(tempMatrix.current)
      
      raycaster.current.set(controller.controller.position, tempDirection.current)
      const intersects = raycaster.current.intersectObject(panelRef.current!, true)
      
      if (intersects.length > 0 && intersects[0].distance <= interactDistance) {
        newHovered = intersects[0].object as any
        
        if (!hoveredControl && hapticFeedback.onHover) {
          applyHapticFeedback(handedness as 'left' | 'right', hapticFeedback.onHover, 20)
        }
      }
    })
    
    setHoveredControl(newHovered)
  })
  
  // Create visual ray for interaction hand
  const createInteractionRay = useCallback(() => {
    if (!hoveredControl || !interactHand || interactHand === 'both') return null
    
    const controller = controllers.get(interactHand)
    if (!controller) return null
    
    // Create a line from controller to hovered control
    const geometry = new THREE.BufferGeometry()
    const material = new THREE.LineBasicMaterial({ 
      color: isInteracting ? 0x00ff00 : 0xffffff,
      opacity: 0.5,
      transparent: true
    })
    
    const points = [
      controller.controller.position,
      hoveredControl.position
    ]
    
    geometry.setFromPoints(points)
    return new THREE.Line(geometry, material)
  }, [hoveredControl, interactHand, controllers, isInteracting])
  
  return {
    isGrabbed,
    grabbedBy,
    isInteracting,
    hoveredControl,
    // Helper to check if specific hand actions are allowed
    canGrabWith: canGrab,
    canInteractWith: canInteract,
    // Visual helpers
    createInteractionRay,
    // States for UI feedback
    isLeftHandGrabbing: grabbedBy === 'left',
    isRightHandGrabbing: grabbedBy === 'right',
    isLeftHandInteracting: isInteracting && interactHand === 'left',
    isRightHandInteracting: isInteracting && interactHand === 'right'
  }
}