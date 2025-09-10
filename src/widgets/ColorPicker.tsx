// UIKit reference: https://pmndrs.github.io/uikit/docs/

import React, { useState } from 'react'
import { Container, Text, Input } from '@react-three/uikit'
import { Color } from 'three'
import type { ParsedControl } from '../core/types'

interface ColorPickerProps {
  control: ParsedControl
  value: string | Color
  onChange: (value: string) => void
}

export function ColorPicker({ control, value, onChange }: ColorPickerProps) {
  const { label } = control.config
  const colorString = value instanceof Color ? `#${value.getHexString()}` : value
  const [inputValue, setInputValue] = useState(colorString)
  
  const handleInputChange = (e: any) => {
    const newValue = e.target.value
    setInputValue(newValue)
    
    // Validate hex color
    if (newValue.match(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)) {
      onChange(newValue)
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
      
      <Container flexDirection="row" gap={8} alignItems="center">
        <Container
          width={32}
          height={32}
          backgroundColor={colorString}
          borderRadius={4}
          border="1px solid #666"
        />
        
        <Input
          value={inputValue}
          onChange={handleInputChange}
          backgroundColor="#1a1a1a"
          color="white"
          padding={4}
          borderRadius={4}
          border="1px solid #333"
          fontSize={12}
          width={80}
        />
      </Container>
    </Container>
  )
}