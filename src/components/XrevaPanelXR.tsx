import { useRef, useState, useMemo, useCallback } from "react";
import { Root, Container, Text as UIText } from "@react-three/uikit";
import {
  Card,
  Defaults,
  Slider,
  Button,
  Toggle,
} from "@react-three/uikit-default";
import { useFrame } from "@react-three/fiber";
import { useXRGrab } from "../xr/useXRGrab";
import { useHandTracking } from "../xr/useHandTracking";
import { useSpatialAnchor } from "../xr/useSpatialAnchor";
import { useDualHandInteraction } from "../xr/useDualHandInteraction";
import * as THREE from "three";
import { usePanelState } from "./usePanelState";
import type { ControlConfig } from "../core/useControls";

interface XrevaPanelXRProps {
  // Positioning
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];

  // Dimensions
  width?: number;
  height?: number;

  // Visual
  backgroundColor?: string;
  borderRadius?: number;
  padding?: number;
  title?: string;
  tabs?: boolean;
  backgroundOpacity?: number;

  // XR Features
  dualHandMode?: boolean; // Enable left-hand grab, right-hand interact
  grabbable?:
    | boolean
    | {
        enabled?: boolean;
        constraints?: {
          minDistance?: number;
          maxDistance?: number;
          lockRotation?: boolean;
          snapToGrid?: boolean;
          gridSize?: number;
        };
        hapticFeedback?: {
          onGrab?: number;
          onRelease?: number;
          onHover?: number;
        };
      };
  handTracking?:
    | boolean
    | {
        enabled?: boolean;
        gestures?: {
          pinch?: boolean;
          point?: boolean;
          fist?: boolean;
        };
        visualFeedback?: {
          showRaycast?: boolean;
          highlightOnHover?: boolean;
          cursorType?: "ring" | "dot" | "sphere";
        };
      };
  billboard?: boolean;
  anchor?: {
    type:
      | "wall"
      | "floor"
      | "ceiling"
      | "object"
      | "controller"
      | "hand"
      | "fixed";
    target?: THREE.Object3D | "left" | "right";
    offset?: [number, number, number];
    autoAlign?: boolean;
    followTarget?: boolean;
    smoothing?: number;
  };

  // Callbacks
  onGrab?: () => void;
  onRelease?: () => void;
  onMove?: (position: THREE.Vector3) => void;
  onPinch?: (hand: "left" | "right", position: THREE.Vector3) => void;
  onPoint?: (hand: "left" | "right", direction: THREE.Vector3) => void;
}

