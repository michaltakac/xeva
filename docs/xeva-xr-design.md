# Xeva XR/VR Design Document

## Overview
Xeva is a 3D-native GUI library for React Three Fiber, modeled after Leva's API but designed for XR/VR environments where UI panels exist in 3D space and are interactable via VR controllers or hand tracking.

## Core API (Leva-Compatible)

### 1. useControls Hook
```typescript
// Basic usage - identical to Leva
const { color, size, enabled } = useControls({
  color: '#ff6030',
  size: { value: 1, min: 0.1, max: 5 },
  enabled: true
})

// With folders - identical to Leva
const controls = useControls('Settings', {
  lighting: folder({
    intensity: 1,
    shadows: true
  }),
  materials: folder({
    metalness: 0.5,
    roughness: 0.5
  })
})

// Function API for external control
const [values, set] = useControls(() => ({
  position: { x: 0, y: 0, z: 0 }
}))
```

### 2. XevaPanel Component (3D UI)
```tsx
<XevaPanel
  // 3D positioning
  position={[2, 1.5, -1]}      // Panel position in world space
  rotation={[0, -0.3, 0]}      // Panel rotation
  scale={1}                     // Panel scale
  
  // XR interactions
  grabbable={true}              // Can be grabbed with controllers
  handInteractable={true}       // Responds to hand tracking
  billboard={true}              // Always faces camera
  snapToGrid={true}             // Snaps to spatial grid when moved
  
  // Visual
  width={400}
  height={600}
  opacity={0.95}
  blurBackground={true}
  
  // Organization
  tabs={true}                   // Use tabs for folders
  title="XR Controls"
/>
```

## XR-Specific Features

### 1. Grabbable Panels
```tsx
interface GrabbableConfig {
  enabled: boolean
  constraints?: {
    minDistance?: number      // Min distance from camera
    maxDistance?: number      // Max distance from camera
    lockRotation?: boolean    // Lock rotation while grabbing
    snapToGrid?: boolean      // Grid snapping
    gridSize?: number         // Grid snap size
  }
  hapticFeedback?: {
    onGrab?: number          // Haptic intensity (0-1)
    onRelease?: number
    onHover?: number
  }
}
```

### 2. Hand Tracking Support
```tsx
interface HandInteractionConfig {
  enabled: boolean
  gestures?: {
    pinch?: boolean          // Pinch to grab
    point?: boolean          // Point to select
    palm?: boolean           // Palm to push away
  }
  visualFeedback?: {
    showRaycast?: boolean    // Show hand raycast
    highlightOnHover?: boolean
    cursorType?: 'ring' | 'dot' | 'custom'
  }
}
```

### 3. Spatial Anchoring
```tsx
// Anchor panel to surfaces
<XevaPanel
  anchor={{
    type: 'wall' | 'floor' | 'ceiling' | 'object',
    target?: THREE.Object3D,  // For object anchoring
    offset?: [x, y, z],
    autoAlign?: boolean        // Auto-align to surface normal
  }}
/>
```

### 4. Multi-Panel Management
```tsx
// Panel groups that move together
<XevaPanelGroup
  layout="horizontal" | "vertical" | "circular"
  spacing={0.5}
  centerPivot={true}
>
  <XevaPanel title="Main" />
  <XevaPanel title="Settings" />
  <XevaPanel title="Debug" />
</XevaPanelGroup>
```

## Control Types (XR-Optimized)

### 1. XR Slider
```tsx
// Large touch targets for VR controllers
<Slider
  value={value}
  min={0}
  max={100}
  touchTargetSize="large"   // Bigger for VR
  showValue={true}           // Always show value
  hapticFeedback={true}      // Haptic on change
/>
```

### 2. XR Toggle
```tsx
// Physical toggle switch
<Toggle
  checked={enabled}
  variant="switch"           // 3D switch appearance
  size="large"               // VR-friendly size
  audioFeedback={true}       // Click sound
/>
```

### 3. Spatial Vector Control
```tsx
// 3D gizmo for vector input
<Vector3Control
  value={{ x: 0, y: 0, z: 0 }}
  mode="gizmo"               // 3D manipulation gizmo
  space="world" | "local"
  showGrid={true}
/>
```

