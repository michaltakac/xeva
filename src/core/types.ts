// Based on: https://zustand.docs.pmnd.rs/guides/vanilla-store
// References Leva API: https://github.com/pmndrs/leva

import type { Color, Vector2, Vector3 } from 'three'

export type Primitive = number | string | boolean

export interface ControlConfig<T = any> {
  value: T
  min?: number
  max?: number
  step?: number
  options?: Record<string, any> | string[]
  onChange?: (value: T) => void
  label?: string
  disabled?: boolean
  hidden?: boolean
  render?: (get: () => T, set: (value: T) => void) => React.ReactNode
}

export interface FolderConfig {
  folder: ControlsSchema
  order?: number
  collapsed?: boolean
}

export type ControlValue = 
  | Primitive
  | Color
  | Vector2
  | Vector3
  | ControlConfig
  | FolderConfig

export interface ControlsSchema {
  [key: string]: ControlValue
}

export interface ParsedControl {
  id: string
  key: string
  type: ControlType
  value: any
  config: ControlConfig
  path: string[]
}

export type ControlType = 
  | 'number'
  | 'string'
  | 'boolean'
  | 'color'
  | 'vector2'
  | 'vector3'
  | 'select'
  | 'button'
  | 'monitor'
  | 'folder'
  | 'custom'

export interface ControlImpl {
  type: ControlType
  parse: (value: ControlValue) => ControlConfig
  component: React.ComponentType<{
    control: ParsedControl
    value: any
    onChange: (value: any) => void
  }>
}

export interface XRPanelProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number | [number, number, number]
  billboard?: boolean
  width?: number
  height?: number
  pointerEventsOrder?: number
  pixelDensity?: number
  children?: React.ReactNode
}

export interface XRHUDPanelProps extends Omit<XRPanelProps, 'billboard'> {
  offset?: [number, number, number]
}

export interface XRTheme {
  colors?: {
    background?: string
    foreground?: string
    primary?: string
    secondary?: string
    muted?: string
    accent?: string
    destructive?: string
  }
  radii?: {
    sm?: number
    md?: number
    lg?: number
  }
  spacing?: {
    xs?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
}