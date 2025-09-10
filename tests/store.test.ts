// Store tests - Bun test runner: https://bun.sh/docs/test/writing

import { describe, it, expect, beforeEach } from 'bun:test'
import { createXRControlsStore } from '../src/core/store'
import { Color, Vector3 } from 'three'

describe('XRControlsStore', () => {
  let store: ReturnType<typeof createXRControlsStore>
  
  beforeEach(() => {
    store = createXRControlsStore()
  })
  
  describe('registerSchema', () => {
    it('should register a simple schema', () => {
      const schema = {
        speed: 1,
        enabled: true,
        name: 'test'
      }
      
      store.getState().registerSchema('test', schema)
      
      const controls = store.getState().getAllControls()
      expect(controls).toHaveLength(3)
      expect(controls[0].key).toBe('speed')
      expect(controls[0].type).toBe('number')
      expect(controls[0].value).toBe(1)
    })
    
    it('should handle config objects', () => {
      const schema = {
        speed: { value: 5, min: 0, max: 10, step: 0.5 }
      }
      
      store.getState().registerSchema('test', schema)
      
      const control = store.getState().getControl('test.speed')
      expect(control).toBeDefined()
      expect(control?.config.min).toBe(0)
      expect(control?.config.max).toBe(10)
      expect(control?.config.step).toBe(0.5)
    })
    
    it('should detect control types correctly', () => {
      const schema = {
        number: 42,
        boolean: true,
        string: 'hello',
        color: '#ff0000',
        vector3: new Vector3(1, 2, 3),
        select: { value: 'a', options: ['a', 'b', 'c'] }
      }
      
      store.getState().registerSchema('test', schema)
      const controls = store.getState().getAllControls()
      
      expect(controls.find(c => c.key === 'number')?.type).toBe('number')
      expect(controls.find(c => c.key === 'boolean')?.type).toBe('boolean')
      expect(controls.find(c => c.key === 'string')?.type).toBe('string')
      expect(controls.find(c => c.key === 'color')?.type).toBe('color')
      expect(controls.find(c => c.key === 'vector3')?.type).toBe('vector3')
      expect(controls.find(c => c.key === 'select')?.type).toBe('select')
    })
    
    it('should handle nested folders', () => {
      const schema = {
        root: 1,
        folder1: {
          folder: {
            nested: 2,
            folder2: {
              folder: {
                deep: 3
              }
            }
          }
        }
      }
      
      store.getState().registerSchema('test', schema)
      const controls = store.getState().getAllControls()
      
      const rootControl = controls.find(c => c.key === 'root')
      const nestedControl = controls.find(c => c.key === 'nested')
      const deepControl = controls.find(c => c.key === 'deep')
      
      expect(rootControl?.path).toEqual(['test', 'root'])
      expect(nestedControl?.path).toEqual(['test', 'folder1', 'nested'])
      expect(deepControl?.path).toEqual(['test', 'folder1', 'folder2', 'deep'])
    })
  })
  
  describe('getValue/setValue', () => {
    beforeEach(() => {
      store.getState().registerSchema('test', {
        value: 10,
        enabled: false
      })
    })
    
    it('should get values', () => {
      expect(store.getState().getValue('test.value')).toBe(10)
      expect(store.getState().getValue('test.enabled')).toBe(false)
    })
    
    it('should set values', () => {
      store.getState().setValue('test.value', 20)
      expect(store.getState().getValue('test.value')).toBe(20)
      
      store.getState().setValue('test.enabled', true)
      expect(store.getState().getValue('test.enabled')).toBe(true)
    })
    
    it('should call onChange when value changes', () => {
      let called = false
      let receivedValue: any
      
      store.getState().registerSchema('onChange', {
        test: {
          value: 0,
          onChange: (v) => {
            called = true
            receivedValue = v
          }
        }
      })
      
      store.getState().setValue('onChange.test', 42)
      
      expect(called).toBe(true)
      expect(receivedValue).toBe(42)
    })
  })
  
  describe('subscribe', () => {
    it('should notify subscribers on value change', () => {
      store.getState().registerSchema('test', { value: 0 })
      
      let notified = false
      let receivedValue: any
      
      const unsubscribe = store.getState().subscribe('test.value', (v) => {
        notified = true
        receivedValue = v
      })
      
      store.getState().setValue('test.value', 100)
      
      expect(notified).toBe(true)
      expect(receivedValue).toBe(100)
      
      // Test unsubscribe
      notified = false
      unsubscribe()
      store.getState().setValue('test.value', 200)
      expect(notified).toBe(false)
    })
    
    it('should handle multiple subscribers', () => {
      store.getState().registerSchema('test', { value: 0 })
      
      const calls: number[] = []
      
      store.getState().subscribe('test.value', (v) => calls.push(v))
      store.getState().subscribe('test.value', (v) => calls.push(v * 2))
      
      store.getState().setValue('test.value', 5)
      
      expect(calls).toEqual([5, 10])
    })
  })
  
  describe('unregisterSchema', () => {
    it('should remove schema and its controls', () => {
      store.getState().registerSchema('test1', { a: 1, b: 2 })
      store.getState().registerSchema('test2', { c: 3, d: 4 })
      
      expect(store.getState().getAllControls()).toHaveLength(4)
      
      store.getState().unregisterSchema('test1')
      
      const controls = store.getState().getAllControls()
      expect(controls).toHaveLength(2)
      expect(controls[0].key).toBe('c')
      expect(controls[1].key).toBe('d')
    })
  })
  
  describe('reset', () => {
    it('should clear all state', () => {
      store.getState().registerSchema('test', { value: 1 })
      store.getState().setValue('test.value', 10)
      
      expect(store.getState().getAllControls()).toHaveLength(1)
      expect(store.getState().getValue('test.value')).toBe(10)
      
      store.getState().reset()
      
      expect(store.getState().getAllControls()).toHaveLength(0)
      expect(store.getState().getValue('test.value')).toBeUndefined()
    })
  })
})