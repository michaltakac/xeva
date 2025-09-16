import React, { useCallback, useMemo } from "react";
import { Root, Container, Text as UIText } from "@react-three/uikit";
import {
  Card,
  Defaults,
  Slider,
  Button,
  Toggle,
} from "@react-three/uikit-default";
import { useFrame } from "@react-three/fiber";
import { usePanelState } from "./usePanelState";
import type { ControlConfig } from "../core/useControls";

interface XrevaPanelProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  width?: number;
  height?: number;
  backgroundColor?: string;
  borderRadius?: number;
  padding?: number;
  title?: string;
  tabs?: boolean;
  billboard?: boolean;
}

export function XrevaPanel({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  width = 400,
  height = 600,
  backgroundColor = "#0a0a0a",
  borderRadius = 16,
  padding = 16,
  title = "Controls",
  tabs = true,
  billboard = false,
}: XrevaPanelProps) {
  const { values, setValue, topLevelControls, folders, activeTab, setActiveTab } =
    usePanelState(tabs);
  const rootRef = React.useRef<any>(null);

  // Billboard effect
  useFrame(({ camera }) => {
    if (billboard && rootRef.current) {
      try {
        if (rootRef.current.lookAt && typeof rootRef.current.lookAt === 'function') {
          rootRef.current.lookAt(camera.position);
        }
      } catch (e) {
        // Silently ignore if lookAt fails
      }
    }
  });

  // Render a single control
  const renderControl = useCallback(
    (control: typeof topLevelControls[number]) => {
      const pathStr = control.path.join(".");
      const value = values[pathStr];
      const config = control.config as ControlConfig;

      switch (control.type) {
        case "number": {
        const { min = 0, max = 1, step = 0.01, label } = config;
        return (
          <Container key={pathStr} flexDirection="column" gap={4}>
            <UIText fontSize={12} color="#888">
              {label || control.key}:{" "}
              {typeof value === "number" ? value.toFixed(2) : value}
            </UIText>
            <Slider
              value={value as number}
              onValueChange={(v: number) => setValue(pathStr, v)}
              min={min}
              max={max}
              step={step}
            />
          </Container>
        );
      }

      case "boolean":
        return (
          <Container
            key={pathStr}
            flexDirection="row"
            alignItems="center"
            gap={8}
          >
            <Toggle
              checked={value as boolean}
              onCheckedChange={(checked: boolean) => setValue(pathStr, checked)}
            />
            <UIText fontSize={12} color="white">
              {config.label || control.key}
            </UIText>
          </Container>
        );

      case "select": {
        const options = Array.isArray(config.options)
          ? config.options
          : [];
        return (
          <Container key={pathStr} flexDirection="column" gap={4}>
            <UIText fontSize={12} color="#888">
              {config.label || control.key}
            </UIText>
            <Container flexDirection="row" gap={4} flexWrap="wrap">
              {options.map((option) => (
                <Button
                  key={String(option)}
                  onClick={() => setValue(pathStr, option)}
                  variant={value === option ? "default" : "outline"}
                  size="sm"
                >
                  <UIText fontSize={10}>{String(option)}</UIText>
                </Button>
              ))}
            </Container>
          </Container>
        );
      }

      case "color": {
        const presetColors = [
          "#ff6030",
          "#4080ff",
          "#80ff40",
          "#ff4080",
          "#ffaa00",
          "#00ffaa",
        ];
        return (
          <Container key={pathStr} flexDirection="column" gap={4}>
            <UIText fontSize={12} color="#888">
              {config.label || control.key}
            </UIText>
            <Container flexDirection="row" gap={8} flexWrap="wrap">
              {presetColors.map((color) => (
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
        );
      }

      case "button":
        return (
          <Button
            key={pathStr}
            onClick={() => {
              const fn = config.value;
              if (typeof fn === "function") fn();
            }}
          >
            <UIText>{config.label || control.key}</UIText>
          </Button>
        );

      case "vector3": {
        const vec = value as { x: number; y: number; z: number } | undefined;
        if (!vec) return null;

        return (
          <Container key={pathStr} flexDirection="column" gap={4}>
            <UIText fontSize={12} color="#888">
              {config.label || control.key}
            </UIText>
            {["x", "y", "z"].map((axis) => (
              <Container key={axis} flexDirection="column" gap={2}>
                <UIText fontSize={10} color="#666">
                  {axis.toUpperCase()}:{" "}
                  {vec[axis as keyof typeof vec].toFixed(2)}
                </UIText>
                <Slider
                  value={vec[axis as keyof typeof vec]}
                  onValueChange={(v: number) =>
                    setValue(pathStr, { ...vec, [axis]: v })
                  }
                  min={-10}
                  max={10}
                  step={0.1}
                />
              </Container>
            ))}
          </Container>
        );
      }

      default:
        return null;
    }
    },
    [setValue, values],
  );

  // Render controls in a folder
  const renderFolder = useCallback(
    (folder: typeof folders[number]) => {
      if (folder.controls.length === 0) return null;

      return (
        <Card key={folder.path} padding={16} gap={12}>
          <UIText fontSize={16} fontWeight="medium" color="white">
            {folder.key}
          </UIText>
          <Container flexDirection="column" gap={8}>
            {folder.controls.map((control) => renderControl(control))}
          </Container>
        </Card>
      );
    },
    [folders, renderControl],
  );

  // Render content based on tabs or no tabs
  const renderContent = useMemo(() => {
    if (tabs && folders.length > 0) {
      const activeFolder = folders.find((folder) => folder.key === activeTab);

      return (
        <>
          {/* Tab Navigation */}
          <Container flexDirection="row" gap={4} justifyContent="center">
            {folders.map((folder) => (
              <Button
                key={folder.path}
                onClick={() => setActiveTab(folder.key)}
                variant={activeTab === folder.key ? "default" : "outline"}
                size="sm"
              >
                <UIText fontSize={10}>{folder.key.toUpperCase()}</UIText>
              </Button>
            ))}
          </Container>

          {/* Active Tab Content */}
          {activeFolder && renderFolder(activeFolder)}
        </>
      );
    } else {
      // No tabs - render all controls
      return (
        <Container flexDirection="column" gap={12}>
          {/* Top level controls */}
          {topLevelControls.map((control) => renderControl(control))}

          {/* Folders */}
          {folders.map((folder) => renderFolder(folder))}
        </Container>
      );
    }
  }, [activeTab, folders, renderControl, tabs, topLevelControls]);

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
            <UIText
              fontSize={20}
              fontWeight="bold"
              color="white"
              textAlign="center"
            >
              {title}
            </UIText>

            {/* Content */}
            {renderContent}
          </Container>
        </Defaults>
      </Root>
    </group>
  );
}
