import React, { useState } from 'react'
import { Root, Container, Text as UIText } from '@react-three/uikit'
import { Card, Defaults, Slider, Button, Toggle } from '@react-three/uikit-default'
import { useXevaStore } from '../core/useControls'
import { useFrame } from '@react-three/fiber'

interface XevaPanelProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number | [number, number, number]
  width?: number
  height?: number
  backgroundColor?: string
  borderRadius?: number
  padding?: number
  title?: string
  tabs?: boolean
  billboard?: boolean
}

export function XevaPanel({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  width = 400,
  height = 600,
  backgroundColor = '#0a0a0a',
  borderRadius = 16,
  padding = 16,
  title = 'Controls',
  tabs = true,
  billboard = false
}: XevaPanelProps) {
  const controls = useXevaStore(state => state.getAllControls())
  const values = useXevaStore(state => state.values)
  const setValue = useXevaStore(state => state.setValue)
  // const folders = useXevaStore(state => state.folders)
  
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const rootRef = React.useRef<any>(null)
  
  // Billboard effect
  useFrame(({ camera }) => {
    if (billboard && rootRef.current) {
      rootRef.current.lookAt(camera.position)
    }
  })
  
  // Group controls by top-level folders (for tabs)
  const topLevelFolders: string[] = []
  const topLevelControls: typeof controls = []
  
  controls.forEach(control => {
    if (control.path.length === 2 && control.type === 'folder') {
      topLevelFolders.push(control.key)
    } else if (control.path.length === 2 && control.type !== 'folder') {
      topLevelControls.push(control)
    }
  })
  
  // Set initial active tab
  if (tabs && activeTab === null && topLevelFolders.length > 0) {
    setActiveTab(topLevelFolders[0])
  }
  
  // Render a single control
  const renderControl = (control: typeof controls[0]) => {
    const pathStr = control.path.join('.')
    const value = values[pathStr]
    
    switch (control.type) {
      case 'number': {
        const { min = 0, max = 1, step = 0.01, label } = control.config
        return (
          <Container key={pathStr} flexDirection="column" gap={4}>
            <UIText fontSize={12} color="#888">
              {label || control.key}: {typeof value === 'number' ? value.toFixed(2) : value}
            </UIText>
            <Slider
              value={value as number}
              onValueChange={(v: number) => setValue(pathStr, v)}
              min={min}
              max={max}
              step={step}
            />
          </Container>
        )
      }
      
      case 'boolean':
        return (
          <Container key={pathStr} flexDirection="row" alignItems="center" gap={8}>
            <Toggle
              checked={value as boolean}
              onCheckedChange={(checked: boolean) => setValue(pathStr, checked)}
            />
            <UIText fontSize={12} color="white">{control.config.label || control.key}</UIText>
          </Container>
        )
      
      case 'select': {
        const options = control.config.options || []
        return (
          <Container key={pathStr} flexDirection="column" gap={4}>
            <UIText fontSize={12} color="#888">{control.config.label || control.key}</UIText>
            <Container flexDirection="row" gap={4} flexWrap="wrap">
              {options.map(option => (
                <Button
                  key={String(option)}
                  onClick={() => setValue(pathStr, option)}
                  variant={value === option ? 'default' : 'outline'}
                  size="sm"
                >
                  <UIText fontSize={10}>{String(option)}</UIText>
                </Button>
              ))}
            </Container>
          </Container>
        )
      }
      
      case 'color': {
        const presetColors = ['#ff6030', '#4080ff', '#80ff40', '#ff4080', '#ffaa00', '#00ffaa']
        return (
          <Container key={pathStr} flexDirection="column" gap={4}>
            <UIText fontSize={12} color="#888">{control.config.label || control.key}</UIText>
            <Container flexDirection="row" gap={8} flexWrap="wrap">
              {presetColors.map(color => (
                <Container
                  key={color}
                  width={32}
                  height={32}
                  backgroundColor={color}
                  borderRadius={8}
                  cursor="pointer"
                  onClick={() => setValue(pathStr, color)}
                />
              ))}
            </Container>
          </Container>
        )
      }
      
      case 'button':
        return (
          <Button
            key={pathStr}
            onClick={() => {
              const fn = control.config.value
              if (typeof fn === 'function') fn()
            }}
          >
            <UIText>{control.config.label || control.key}</UIText>
          </Button>
        )
      
      case 'vector3': {
        const vec = value as { x: number; y: number; z: number } | undefined
        if (!vec) return null
        
        return (
          <Container key={pathStr} flexDirection="column" gap={4}>
            <UIText fontSize={12} color="#888">{control.config.label || control.key}</UIText>
            {['x', 'y', 'z'].map(axis => (
              <Container key={axis} flexDirection="column" gap={2}>
                <UIText fontSize={10} color="#666">
                  {axis.toUpperCase()}: {vec[axis as keyof typeof vec].toFixed(2)}
                </UIText>
                <Slider
                  value={vec[axis as keyof typeof vec]}
                  onValueChange={(v: number) => setValue(pathStr, { ...vec, [axis]: v })}
                  min={-10}
                  max={10}
                  step={0.1}
                />
              </Container>
            ))}
          </Container>
        )
      }
      
      default:
        return null
    }
  }
  
  // Render controls in a folder
  const renderFolder = (folderPath: string, folderName: string) => {
    const folderControls = controls.filter(c => 
      c.path.length > 2 && 
      c.path.slice(0, -1).join('.') === folderPath &&
      c.type !== 'folder'
    )
    
    if (folderControls.length === 0) return null
    
    return (
      <Card key={folderPath} padding={16} gap={12}>
        <UIText fontSize={16} fontWeight="medium" color="white">
          {folderName}
        </UIText>
        <Container flexDirection="column" gap={8}>
          {folderControls.map(renderControl)}
        </Container>
      </Card>
    )
  }
  
  // Render content based on tabs or no tabs
  const renderContent = () => {
    if (tabs && topLevelFolders.length > 0) {
      return (
        <>
          {/* Tab Navigation */}
          <Container flexDirection="row" gap={4} justifyContent="center">
            {topLevelFolders.map(folder => (
              <Button
                key={folder}
                onClick={() => setActiveTab(folder)}
                variant={activeTab === folder ? 'default' : 'outline'}
                size="sm"
              >
                <UIText fontSize={10}>{folder.toUpperCase()}</UIText>
              </Button>
            ))}
          </Container>
          
          {/* Active Tab Content */}
          {activeTab && renderFolder(
            controls.find(c => c.key === activeTab && c.type === 'folder')?.path.join('.') || '',
            activeTab
          )}
        </>
      )
    } else {
      // No tabs - render all controls
      return (
        <Container flexDirection="column" gap={12}>
          {/* Top level controls */}
          {topLevelControls.map(renderControl)}
          
          {/* Folders */}
          {topLevelFolders.map(folder => {
            const folderControl = controls.find(c => c.key === folder && c.type === 'folder')
            if (!folderControl) return null
            return renderFolder(folderControl.path.join('.'), folder)
          })}
        </Container>
      )
    }
  }
  
  return (
    <group ref={rootRef} position={position} rotation={rotation} scale={scale}>
      <Root
        width={width}
        height={height}
        pixelSize={0.01}
        backgroundColor={backgroundColor}
        borderRadius={borderRadius}
        padding={padding}
        overflow="scroll"
      >
        <Defaults>
          <Container flexDirection="column" gap={16}>
            {/* Title */}
            <UIText fontSize={20} fontWeight="bold" color="white" textAlign="center">
              {title}
            </UIText>
            
            {/* Content */}
            {renderContent()}
          </Container>
        </Defaults>
      </Root>
    </group>
  )
}