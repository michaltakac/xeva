# React Three Fiber UIKit Demo

A comprehensive 3D control panel demo built with React Three Fiber and @react-three/uikit-default, demonstrating real-time control of 3D objects, materials, animations, and scene properties.

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

### 🎛️ Tabbed Interface
The control panel is organized into 5 intuitive tabs:
1. **Geometry** - Shape, size, segments, and position controls
2. **Material** - Color, metalness, roughness, and other material properties
3. **Animation** - Rotation, float, and pulse effect controls
4. **Particles** - Particle system configuration
5. **Extras** - Secondary objects and scene settings

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

- **React Three Fiber**: React renderer for Three.js
- **@react-three/uikit**: UI system for 3D environments
- **@react-three/uikit-default**: Default UI components
- **@react-three/drei**: Useful helpers for R3F
- **Three.js**: 3D graphics library
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
- State management with React hooks
- Real-time 3D manipulation using @react-three/uikit
- Performance optimization with `useMemo` and `useFrame`
- Material and geometry switching
- Particle systems and animations
- Environment and lighting control
- Camera manipulation

## Files

- `EnhancedUIKitDemo.tsx` - Full-featured demo with tabbed interface
- `UIKitDemo.tsx` - Simpler version with basic controls
- `main.tsx` - Entry point (switch between demos here)

## Key Components

1. **Hero3DObject**: Main interactive 3D object with comprehensive material and animation controls
2. **ParticleSystem**: Dynamic particle effects with wave animations
3. **SecondaryObjects**: Additional floating shapes with individual colors
4. **ControlPanel**: UIKit-based 3D control panel with tabbed interface

This example serves as a complete reference implementation for building 3D UI controls with React Three Fiber and @react-three/uikit.