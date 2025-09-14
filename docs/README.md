# XEVA

> Leva-style API for 3D, XR-ready controls in React Three Fiber apps

[![CI](https://github.com/michaltakac/xeva/actions/workflows/ci.yml/badge.svg)](https://github.com/michaltakac/xeva/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/xeva.svg)](https://badge.fury.io/js/xeva)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Documentation](https://img.shields.io/badge/docs-GitHub%20Pages-blue)](https://michaltakac.github.io/xeva/)

XEVA provides a familiar Leva-like developer experience for creating interactive 3D control panels in React Three Fiber applications, with first-class support for XR (VR/AR) environments.

## Features

- **Leva-compatible API** - If you know Leva, you already know XEVA
- **XR-first design** - Built on @react-three/uikit for perfect XR interoperability
- **3D panels** - World-anchored or HUD panels that work in 3D space
- **Shadcn theming** - Beautiful defaults via @react-three/uikit-default
- **Type-safe** - Full TypeScript support with inferred types
- **Plugin system** - Extend with custom control types
- **Zero magic** - Predictable, minimal dependencies

## Installation

```bash
npm install xeva
# or
bun add xeva
```

### Peer Dependencies

```bash
npm install react react-dom three @react-three/fiber @react-three/xr @react-three/uikit @react-three/uikit-default zustand
```

## Quick Start

```tsx
import { Canvas } from '@react-three/fiber'
import { XRPanel, useXRControls } from 'xeva'

function Scene() {
  const { color, roughness, speed } = useXRControls('Material', {
    color: '#ff6030',
    roughness: { value: 0.5, min: 0, max: 1, step: 0.01 },
    speed: { value: 1, min: 0, max: 5 }
  })
  
  return (
    <mesh>
      <boxGeometry />
      <meshStandardMaterial color={color} roughness={roughness} />
    </mesh>
  )
}

export default function App() {
  return (
    <Canvas>
      <XRPanel position={[0, 1.5, -1]} billboard />
      <Scene />
    </Canvas>
  )
}
```

## XR Example

```tsx
import { Canvas } from '@react-three/fiber'
import { XR, createXRStore } from '@react-three/xr'
import { XRPanel, XRHUDPanel, useXRControls } from 'xeva'

const xrStore = createXRStore()

function XRScene() {
  const controls = useXRControls({
    intensity: { value: 1, min: 0, max: 3 },
    color: '#ffffff'
  })
  
  return (
    <>
      {/* World-anchored panel */}
      <XRPanel position={[-1, 1.5, -2]} billboard />
      
      {/* HUD panel that follows the camera */}
      <XRHUDPanel offset={[0.5, -0.3, -1]} />
      
      <pointLight intensity={controls.intensity} color={controls.color} />
    </>
  )
}

export default function App() {
  return (
    <>
      <button onClick={() => xrStore.enterVR()}>Enter VR</button>
      <Canvas>
        <XR store={xrStore}>
          <XRScene />
        </XR>
      </Canvas>
    </>
  )
}
```

## API Reference

### `useXRControls`

The main hook for creating controls, with a Leva-compatible API:

```tsx
const values = useXRControls(schema)
const values = useXRControls(folderName, schema)
const values = useXRControls(folderName, schema, options)
```

#### Schema Types

```tsx
// Primitives
{ value: 5 }                    // number
{ value: true }                 // boolean  
{ value: "text" }              // string
{ value: "#ff0000" }           // color

// Configured controls
{ 
  value: 5, 
  min: 0, 
  max: 10, 
  step: 0.1 
}

// Select
{ 
  value: 'option1',
  options: ['option1', 'option2'] 
}

// Vectors
{ value: new THREE.Vector3(1, 2, 3) }

// Folders
{
  folder: {
    nested: 1,
    controls: 2
  },
  collapsed: false
}

// Buttons
{ 
  value: () => console.log('clicked') 
}
```

### Panels

#### `<XRPanel>`

World-anchored control panel:

```tsx
<XRPanel
  position={[0, 1.5, -1]}      // Position in world space
  rotation={[0, Math.PI, 0]}   // Rotation
  scale={1}                     // Scale
  billboard={true}              // Face camera
  width={440}                   // Panel width in pixels
  height={600}                  // Panel height in pixels
  pointerEventsOrder={1}        // Event priority
  pixelDensity={72}            // Text clarity
/>
```

#### `<XRHUDPanel>`

Camera-locked HUD panel:

```tsx
<XRHUDPanel
  offset={[0, 0, -2]}          // Offset from camera
  width={300}                  // Panel width
  height={400}                 // Panel height
/>
```

### Provider

#### `<XRControlsProvider>`

Optional provider for theming and custom stores:

```tsx
<XRControlsProvider 
  store={customStore}
  theme={{
    colors: {
      primary: '#0ea5e9',
      background: '#0a0a0a'
    }
  }}
  colorScheme="dark"
>
  <App />
</XRControlsProvider>
```

### Plugin API

Register custom control types:

```tsx
import { registerControl } from 'xeva'

registerControl('custom', {
  type: 'custom',
  parse: (value) => ({ value }),
  component: ({ control, value, onChange }) => (
    <CustomWidget value={value} onChange={onChange} />
  )
})
```

## Control Types

### Built-in Controls

- **number** - Slider with min/max/step
- **boolean** - Toggle switch
- **string** - Text input
- **color** - Color picker
- **select** - Dropdown select
- **vector3** - 3D vector input
- **button** - Clickable button
- **folder** - Nested folder group

## Examples

Run the examples locally:

```bash
# Basic R3F example
cd examples/basic-r3f
bun install
bun dev

# XR example (requires HTTPS)
cd examples/xr
bun install
bun dev
```

## Development

```bash
# Install dependencies
bun install

# Run tests
bun test

# Build library
bun run build

# Type check
bun run typecheck
```

## Architecture

XEVA is built on:
- [@react-three/uikit](https://pmndrs.github.io/uikit/) - WebGL UI components
- [@react-three/uikit-default](https://github.com/pmndrs/uikit) - Shadcn-based theme
- [@react-three/xr](https://pmndrs.github.io/xr/) - XR integration
- [zustand](https://zustand.docs.pmnd.rs/) - State management
- [React Three Fiber](https://r3f.docs.pmnd.rs/) - React renderer for Three.js

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT © Michal Takáč

## Acknowledgments

- Inspired by [Leva](https://github.com/pmndrs/leva) by Poimandres
- Built on the amazing [pmndrs](https://github.com/pmndrs) ecosystem
- XR precedent: [dat.guiVR](https://github.com/dataarts/dat.guiVR)