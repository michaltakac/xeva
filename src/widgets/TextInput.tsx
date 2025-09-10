// UIKit Input: https://pmndrs.github.io/uikit/docs/

import React, { useState } from 'react'
import { Container, Text, Input } from '@react-three/uikit'
import type { ParsedControl } from '../core/types'

interface TextInputProps {
  control: ParsedControl
  value: string
  onChange: (value: string) => void
}

export function TextInput({ control, value, onChange }: TextInputProps) {
  const { label } = control.config
  const [inputValue, setInputValue] = useState(value)
  
  const handleChange = (e: any) => {
    const newValue = e.target.value
    setInputValue(newValue)
  }
  
  const handleBlur = () => {
    onChange(inputValue)
  }
  
  const handleKeyDown = (e: any) => {
    if (e.key === 'Enter') {
      onChange(inputValue)
      e.target.blur()
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
      
      <Input
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        backgroundColor="#1a1a1a"
        color="white"
        padding={8}
        borderRadius={4}
        border="1px solid #333"
        fontSize={12}
        width="100%"
        focus={{
          border: '1px solid #0ea5e9'
        }}
      />
    </Container>
  )
}