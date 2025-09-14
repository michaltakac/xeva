import { useRef, useState, useMemo } from "react";
import { Root, Container, Text as UIText } from "@react-three/uikit";
import {
  Card,
  Defaults,
  Slider,
  Button,
  Toggle,
} from "@react-three/uikit-default";
import { useXrevaStore } from "../core/useControls";
import { useFrame } from "@react-three/fiber";
import { useXRGrab } from "../xr/useXRGrab";
import { useHandTracking } from "../xr/useHandTracking";
import { useSpatialAnchor } from "../xr/useSpatialAnchor";
import { useDualHandInteraction } from "../xr/useDualHandInteraction";
import * as THREE from "three";

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
  const controls = useXrevaStore((state) => state.getAllControls());
  const values = useXrevaStore((state) => state.values);
  const setValue = useXrevaStore((state) => state.setValue);

  const [activeTab, setActiveTab] = useState<string | null>(null);
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
  const panelBackgroundColor = useMemo(() => {
    // Add transparency to background color
    const baseColor = backgroundColor.replace("#", "");
    const opacity = Math.round(backgroundOpacity * 255)
      .toString(16)
      .padStart(2, "0");

    if (isHighlighted || isGrabbed) {
      return `#1a1a1a${opacity}`;
    } else if (isHovered) {
      return `#0f0f0f${opacity}`;
    } else {
      return `#${baseColor}${opacity}`;
    }
  }, [backgroundColor, backgroundOpacity, isHighlighted, isGrabbed, isHovered]);

  // Visual indicators for hand states
  const showHandIndicators =
    leftPinching || rightPinching || leftPointing || rightPointing;
  const showDualHandIndicators =
    dualHandMode && (isLeftHandGrabbing || isRightHandInteracting);

  // Group controls by top-level folders (for tabs)
  const topLevelFolders: string[] = [];
  const topLevelControls: typeof controls = [];

  controls.forEach((control) => {
    if (control.path.length === 2 && control.type === "folder") {
      topLevelFolders.push(control.key);
    } else if (control.path.length === 2 && control.type !== "folder") {
      topLevelControls.push(control);
    }
  });

  // Set initial active tab
  if (tabs && activeTab === null && topLevelFolders.length > 0) {
    setActiveTab(topLevelFolders[0]);
  }

  // Render a single control (XR-optimized with larger touch targets)
  const renderControl = (control: (typeof controls)[0]) => {
    const pathStr = control.path.join(".");
    const value = values[pathStr];

    switch (control.type) {
      case "number": {
        const { min = 0, max = 1, step = 0.01, label } = control.config;
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
              {control.config.label || control.key}
            </UIText>
          </Container>
        );

      case "select": {
        const options = control.config.options || [];
        return (
          <Container key={pathStr} flexDirection="column" gap={8}>
            <UIText fontSize={16} color="#aaa" fontWeight="medium">
              {control.config.label || control.key}
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
              {control.config.label || control.key}
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
              const fn = control.config.value;
              if (typeof fn === "function") fn();
            }}
            size="lg"
          >
            <UIText fontSize={16} fontWeight="medium">
              {control.config.label || control.key}
            </UIText>
          </Button>
        );

      case "vector3": {
        const vec = value as { x: number; y: number; z: number } | undefined;
        if (!vec) return null;

        return (
          <Container key={pathStr} flexDirection="column" gap={8}>
            <UIText fontSize={16} color="#aaa" fontWeight="medium">
              {control.config.label || control.key}
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
  };

  // Render controls in a folder
  const renderFolder = (folderPath: string, folderName: string) => {
    const folderControls = controls.filter(
      (c) =>
        c.path.length > 2 &&
        c.path.slice(0, -1).join(".") === folderPath &&
        c.type !== "folder",
    );

    if (folderControls.length === 0) return null;

    return (
      <Card key={folderPath} padding={24} gap={20}>
        <UIText fontSize={20} fontWeight="bold" color="white">
          {folderName}
        </UIText>
        <Container flexDirection="column" gap={16}>
          {folderControls.map(renderControl)}
        </Container>
      </Card>
    );
  };

  // Render content based on tabs or no tabs
  const renderContent = () => {
    if (tabs && topLevelFolders.length > 0) {
      return (
        <>
          {/* Tab Navigation */}
          <Container flexDirection="row" gap={8} justifyContent="center">
            {topLevelFolders.map((folder) => (
              <Button
                key={folder}
                onClick={() => setActiveTab(folder)}
                variant={activeTab === folder ? "default" : "outline"}
                size="lg"
              >
                <UIText fontSize={14} fontWeight="medium">
                  {folder.toUpperCase()}
                </UIText>
              </Button>
            ))}
          </Container>

          {/* Active Tab Content */}
          {activeTab &&
            renderFolder(
              controls
                .find((c) => c.key === activeTab && c.type === "folder")
                ?.path.join(".") || "",
              activeTab,
            )}
        </>
      );
    } else {
      // No tabs - render all controls
      return (
        <Container flexDirection="column" gap={20}>
          {/* Top level controls */}
          {topLevelControls.map(renderControl)}

          {/* Folders */}
          {topLevelFolders.map((folder) => {
            const folderControl = controls.find(
              (c) => c.key === folder && c.type === "folder",
            );
            if (!folderControl) return null;
            return renderFolder(folderControl.path.join("."), folder);
          })}
        </Container>
      );
    }
  };

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      <Root
        ref={rootRef}
        width={width}
        height={height}
        pixelSize={0.01}
        backgroundColor={panelBackgroundColor}
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
              backgroundColor="#00000044"
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
            <Container padding={8}>{renderContent()}</Container>
          </Container>
        </Defaults>
      </Root>
    </group>
  );
}
