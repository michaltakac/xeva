// UIKit Input: https://pmndrs.github.io/uikit/docs/

import { useState } from 'react'
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
        onValueChange={(v: string) => {
          setInputValue(v)
          onChange(v)
        }}
        backgroundColor="#1a1a1a"
        color="white"
        padding={8}
        borderRadius={4}
        fontSize={12}
        width="100%"
      />
    </Container>
  )
}