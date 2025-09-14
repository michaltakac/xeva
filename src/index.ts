// XEVA - Leva-style API for 3D, XR-ready controls in React Three Fiber
// Docs: https://github.com/michaltakac/xeva

// Main hook - Leva-like API
export { useControls, useXevaStore } from './core/useControls'
export type { ControlValue, ControlConfig, FolderConfig, ControlsSchema } from './core/useControls'

// Main panel components
export { XevaPanel } from './components/XevaPanel'
export { XevaPanelXR } from './components/XevaPanelXR'

// XR hooks
export { useXRGrab } from './xr/useXRGrab'
export { useHandTracking } from './xr/useHandTracking'
export { useSpatialAnchor } from './xr/useSpatialAnchor'
export { useDualHandInteraction } from './xr/useDualHandInteraction'

// Legacy exports (for backwards compatibility)
export { useXRControls, useXRStore } from './core/hooks'
export { XRPanel } from './panels/XRPanel'
export { XRHUDPanel } from './panels/XRHUDPanel'
export { XRControlsProvider } from './core/provider'
export { registerControl } from './core/plugins'
export { createXRControlsStore, getGlobalStore } from './core/store'
export type { XRControlsStore } from './core/store'

// Types
export type {
  ControlType,
  ControlImpl,
  ParsedControl,
  XRPanelProps,
  XRHUDPanelProps,
  XRTheme
} from './core/types'

// Auto-register default controls on import
import './core/register'