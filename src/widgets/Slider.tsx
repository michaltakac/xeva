// Based on: https://pmndrs.github.io/uikit/docs/
// R3F pointer events: https://r3f.docs.pmnd.rs/api/events

import { useState, useRef, useCallback } from 'react'
import { Container, Text } from '@react-three/uikit'
import type { ParsedControl } from '../core/types'

interface SliderProps {
  control: ParsedControl
  value: number
  onChange: (value: number) => void
}

export function Slider({ control, value, onChange }: SliderProps) {
  const { min = 0, max = 100, step = 1, label } = control.config
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<any>(null)
  // const { size } = useThree()
  
  const percentage = ((value - min) / (max - min)) * 100
  
  const handlePointerDown = useCallback((e: any) => {
    e.stopPropagation()
    setIsDragging(true)
  }, [])
  
  const handlePointerMove = useCallback((e: any) => {
    if (!isDragging || !containerRef.current) return
    
    const bounds = containerRef.current.getBounds?.()
    if (!bounds) return
    
    const localX = e.point.x - bounds.left
    const width = bounds.right - bounds.left
    const percent = Math.max(0, Math.min(1, localX / width))
    const newValue = min + (max - min) * percent
    const steppedValue = Math.round(newValue / step) * step
    
    onChange(Math.max(min, Math.min(max, steppedValue)))
  }, [isDragging, min, max, step, onChange])
  
  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
  }, [])
  
  return (
    <Container
      flexDirection="column"
      gap={4}
      padding={8}
      width="100%"
    >
      <Container flexDirection="row" justifyContent="space-between" width="100%">
        <Text fontSize={12} color="white">
          {label || control.key}
        </Text>
        <Text fontSize={12} color="white">
          {value.toFixed(step < 1 ? Math.abs(Math.floor(Math.log10(step))) : 0)}
        </Text>
      </Container>
      
      <Container
        ref={containerRef}
        width="100%"
        height={20}
        backgroundColor="#333333"
        borderRadius={10}
        overflow="hidden"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        cursor="pointer"
      >
        <Container
          width={`${percentage}%`}
          height="100%"
          backgroundColor="#0ea5e9"
          borderRadius={10}
          pointerEvents="none"
        />
      </Container>
    </Container>
  )
}