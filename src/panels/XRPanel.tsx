// XR integration: https://pmndrs.github.io/xr/docs/
// UIKit Root: https://pmndrs.github.io/uikit/docs/

import React, { useEffect, useState } from 'react'
import { Root, Container, Text } from '@react-three/uikit'
import { Defaults } from '@react-three/uikit-default'
import { useFrame, useThree } from '@react-three/fiber'
import type { XRPanelProps } from '../core/types'
import { getGlobalStore } from '../core/store'
import { getControlImpl } from '../core/plugins'
import * as THREE from 'three'

export function XRPanel({
  position = [0, 1.5, -1],
  rotation = [0, 0, 0],
  scale = 1,
  billboard = false,
  width = 2,
  height = 2.5,
  pointerEventsOrder = 1,
  pixelDensity = 256,
  children
}: XRPanelProps) {
  const store = getGlobalStore()
  const { camera } = useThree()
  const [controls, setControls] = useState(store.getState().getAllControls())
  const rootRef = React.useRef<any>(null)
  
  // Subscribe to store changes
  useEffect(() => {
    const updateControls = () => {
      setControls(store.getState().getAllControls())
    }
    
    // Listen for any state change
    const unsubscribe = store.subscribe(updateControls)
    return unsubscribe
  }, [])
  
  // Billboard effect
  useFrame(() => {
    if (billboard && rootRef.current) {
      rootRef.current.lookAt(camera.position)
    }
  })
  
  // Group controls by path depth for rendering
  const rootControls = controls.filter(c => c.path.length === 1 && c.type !== 'folder')
  const folderGroups = new Map<string, typeof controls>()
  
  controls.forEach(control => {
    if (control.type === 'folder') {
      const folderPath = control.path.join('.')
      folderGroups.set(folderPath, [])
    }
  })
  
  controls.forEach(control => {
    if (control.path.length > 1 && control.type !== 'folder') {
      const folderPath = control.path.slice(0, -1).join('.')
      const group = folderGroups.get(folderPath)
      if (group) {
        group.push(control)
      }
    }
  })
  
  const renderControl = (control: typeof controls[0]) => {
    const impl = getControlImpl(control.type)
    if (!impl) return null
    
    const Component = impl.component
    const value = store.getState().getValue(control.path.join('.'))
    
    return (
      <Component
        key={control.id}
        control={control}
        value={value}
        onChange={(newValue) => store.getState().setValue(control.path.join('.'), newValue)}
      />
    )
  }
  
  // Ensure width and height are valid numbers
  const safeWidth = typeof width === 'number' && !isNaN(width) ? width : 2
  const safeHeight = typeof height === 'number' && !isNaN(height) ? height : 3
  
  return (
    <group
      ref={rootRef}
      position={position}
      rotation={rotation}
      scale={scale}
    >
      {/* Background plane for double-sided visibility */}
      <mesh position={[0, 0, -0.005]}>
        <planeGeometry args={[safeWidth + 0.1, safeHeight + 0.1]} />
        <meshStandardMaterial 
          color="#0a0a0a" 
          side={THREE.DoubleSide}
          transparent={true}
          opacity={0.95}
          metalness={0.1}
          roughness={0.8}
        />
      </mesh>
      
      {/* Border frame */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[safeWidth + 0.15, safeHeight + 0.15]} />
        <meshStandardMaterial 
          color="#1a1a1a" 
          side={THREE.DoubleSide}
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>
      
      <Root
        width={safeWidth}
        height={safeHeight}
        pixelSize={0.01}
        pointerEventsOrder={pointerEventsOrder}
        backgroundColor="#0a0a0a"
        borderRadius={8}
        padding={12}
        overflow="scroll"
        depthWrite={false}
        renderOrder={100}
      >
        <Defaults>
          <Container
            flexDirection="column"
            gap={4}
            width="100%"
          >
            {/* Custom children take priority */}
            {children}
            
            {/* Root level controls */}
            {rootControls.map(renderControl)}
            
            {/* Folder groups */}
            {Array.from(folderGroups.entries()).map(([folderPath, folderControls]) => {
              const folder = controls.find(c => c.path.join('.') === folderPath && c.type === 'folder')
              if (!folder) return null
              
              const isCollapsed = folder.config.collapsed ?? false
              const folderName = folder.path[folder.path.length - 1]
              
              return (
                <Container
                  key={folderPath}
                  flexDirection="column"
                  width="100%"
                  marginTop={8}
                  backgroundColor="#141414"
                  borderRadius={6}
                  overflow="hidden"
                >
                  <Container
                    padding={10}
                    backgroundColor="#1a1a1a"
                    cursor="pointer"
                    onClick={() => {
                      // Toggle collapsed state
                      folder.config.collapsed = !folder.config.collapsed
                      setControls([...store.getState().getAllControls()])
                    }}
                    hover={{
                      backgroundColor: '#222222'
                    }}
                  >
                    <Text fontSize={13} color="white" fontWeight="medium">
                      {isCollapsed ? '▶' : '▼'} {folderName}
                    </Text>
                  </Container>
                  
                  {!isCollapsed && (
                    <Container
                      flexDirection="column"
                      gap={2}
                      padding={4}
                    >
                      {folderControls.map(renderControl)}
                    </Container>
                  )}
                </Container>
              )
            })}
          </Container>
        </Defaults>
      </Root>
    </group>
  )
}