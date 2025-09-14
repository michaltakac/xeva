// UIKit & Three.js Vector3: https://threejs.org/docs/#api/en/math/Vector3

import { Container, Text, Input } from '@react-three/uikit'
import { Vector3 } from 'three'
import type { ParsedControl } from '../core/types'

interface Vector3InputProps {
  control: ParsedControl
  value: Vector3 | { x: number; y: number; z: number }
  onChange: (value: Vector3) => void
}

export function Vector3Input({ control, value, onChange }: Vector3InputProps) {
  const { label } = control.config
  const vec = value instanceof Vector3 ? value : new Vector3(value.x, value.y, value.z)
  
  const handleChange = (axis: 'x' | 'y' | 'z', newValue: string) => {
    const num = parseFloat(newValue)
    if (!isNaN(num)) {
      const newVec = vec.clone()
      newVec[axis] = num
      onChange(newVec)
    }
  }
  
  return (
    <Container
      flexDirection="column"
      gap={4}
      padding={8}
      width="100%"
    >
      <Text fontSize={12} color="white">
        {label || control.key}
      </Text>
      
      <Container flexDirection="row" gap={4}>
        {(['x', 'y', 'z'] as const).map(axis => (
          <Container key={axis} flexGrow={1} flexDirection="column" gap={2}>
            <Text fontSize={10} color="#999" textAlign="center">
              {axis.toUpperCase()}
            </Text>
            <Input
              value={vec[axis].toFixed(2)}
              onValueChange={(v: string) => handleChange(axis, v)}
              backgroundColor="#1a1a1a"
              color="white"
              padding={4}
              borderRadius={4}
              fontSize={11}
              textAlign="center"
            />
          </Container>
        ))}
      </Container>
    </Container>
  )
}