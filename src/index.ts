// XEVA - Leva-style API for 3D, XR-ready controls in React Three Fiber
// Docs: https://github.com/michaltakac/xeva

// Core hooks
export { useXRControls, useXRStore } from './core/hooks'

// Panels
export { XRPanel } from './panels/XRPanel'
export { XRHUDPanel } from './panels/XRHUDPanel'

// Provider
export { XRControlsProvider } from './core/provider'

// Plugin API
export { registerControl } from './core/plugins'

// Store (advanced usage)
export { createXRControlsStore, getGlobalStore } from './core/store'
export type { XRControlsStore } from './core/store'

// Types
export type {
  ControlsSchema,
  ControlValue,
  ControlConfig,
  ControlType,
  ControlImpl,
  ParsedControl,
  FolderConfig,
  XRPanelProps,
  XRHUDPanelProps,
  XRTheme
} from './core/types'

// Auto-register default controls on import
import './core/register'