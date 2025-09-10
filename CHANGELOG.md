# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-01-10

### Added

- Initial release of XEVA
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