// UIKit button with R3F events: https://r3f.docs.pmnd.rs/api/events

import { Container, Text } from '@react-three/uikit'
import type { ParsedControl } from '../core/types'

interface ButtonProps {
  control: ParsedControl
  value: (() => void) | undefined
  onChange: (value: any) => void
}

export function Button({ control, value }: ButtonProps) {
  const { label } = control.config
  
  const handleClick = () => {
    if (typeof value === 'function') {
      value()
    }
  }
  
  return (
    <Container
      padding={8}
      width="100%"
    >
      <Container
        padding={12}
        backgroundColor="#0ea5e9"
        borderRadius={4}
        onClick={handleClick}
        cursor="pointer"
        width="100%"
        hover={{
          backgroundColor: '#0284c7'
        }}
        active={{
          backgroundColor: '#0369a1'
        }}
      >
        <Text
          fontSize={12}
          color="white"
          textAlign="center"
          fontWeight="medium"
        >
          {label || control.key}
        </Text>
      </Container>
    </Container>
  )
}