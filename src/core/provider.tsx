// Provider component with theme support
// UIKit theming: https://pmndrs.github.io/uikit/docs/

import React, { createContext, useContext } from 'react'
// import { setPreferredColorScheme } from '@react-three/uikit-default'
import { createXRControlsStore, type XRControlsStore } from './store'
import type { XRTheme } from './types'

interface XRControlsContextValue {
  store: XRControlsStore
  theme?: XRTheme
}

const XRControlsContext = createContext<XRControlsContextValue | null>(null)

interface XRControlsProviderProps {
  children: React.ReactNode
  store?: XRControlsStore
  theme?: XRTheme
  colorScheme?: 'light' | 'dark'
}

export function XRControlsProvider({ 
  children, 
  store,
  theme,
  colorScheme = 'dark'
}: XRControlsProviderProps) {
  const controlsStore = React.useMemo(() => store || createXRControlsStore(), [store])
  
  React.useEffect(() => {
    // setPreferredColorScheme(colorScheme)
    // TODO: Re-enable when uikit-default exports this
  }, [colorScheme])
  
  const contextValue = React.useMemo(() => ({
    store: controlsStore,
    theme
  }), [controlsStore, theme])
  
  return (
    <XRControlsContext.Provider value={contextValue}>
      {children}
    </XRControlsContext.Provider>
  )
}

export function useXRControlsContext() {
  const context = useContext(XRControlsContext)
  if (!context) {
    // Return default values if no provider
    return {
      store: createXRControlsStore(),
      theme: undefined
    }
  }
  return context
}