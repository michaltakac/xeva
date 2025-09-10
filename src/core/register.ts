// Register default control implementations

import { registerControl } from './plugins'
import { 
  Slider, 
  Toggle, 
  ColorPicker, 
  Select, 
  TextInput, 
  Vector3Input,
  Button 
} from '../widgets'
import { Color, Vector3 } from 'three'

export function registerDefaultControls() {
  // Number control (slider)
  registerControl('number', {
    type: 'number',
    parse: (value) => {
      if (typeof value === 'number') {
        return { value }
      }
      if (typeof value === 'object' && 'value' in value) {
        return value as any
      }
      return { value: 0 }
    },
    component: Slider
  })
  
  // Boolean control (toggle)
  registerControl('boolean', {
    type: 'boolean',
    parse: (value) => {
      if (typeof value === 'boolean') {
        return { value }
      }
      if (typeof value === 'object' && 'value' in value) {
        return value as any
      }
      return { value: false }
    },
    component: Toggle
  })
  
  // String control (text input)
  registerControl('string', {
    type: 'string',
    parse: (value) => {
      if (typeof value === 'string') {
        return { value }
      }
      if (typeof value === 'object' && 'value' in value) {
        return value as any
      }
      return { value: '' }
    },
    component: TextInput
  })
  
  // Color control
  registerControl('color', {
    type: 'color',
    parse: (value) => {
      if (typeof value === 'string' || value instanceof Color) {
        return { value }
      }
      if (typeof value === 'object' && 'value' in value) {
        return value as any
      }
      return { value: '#ffffff' }
    },
    component: ColorPicker
  })
  
  // Select control
  registerControl('select', {
    type: 'select',
    parse: (value) => {
      if (typeof value === 'object' && 'value' in value && 'options' in value) {
        return value as any
      }
      return { value: '', options: [] }
    },
    component: Select
  })
  
  // Vector3 control
  registerControl('vector3', {
    type: 'vector3',
    parse: (value) => {
      if (value instanceof Vector3 || (typeof value === 'object' && 'x' in value)) {
        return { value }
      }
      if (typeof value === 'object' && 'value' in value) {
        return value as any
      }
      return { value: new Vector3() }
    },
    component: Vector3Input
  })
  
  // Button control
  registerControl('button', {
    type: 'button',
    parse: (value) => {
      if (typeof value === 'function') {
        return { value }
      }
      if (typeof value === 'object' && 'value' in value) {
        return value as any
      }
      return { value: () => {} }
    },
    component: Button
  })
}

// Auto-register on import
registerDefaultControls()