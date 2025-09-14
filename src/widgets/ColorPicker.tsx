// UIKit reference: https://pmndrs.github.io/uikit/docs/

import { useState } from "react";
import { Container, Text, Input } from "@react-three/uikit";
import { Color } from "three";
import type { ParsedControl } from "../core/types";

interface ColorPickerProps {
  control: ParsedControl;
  value: string | Color;
  onChange: (value: string) => void;
}

export function ColorPicker({ control, value, onChange }: ColorPickerProps) {
  const { label } = control.config;
  const colorString =
    value instanceof Color ? `#${value.getHexString()}` : value;
  const [inputValue, setInputValue] = useState(colorString);

  return (
    <Container flexDirection="column" gap={4} padding={8} width="100%">
      <Text fontSize={12} color="white">
        {label || control.key}
      </Text>

      <Container flexDirection="row" gap={8} alignItems="center">
        <Container
          width={32}
          height={32}
          backgroundColor={colorString}
          borderRadius={4}
        />

        <Input
          value={inputValue}
          onValueChange={(v: string) => {
            setInputValue(v);
            if (v.match(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)) {
              onChange(v);
            }
          }}
          backgroundColor="#1a1a1a"
          color="white"
          padding={4}
          borderRadius={4}
          fontSize={12}
          width={80}
        />
      </Container>
    </Container>
  );
}
