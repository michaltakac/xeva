# XREVA Installation & Setup

## Quick Start

The XREVA library has been fully implemented with the following features:

### Core Components
✅ `useXRControls` hook with Leva-compatible API
✅ `XRPanel` for world-anchored 3D control panels  
✅ `XRHUDPanel` for camera-locked HUD panels
✅ `XRControlsProvider` for theming and custom stores
✅ Plugin API for custom control types
✅ Full TypeScript support

### Built-in Controls
- Number (slider)
- Boolean (toggle)
- String (text input)  
- Color picker
- Select dropdown
- Vector3 input
- Button
- Folder groups

### Examples Created
- `examples/basic-r3f/` - Basic React Three Fiber example
- `examples/xr/` - Full XR (VR/AR) example

## Installation

```bash
# Install dependencies
bun install

# If you encounter issues, try:
rm -rf node_modules bun.lock
bun install
bun add react react-dom three @react-three/fiber @react-three/xr @react-three/uikit @react-three/uikit-default zustand
```

## Running Examples

### Basic R3F Example
```bash
cd examples/basic-r3f
bun install
bun dev
# Open http://localhost:3000
```

### XR Example
```bash
cd examples/xr
bun install
bun dev
# Open https://localhost:3001 (HTTPS required for WebXR)
```

## Building the Library

```bash
# Build ESM and CJS bundles
bun run build:bundle

# Generate TypeScript declarations
bun run build:types

# Full build
bun run build
```

## Project Structure

```
xreva/
├── src/
│   ├── core/           # Store, hooks, plugin system
│   │   ├── store.ts    # Zustand-based state management
│   │   ├── hooks.ts    # useXRControls hook
│   │   ├── plugins.ts  # Plugin registration
│   │   └── types.ts    # TypeScript definitions
│   ├── widgets/        # UIKit-based control components
│   │   ├── Slider.tsx
│   │   ├── Toggle.tsx
│   │   ├── ColorPicker.tsx
│   │   └── ...
│   ├── panels/         # 3D panel components
│   │   ├── XRPanel.tsx
│   │   └── XRHUDPanel.tsx
│   └── index.ts        # Main exports
├── examples/
│   ├── basic-r3f/      # Desktop example
│   └── xr/             # VR/AR example
├── tests/              # Test suite
└── package.json
```

## Known Issues

If you encounter module resolution issues with Bun:
1. Ensure all peer dependencies are installed
2. Try using npm/yarn instead of bun for dependencies
3. Check that TypeScript paths are correctly configured

## Next Steps

1. Publish to npm: `bun run release`
2. Test in real VR/AR devices
3. Add more control types via plugins
4. Create documentation site

## Documentation References

- @react-three/uikit: https://pmndrs.github.io/uikit/docs/
- @react-three/xr: https://pmndrs.github.io/xr/docs/
- React Three Fiber: https://r3f.docs.pmnd.rs/
- Leva (inspiration): https://github.com/pmndrs/leva
- Zustand: https://zustand.docs.pmnd.rs/