### 4. Color Sphere
```tsx
// 3D color picker
<ColorSphere
  value={color}
  size={0.2}                 // Physical size
  showPresets={true}         // Preset color orbs
/>
```

## Implementation Architecture

### 1. Core Hooks
```typescript
// Main control hook (Leva-compatible)
useControls(schema)

// XR-specific hooks
useXRInteraction(ref)        // Handle controller/hand interactions
useXRGrab(ref, options)      // Grabbable behavior
useXRPointer(ref)            // Pointing/raycast interaction
useSpatialAnchor(type)       // Anchor to surfaces
```

### 2. Store Architecture
```typescript
// Zustand store with XR state
interface XevaStore {
  // Control values (Leva-compatible)
  controls: Map<string, Control>
  values: Record<string, any>
  
  // XR-specific state
  panels: Map<string, PanelState>
  activePanel: string | null
  grabbedPanel: string | null
  
  // XR methods
  grabPanel: (id: string) => void
  releasePanel: (id: string) => void
  movePanel: (id: string, position: Vector3) => void
  anchorPanel: (id: string, anchor: AnchorConfig) => void
}
```

### 3. Component Structure
```
src/
  core/
    useControls.ts          # Leva-compatible hook
    store.ts                # Zustand store
    types.ts                # TypeScript types
    
  xr/
    useXRInteraction.ts     # XR interaction hook
    useXRGrab.ts           # Grab behavior
    useHandTracking.ts      # Hand tracking
    useSpatialAnchor.ts     # Spatial anchoring
    
  components/
    XevaPanel.tsx          # Main 3D panel
    XevaPanelGroup.tsx     # Panel groups
    
  controls/
    Slider.tsx             # XR-optimized slider
    Toggle.tsx             # XR-optimized toggle
    Vector3Control.tsx     # 3D vector input
    ColorSphere.tsx        # 3D color picker
```

## Usage Examples

### Basic R3F Scene
```tsx
function Scene() {
  const { color, size, metalness } = useControls({
    color: '#ff6030',
    size: { value: 1, min: 0.1, max: 5 },
    metalness: { value: 0.5, min: 0, max: 1 }
  })
  
  return (
    <>
      <mesh>
        <boxGeometry args={[size, size, size]} />
        <meshStandardMaterial color={color} metalness={metalness} />
      </mesh>
      
      <XevaPanel
        position={[2, 1.5, 0]}
        grabbable
        handInteractable
      />
    </>
  )
}
```

### XR Session
```tsx
function XRScene() {
  return (
    <XR>
      <Controllers />
      <Hands />
      
      <Scene />
      
      {/* Panel anchored to left controller */}
      <XevaPanel
        anchor={{
          type: 'controller',
          hand: 'left',
          offset: [0, 0.1, 0]
        }}
        mini={true}
      />
    </XR>
  )
}
```

### Hand Tracking
```tsx
function HandTrackedScene() {
  const { showDebug } = useControls({
    showDebug: false
  })
  
  return (
    <>
      <XevaPanel
        position={[0, 1.5, -2]}
        handInteractable={{
          enabled: true,
          gestures: {
            pinch: true,  // Pinch to grab
            point: true   // Point to select
          },
          visualFeedback: {
            showRaycast: showDebug,
            highlightOnHover: true
          }
        }}
      />
    </>
  )
}
```

## Migration from Leva

1. **API Compatibility**: Core `useControls` API remains identical
2. **Panel Component**: Replace `<Leva />` with `<XevaPanel />` in 3D space
3. **New Features**: Add XR-specific props for grabbable, hand tracking, etc.
4. **Store Access**: Same store pattern with additional XR state

## Performance Considerations

1. **Render Optimization**: Use `ref.current.setStyle` pattern from uikit
2. **LOD System**: Reduce panel detail at distance
3. **Culling**: Hide panels outside FOV
4. **Instancing**: Instance common controls
5. **Haptic Throttling**: Limit haptic feedback frequency

## Future Enhancements

1. **Voice Control**: "Set color to red"
2. **Gesture Macros**: Custom hand gestures
3. **Collaborative Panels**: Shared panels in multiplayer
4. **AR Mode**: Panels that anchor to real surfaces
5. **Widget Library**: Pre-built XR control widgets