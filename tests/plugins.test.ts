// Plugin system tests

import { describe, it, expect, beforeEach } from 'bun:test'
import { registerControl, getControlImpl, getAllControlImpls } from '../src/core/plugins'
import type { ControlImpl } from '../src/core/types'

describe('Plugin System', () => {
  let originalRegistry: Map<string, any>
  
  // Save and restore registry
  beforeEach(() => {
    originalRegistry = new Map(getAllControlImpls())
    // Clear for testing
    const impls = getAllControlImpls()
    impls.forEach((_, key) => {
      // We can't actually clear the internal registry directly
      // So tests will need to account for default controls
    })
  })
  
  describe('registerControl', () => {
    it('should register a custom control', () => {
      const customControl: ControlImpl = {
        type: 'custom' as any,
        parse: (value) => ({ value }),
        component: (() => null) as any
      }
      
      registerControl('custom', customControl)
      
      const impl = getControlImpl('custom' as any)
      expect(impl).toBe(customControl)
    })
    
    it('should override existing control', () => {
      const control1: ControlImpl = {
        type: 'test' as any,
        parse: (value) => ({ value: 1 }),
        component: (() => null) as any
      }
      
      const control2: ControlImpl = {
        type: 'test' as any,
        parse: (value) => ({ value: 2 }),
        component: (() => null) as any
      }
      
      registerControl('test', control1)
      expect(getControlImpl('test' as any)?.parse(0).value).toBe(1)
      
      registerControl('test', control2)
      expect(getControlImpl('test' as any)?.parse(0).value).toBe(2)
    })
  })
  
  describe('getControlImpl', () => {
    it('should return undefined for unregistered control', () => {
      expect(getControlImpl('nonexistent' as any)).toBeUndefined()
    })
    
    it('should return registered control', () => {
      const control: ControlImpl = {
        type: 'registered' as any,
        parse: (value) => ({ value }),
        component: (() => null) as any
      }
      
      registerControl('registered', control)
      expect(getControlImpl('registered' as any)).toBe(control)
    })
  })
  
  describe('getAllControlImpls', () => {
    it('should return all registered controls', () => {
      const beforeSize = getAllControlImpls().size
      
      const control1: ControlImpl = {
        type: 'type1' as any,
        parse: (value) => ({ value }),
        component: (() => null) as any
      }
      
      const control2: ControlImpl = {
        type: 'type2' as any,
        parse: (value) => ({ value }),
        component: (() => null) as any
      }
      
      registerControl('type1', control1)
      registerControl('type2', control2)
      
      const all = getAllControlImpls()
      expect(all.size).toBe(beforeSize + 2)
      expect(all.get('type1')).toBe(control1)
      expect(all.get('type2')).toBe(control2)
    })
    
    it('should return a copy of the registry', () => {
      const control: ControlImpl = {
        type: 'test' as any,
        parse: (value) => ({ value }),
        component: (() => null) as any
      }
      
      registerControl('test', control)
      
      const all = getAllControlImpls()
      all.clear()
      
      // Original registry should still have the control
      expect(getControlImpl('test' as any)).toBe(control)
    })
  })
})