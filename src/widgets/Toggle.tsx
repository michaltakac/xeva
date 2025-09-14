// UIKit components: https://pmndrs.github.io/uikit/docs/
// R3F events: https://r3f.docs.pmnd.rs/api/events

import { Container, Text } from '@react-three/uikit'
import type { ParsedControl } from '../core/types'

interface ToggleProps {
  control: ParsedControl
  value: boolean
  onChange: (value: boolean) => void
}

export function Toggle({ control, value, onChange }: ToggleProps) {
  const { label } = control.config
  
  const handleClick = () => {
    onChange(!value)
  }
  
  return (
    <Container
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      padding={8}
      width="100%"
      gap={8}
    >
      <Text fontSize={12} color="white">
        {label || control.key}
      </Text>
      
      <Container
        width={44}
        height={24}
        backgroundColor={value ? '#0ea5e9' : '#333333'}
        borderRadius={12}
        padding={2}
        onClick={handleClick}
        cursor="pointer"
        hover={{
          backgroundColor: value ? '#0284c7' : '#404040'
        }}
      >
        <Container
          width={20}
          height={20}
          backgroundColor="white"
          borderRadius={10}
          marginLeft={value ? 20 : 0}
        />
      </Container>
    </Container>
  )
}