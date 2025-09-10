// Based on Leva's useControls: https://github.com/pmndrs/leva
// Using Zustand with React: https://zustand.docs.pmnd.rs/guides/vanilla-store#using-vanilla-store-in-react

import { useEffect, useRef, useMemo, useCallback } from 'react'
import { useStore } from 'zustand'
import { getGlobalStore, type XRControlsStore } from './store'
import type { ControlsSchema } from './types'

type ExtractValues<T extends ControlsSchema> = {
  [K in keyof T]: T[K] extends { value: infer V } 
    ? V 
    : T[K] extends { folder: infer F }
    ? ExtractValues<F extends ControlsSchema ? F : never>
    : T[K]
}

interface UseXRControlsOptions {
  order?: number
  collapsed?: boolean
  store?: XRControlsStore
}

export function useXRControls<T extends ControlsSchema>(
  schemaOrFolder: string | T,
  maybeSchema?: T,
  options: UseXRControlsOptions = {}
): ExtractValues<T> {
  const store = options.store || getGlobalStore()
  const folderName = typeof schemaOrFolder === 'string' ? schemaOrFolder : undefined
  const schema = (typeof schemaOrFolder === 'string' ? maybeSchema : schemaOrFolder) as T
  
  if (!schema) {
    throw new Error('useXRControls: schema is required')
  }
  
  const schemaId = useRef(folderName || generateId())
  const registeredRef = useRef(false)
  
  // Register schema on mount
  useEffect(() => {
    if (!registeredRef.current) {
      const finalSchema = folderName 
        ? { [folderName]: { folder: schema, order: options.order, collapsed: options.collapsed } }
        : schema
      
      store.getState().registerSchema(schemaId.current, finalSchema as ControlsSchema, { order: options.order })
      registeredRef.current = true
    }
    
    return () => {
      if (registeredRef.current) {
        store.getState().unregisterSchema(schemaId.current)
        registeredRef.current = false
      }
    }
  }, [])
  
  // Create proxy for reactive values
  const values = useMemo(() => {
    const proxy = {} as ExtractValues<T>
    const state = store.getState()
    
    function buildProxy(obj: ControlsSchema, path: string[] = []): any {
      const result: any = {}
      
      Object.entries(obj).forEach(([key, value]) => {
        const currentPath = [...path, path.length === 0 ? schemaId.current : key]
        const pathStr = currentPath.join('.')
        
        // Handle folder
        if (typeof value === 'object' && value !== null && 'folder' in value) {
          result[key] = buildProxy(value.folder, currentPath)
        } else {
          // Create getter/setter for value
          Object.defineProperty(result, key, {
            get: () => state.getValue(pathStr),
            set: (newValue) => state.setValue(pathStr, newValue),
            enumerable: true,
            configurable: true
          })
        }
      })
      
      return result
    }
    
    return buildProxy(folderName ? { [folderName]: { folder: schema } } : schema) as ExtractValues<T>
  }, [schema, folderName, store])
  
  // Subscribe to value changes
  useSubscribeToValues(store, schema, schemaId.current, folderName)
  
  return values
}

function useSubscribeToValues(
  store: XRControlsStore,
  schema: ControlsSchema,
  schemaId: string,
  folderName?: string
) {
  // Force re-render on value changes
  const [, forceUpdate] = useReducer((x) => x + 1, 0)
  
  useEffect(() => {
    const unsubscribers: (() => void)[] = []
    
    function subscribeToSchema(obj: ControlsSchema, path: string[] = []) {
      Object.entries(obj).forEach(([key, value]) => {
        const currentPath = [...path, path.length === 0 ? schemaId : key]
        const pathStr = currentPath.join('.')
        
        if (typeof value === 'object' && value !== null && 'folder' in value) {
          subscribeToSchema(value.folder, currentPath)
        } else {
          const unsub = store.getState().subscribe(pathStr, () => {
            forceUpdate()
          })
          unsubscribers.push(unsub)
        }
      })
    }
    
    const finalSchema = folderName 
      ? { [folderName]: { folder: schema } }
      : schema
    
    subscribeToSchema(finalSchema)
    
    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }, [store, schema, schemaId, folderName])
}

function generateId(): string {
  return `xr-controls-${Math.random().toString(36).substr(2, 9)}`
}

// Import useReducer
import { useReducer } from 'react'

// Store hook for advanced usage
export function useXRStore(): XRControlsStore {
  return getGlobalStore()
}