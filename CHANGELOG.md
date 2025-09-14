# Changelog

## 0.3.0

### Minor Changes

- 43c6520: Renamed package from `xeva` to `xreva` for NPM availability

  This release includes a package rename to avoid naming conflicts on NPM. The original `xeva` name was already taken, so the package has been renamed to `xreva`.

  ### Breaking Changes
  - Package renamed from `xeva` to `xreva`
  - All imports must be updated: `import { ... } from 'xreva'`
  - Component names updated:
    - `XevaPanel` → `XrevaPanel`
    - `XevaPanelXR` → `XrevaPanelXR`
    - `useXevaStore` → `useXrevaStore`

  ### Improvements
  - Fixed all TypeScript errors
  - Improved build configuration
  - Added comprehensive NPM publishing documentation
  - Added GitHub Pages documentation site
  - Fixed XR hook type issues

  ### Migration Guide

  Update your imports:

  ```diff
  - import { useControls, XevaPanel } from 'xeva'
  + import { useControls, XrevaPanel } from 'xreva'
  ```

  Update your components:

  ```diff
  - <XevaPanel />
  + <XrevaPanel />
  ```

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.1] - 2025-09-14

### Changed

- **BREAKING**: Renamed package from `xeva` to `xreva` for NPM availability
- Updated all component names to use `Xreva` prefix:
  - `XevaPanel` → `XrevaPanel`
  - `XevaPanelXR` → `XrevaPanelXR`
  - `useXevaStore` → `useXrevaStore`
- Updated all documentation and examples to reflect new naming
- Changed GitHub repository references to `michaltakac/xreva`

### Fixed

- Fixed all TypeScript errors across the codebase
- Fixed unused import warnings
- Fixed RefObject type issues in XR hooks
- Fixed uikit property compatibility issues in widgets
- Fixed controller/hands property access in XR hooks
- Corrected build output file names (`.mjs` and `.cjs`)

### Added

- Added comprehensive NPM publishing documentation
- Added pre-publish check script for release validation
- Added GitHub Pages documentation site
- Added `.npmignore` for optimized package distribution
- Added support for automated releases via GitHub Actions

### Development

- Updated CI/CD workflows for proper monorepo structure
- Added test coverage reporting to CI pipeline
- Improved build scripts for examples
- Added development scripts for XR example

## [0.2.0] - 2025-09-10

### Added

- Double-sided panel support with background planes for visibility from all angles
- Border frame for better visual definition of panels
- Kitchen sink example with comprehensive control demonstrations
- Support for emissive materials and intensity controls
- Opacity and transparency controls for materials
- Animation system with auto-rotate and bounce effects
- Transform controls for position, rotation, and scale
- Fog system with customizable color and distance
- Multiple light sources for better scene illumination
- Grid display with adjustable size
- Contact shadows for grounded objects
- Panel position toggle (left/right) in examples

### Changed

- Improved default panel dimensions (2x2.5 units instead of 440x600 pixels)
- Updated pixelSize to 0.01 for better text rendering at world scale
- Enhanced panel materials with metalness and roughness properties
- Better example structure with separated Scene and DemoBox components

### Fixed

- Fixed module resolution for 'zustand/vanilla' in Bun test environment
- Resolved undefined Vector3 values with proper fallbacks
- Fixed environment preset loading errors by removing dependency
- Corrected path construction in parseSchema for proper control registration
- Fixed circular dependency issues in examples
- Resolved Vite compatibility with Node.js 20.10

### Development

- Added Vite 5.0.0 support for better developer experience
- Implemented hot module replacement (HMR) in examples
- Added proper module aliasing for development
- Created bundled distribution for standalone usage

## [0.1.0] - 2025-09-10

### Added

- Initial release of XREVA
- `useXRControls` hook with Leva-compatible API
- `XRPanel` component for world-anchored control panels
- `XRHUDPanel` component for camera-locked HUD panels
- `XRControlsProvider` for theming and custom stores
- Built-in control types: number, boolean, string, color, select, vector3, button
- Folder support for organizing controls
- Plugin API for custom control types
- Full TypeScript support with inferred types
- XR support via @react-three/xr integration
- Shadcn-based theming via @react-three/uikit-default
- Comprehensive test suite
- Examples for basic R3F and XR usage
- CI/CD with GitHub Actions and Changesets
