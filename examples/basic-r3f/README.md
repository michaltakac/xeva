# XEVA 3D UI Kitchen Sink Demo

A comprehensive showcase of XEVA's 3D UI components integrated with React Three Fiber, demonstrating real-time control of 3D objects, materials, animations, and scene properties.

## Features

### 🎨 Hero Object Controls
- **Geometry Switching**: Dynamically change between box, sphere, torus, cone, cylinder, and dodecahedron
- **Material Properties**: Control color, emissive, roughness, metalness, opacity, transparency
- **Advanced Materials**: Physical material properties like clearcoat, reflectivity, environment mapping
- **Transform Controls**: Position, rotation, and scale adjustments
- **Animations**: Auto-rotate, float effects, pulse animations with customizable parameters
- **Action Buttons**: Reset, randomize, and export settings functionality

### ✨ Particle System
- Dynamic particle count (100-2000 particles)
- Adjustable particle size and color
- Spread control for particle distribution
- Wave effects with amplitude control
- Rotation animations

### 🌍 Environment Controls
- **Lighting System**: Directional, ambient, point, and spot lights with full control
- **Environment Presets**: 10+ HDR environment maps (sunset, dawn, night, warehouse, etc.)
- **Atmosphere**: Fog effects with color and distance controls
- **Ground**: Reflective material with real-time reflections
- **Helpers**: Grid, axes, and stats display toggles

### 🎭 Secondary Objects
- Multiple geometric shapes with individual controls
- Arrangement patterns: circle, line, grid
- Float animations with different speeds
- Individual material properties

### 📷 Camera Controls
- Field of view adjustment
- Near/far plane clipping
- Auto-rotation with speed control
- Smooth damping for fluid movement
- Distance constraints

### 🎛️ Panel Settings
- Panel positioning: left, right, or floating
- Scale and opacity controls
- Billboard mode (face camera)
- Real-time updates

## Running the Example

```bash
# Install dependencies
npm install

# Run with Vite (recommended)
npm run dev

# Or run with Bun
npm run dev:bun

# Build for production
npm run build
```

## Technologies Used

- **XEVA**: 3D UI control system
- **React Three Fiber**: React renderer for Three.js
- **Three.js**: 3D graphics library
- **@react-three/drei**: Useful helpers for R3F
- **Zustand**: State management
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server

## Controls

- **Mouse**: Click and drag to rotate the camera
- **Scroll**: Zoom in/out
- **Panel Buttons**: Switch panel position between left, right, and floating
- **Control Panel**: Interact with all the sliders, color pickers, and buttons to modify the scene
- **Info Toggle**: Show/hide the information panel

## Architecture

The example demonstrates:
- Component composition with React Three Fiber
- State management with XEVA's `useXRControls` hook
- Real-time 3D manipulation
- Performance optimization with `useMemo` and `useFrame`
- Material and geometry switching
- Particle systems and animations
- Environment and lighting control
- Camera manipulation

## Key Components

1. **HeroObject**: Main interactive 3D object with comprehensive material and animation controls
2. **ParticleSystem**: Dynamic particle effects with wave animations
3. **SceneEnvironment**: Complete environment setup with lighting, fog, and reflections
4. **SecondaryObjects**: Additional shapes demonstrating arrangement patterns
5. **CameraController**: Camera settings and orbit controls
6. **XRPanel**: XEVA's 3D control panel rendered in the scene

This example serves as a complete reference implementation for integrating XEVA with React Three Fiber applications.