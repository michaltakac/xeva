// XREVA - Leva-style API for 3D, XR-ready controls in React Three Fiber
// Docs: https://github.com/michaltakac/xreva

// Main hook - Leva-like API
export { useControls, useXrevaStore } from "./core/useControls";
export type {
  ControlValue,
  ControlConfig,
  FolderConfig,
  ControlsSchema,
} from "./core/useControls";

// Main panel components
export { XrevaPanel } from "./components/XrevaPanel";
export { XrevaPanelXR } from "./components/XrevaPanelXR";

// XR hooks
export { useXRGrab } from "./xr/useXRGrab";
export { useHandTracking } from "./xr/useHandTracking";
export { useSpatialAnchor } from "./xr/useSpatialAnchor";
export { useDualHandInteraction } from "./xr/useDualHandInteraction";


// Types
export type {
  ControlType,
  ParsedControl,
  XRTheme,
} from "./core/types";

