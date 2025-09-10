// UIKit docs: https://pmndrs.github.io/uikit/docs/

import React, { useState } from 'react'
import { Container, Text } from '@react-three/uikit'
import type { ParsedControl } from '../core/types'

interface SelectProps {
  control: ParsedControl
  value: any
  onChange: (value: any) => void
}

export function Select({ control, value, onChange }: SelectProps) {
  const { label, options = {} } = control.config
  const [isOpen, setIsOpen] = useState(false)
  
  const optionEntries = Array.isArray(options) 
    ? options.map(opt => [opt, opt])
    : Object.entries(options)
  
  const currentLabel = optionEntries.find(([_, val]) => val === value)?.[0] || value
  
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
      
      <Container position="relative">
        <Container
          flexDirection="row"
          justifyContent="space-between"
          alignItems="center"
          padding={8}
          backgroundColor="#1a1a1a"
          borderRadius={4}
          border="1px solid #333"
          onClick={() => setIsOpen(!isOpen)}
          cursor="pointer"
          hover={{
            backgroundColor: '#262626'
          }}
        >
          <Text fontSize={12} color="white">
            {currentLabel}
          </Text>
          <Text fontSize={10} color="#999">
            ▼
          </Text>
        </Container>
        
        {isOpen && (
          <Container
            position="absolute"
            top="100%"
            left={0}
            right={0}
            backgroundColor="#1a1a1a"
            border="1px solid #333"
            borderRadius={4}
            marginTop={2}
            zIndex={1000}
            maxHeight={200}
            overflow="auto"
          >
            {optionEntries.map(([key, val]) => (
              <Container
                key={key}
                padding={8}
                onClick={() => {
                  onChange(val)
                  setIsOpen(false)
                }}
                cursor="pointer"
                hover={{
                  backgroundColor: '#262626'
                }}
              >
                <Text fontSize={12} color={val === value ? '#0ea5e9' : 'white'}>
                  {key}
                </Text>
              </Container>
            ))}
          </Container>
        )}
      </Container>
    </Container>
  )
}