export function XrevaPanelXR({
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
  backgroundOpacity = 0.95,
  dualHandMode = false,
  grabbable = true,
  handTracking = true,
  billboard = false,
  anchor,
  onGrab,
  onRelease,
  onMove,
  onPinch,
  onPoint,
}: XrevaPanelXRProps) {
  const { values, setValue, folders, topLevelControls, activeTab, setActiveTab } =
    usePanelState(tabs);
  const groupRef = useRef<THREE.Group | null>(null);
  const rootRef = useRef<any>(null);
  const [isHighlighted, setIsHighlighted] = useState(false);

  // Parse grabbable options
  const grabOptions = useMemo(
    () =>
      typeof grabbable === "boolean"
        ? { enabled: grabbable }
        : grabbable || { enabled: false },
    [grabbable],
  );

  // Parse hand tracking options
  const handOptions = useMemo(
    () =>
      typeof handTracking === "boolean"
        ? { enabled: handTracking }
        : handTracking || { enabled: false },
    [handTracking],
  );

  // Dual-hand interaction mode (left grab, right interact)
  const {
    isGrabbed: dualHandGrabbed,
    isInteracting: dualHandInteracting,
    hoveredControl: dualHandHovered,
    isLeftHandGrabbing,
    isRightHandInteracting,
  } = useDualHandInteraction(groupRef, {
    enabled: dualHandMode,
    grabHand: "left",
    interactHand: "right",
    grabButton: "squeeze",
    interactButton: "trigger",
    grabDistance: 2,
    interactDistance: 1.5,
    hapticFeedback: {
      onGrab: 0.3,
      onRelease: 0.1,
      onInteract: 0.2,
      onHover: 0.05,
    },
    onGrab: (_hand) => {
      setIsHighlighted(true);
      onGrab?.();
    },
    onRelease: (_hand) => {
      setIsHighlighted(false);
      onRelease?.();
    },
    onMove: (pos) => {
      onMove?.(pos);
    },
  });

  // XR Controller Grab behavior (when not in dual-hand mode)
  const { isGrabbed: controllerGrabbed, isHovered: controllerHovered } =
    useXRGrab(groupRef, {
      ...grabOptions,
      onGrab: () => {
        setIsHighlighted(true);
        onGrab?.();
      },
      onRelease: () => {
        setIsHighlighted(false);
        onRelease?.();
      },
      onMove: (pos) => {
        onMove?.(pos);
      },
    });

  // Hand tracking behavior
  const {
    grabbedByHand,
    hoveredHand,
    leftPinching,
    rightPinching,
    leftPointing,
    rightPointing,
  } = useHandTracking(groupRef, {
    ...handOptions,
    onPinchStart: (hand, pos) => {
      setIsHighlighted(true);
      onPinch?.(hand, pos);
    },
    onPinchEnd: () => {
      setIsHighlighted(false);
    },
    onPointStart: (hand, dir) => {
      onPoint?.(hand, dir);
    },
  });

  // Spatial anchoring
  const { isAnchored } = useSpatialAnchor(groupRef, {
    enabled: !!anchor,
    anchor,
    onAnchorUpdate: (pos) => {
      onMove?.(pos);
    },
  });

  // Combined grab state (prioritize dual-hand mode if enabled)
  const isGrabbed = dualHandMode
    ? dualHandGrabbed
    : controllerGrabbed || !!grabbedByHand;
  const isHovered = dualHandMode
    ? !!dualHandHovered
    : controllerHovered || !!hoveredHand;
  const isInteracting = dualHandMode ? dualHandInteracting : false;

  // Billboard effect
  useFrame(({ camera }) => {
    if (billboard && groupRef.current && !isGrabbed && !isAnchored) {
      const lookAtPos = camera.position.clone();
      lookAtPos.y = groupRef.current.position.y; // Keep same height
      groupRef.current.lookAt(lookAtPos);
    }
  });

  // Visual feedback for hover/grab states
  // Note: Three.js doesn't support hex colors with alpha channel, so we handle opacity separately
  const panelBackgroundColor = useMemo(() => {
    if (isHighlighted || isGrabbed) {
      return "#1a1a1a";
    } else if (isHovered) {
      return "#0f0f0f";
    } else {
      return backgroundColor;
    }
  }, [backgroundColor, isHighlighted, isGrabbed, isHovered]);

  // Visual indicators for hand states
  const showHandIndicators =
    leftPinching || rightPinching || leftPointing || rightPointing;
  const showDualHandIndicators =
    dualHandMode && (isLeftHandGrabbing || isRightHandInteracting);

  // Render a single control (XR-optimized with larger touch targets)
  const renderControl = useCallback(
    (control: typeof topLevelControls[number]) => {
      const pathStr = control.path.join(".");
      const value = values[pathStr];
      const config = control.config as ControlConfig;

      switch (control.type) {
        case "number": {
        const { min = 0, max = 1, step = 0.01, label } = config;
          return (
            <Container
              key={pathStr}
              flexDirection="column"
              gap={8}
              minHeight={60}
            >
              <UIText fontSize={16} color="#aaa" fontWeight="medium">
              {label || control.key}:{" "}
              {typeof value === "number" ? value.toFixed(2) : value}
            </UIText>
              <Container height={44}>
                <Slider
                  value={value as number}
                  onValueChange={(v: number) => setValue(pathStr, v)}
                  min={min}
                  max={max}
                  step={step}
                />
              </Container>
            </Container>
          );
        }

        case "boolean":
          return (
            <Container
              key={pathStr}
              flexDirection="row"
              alignItems="center"
              gap={16}
              minHeight={50}
            >
              <Toggle
                checked={value as boolean}
                onCheckedChange={(checked: boolean) => setValue(pathStr, checked)}
              />
            <UIText fontSize={16} color="white" fontWeight="medium">
              {config.label || control.key}
            </UIText>
          </Container>
        );

      case "select": {
        const options = Array.isArray(config.options)
          ? config.options
          : [];
        return (
          <Container key={pathStr} flexDirection="column" gap={8}>
            <UIText fontSize={16} color="#aaa" fontWeight="medium">
              {config.label || control.key}
            </UIText>
              <Container flexDirection="row" gap={8} flexWrap="wrap">
                {options.map((option) => (
                  <Button
                    key={String(option)}
                    onClick={() => setValue(pathStr, option)}
                    variant={value === option ? "default" : "outline"}
                    size="lg"
                  >
                    <UIText fontSize={14} fontWeight="medium">
                      {String(option)}
                    </UIText>
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
            <Container key={pathStr} flexDirection="column" gap={8}>
            <UIText fontSize={16} color="#aaa" fontWeight="medium">
              {config.label || control.key}
            </UIText>
              <Container flexDirection="row" gap={12} flexWrap="wrap">
                {presetColors.map((color) => (
                  <Container
                    key={color}
                    width={48}
                    height={48}
                    backgroundColor={color}
                    borderRadius={16}
                    cursor="pointer"
                    onClick={() => setValue(pathStr, color)}
                    borderWidth={value === color ? 4 : 0}
                    borderColor="white"
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
            size="lg"
          >
            <UIText fontSize={16} fontWeight="medium">
              {config.label || control.key}
            </UIText>
          </Button>
        );

        case "vector3": {
          const vec = value as { x: number; y: number; z: number } | undefined;
          if (!vec) return null;

          return (
            <Container key={pathStr} flexDirection="column" gap={8}>
            <UIText fontSize={16} color="#aaa" fontWeight="medium">
              {config.label || control.key}
            </UIText>
              {["x", "y", "z"].map((axis) => (
                <Container key={axis} flexDirection="column" gap={4}>
                  <UIText fontSize={14} color="#888">
                    {axis.toUpperCase()}:{" "}
                    {vec[axis as keyof typeof vec].toFixed(2)}
                  </UIText>
                  <Container height={36}>
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
        <Card key={folder.path} padding={24} gap={20}>
          <UIText fontSize={20} fontWeight="bold" color="white">
            {folder.key}
          </UIText>
          <Container flexDirection="column" gap={16}>
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
          <Container flexDirection="row" gap={8} justifyContent="center">
            {folders.map((folder) => (
              <Button
                key={folder.path}
                onClick={() => setActiveTab(folder.key)}
                variant={activeTab === folder.key ? "default" : "outline"}
                size="lg"
              >
                <UIText fontSize={14} fontWeight="medium">
                  {folder.key.toUpperCase()}
                </UIText>
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
        <Container flexDirection="column" gap={20}>
          {/* Top level controls */}
          {topLevelControls.map((control) => renderControl(control))}

          {/* Folders */}
          {folders.map((folder) => renderFolder(folder))}
        </Container>
      );
    }
  }, [activeTab, folders, renderControl, tabs, topLevelControls]);

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      <Root
        ref={rootRef}
        width={width}
        height={height}
        pixelSize={0.01}
        backgroundColor={panelBackgroundColor}
        backgroundOpacity={backgroundOpacity}
        borderRadius={borderRadius}
        padding={padding}
        overflow="scroll"
      >
        <Defaults>
          <Container flexDirection="column" gap={24}>
            {/* Title Bar with status indicators */}
            <Container
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center"
              backgroundColor="#000044"
              padding={16}
              borderRadius={12}
              minHeight={50}
            >
              <UIText fontSize={28} fontWeight="bold" color="white">
                {title}
              </UIText>
              <Container flexDirection="row" gap={8}>
                {/* Status indicators */}
                {isGrabbed && (
                  <Container
                    width={16}
                    height={16}
                    backgroundColor={
                      dualHandMode && isLeftHandGrabbing ? "#a78bfa" : "#4ade80"
                    }
                    borderRadius={8}
                  />
                )}
                {isInteracting && dualHandMode && (
                  <Container
                    width={16}
                    height={16}
                    backgroundColor="#f59e0b"
                    borderRadius={8}
                  />
                )}
                {showHandIndicators && !dualHandMode && (
                  <Container
                    width={16}
                    height={16}
                    backgroundColor="#fbbf24"
                    borderRadius={8}
                  />
                )}
                {showDualHandIndicators && (
                  <Container flexDirection="row" gap={4}>
                    <Container
                      width={8}
                      height={16}
                      backgroundColor="#a78bfa"
                      borderRadius={4}
                    />
                    <Container
                      width={8}
                      height={16}
                      backgroundColor="#f59e0b"
                      borderRadius={4}
                    />
                  </Container>
                )}
                {isAnchored && (
                  <Container
                    width={16}
                    height={16}
                    backgroundColor="#60a5fa"
                    borderRadius={8}
                  />
                )}
              </Container>
            </Container>

            {/* Content */}
            <Container padding={8}>{renderContent}</Container>
          </Container>
        </Defaults>
      </Root>
    </group>
  );
}
