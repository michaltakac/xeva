import { useRef, useState, useMemo, useCallback, forwardRef, RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { 
  Root, 
  Container, 
  Text as UIText,
  ComponentInternals,
  DefaultProperties,
} from "@react-three/uikit";
import {
  Defaults,
  Slider,
  Button,
  Toggle,
  colors,
} from "@react-three/uikit-default";
import {
  MenuIcon,
  ExpandIcon,
  SettingsIcon,
  ListIcon,
  GripIcon,
} from "@react-three/uikit-lucide";
import { Handle, HandleStore, HandleTarget } from '@react-three/handle';
import { useXRGrab } from "../xr/useXRGrab";
import { useHandTracking } from "../xr/useHandTracking";
import { useSpatialAnchor } from "../xr/useSpatialAnchor";
import { useDualHandInteraction } from "../xr/useDualHandInteraction";
import { GlassMaterial, MetalMaterial } from "../materials/XRMaterials";
import * as THREE from "three";
import { clamp, damp } from 'three/src/math/MathUtils.js';
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
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;

  // Visual
  backgroundColor?: string;
  borderRadius?: number;
  padding?: number;
  title?: string;
  tabs?: boolean;
  backgroundOpacity?: number;
  useMaterialClass?: "glass" | "metal" | "default";

  // XR Features
  dualHandMode?: boolean;
  grabbable?: boolean | {
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
  handTracking?: boolean | {
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
    type: "wall" | "floor" | "ceiling" | "object" | "controller" | "hand" | "fixed";
    target?: THREE.Object3D | "left" | "right";
    offset?: [number, number, number];
    autoAlign?: boolean;
    followTarget?: boolean;
    smoothing?: number;
  };
  resizable?: boolean;
  showSidePanel?: boolean;

  // Callbacks
  onGrab?: () => void;
  onRelease?: () => void;
  onMove?: (position: THREE.Vector3) => void;
  onPinch?: (hand: "left" | "right", position: THREE.Vector3) => void;
  onPoint?: (hand: "left" | "right", direction: THREE.Vector3) => void;
  onResize?: (width: number, height: number) => void;
}

// Helper objects for calculations
const eulerHelper = new THREE.Euler();
const quaternionHelper = new THREE.Quaternion();
const vectorHelper1 = new THREE.Vector3();
const vectorHelper2 = new THREE.Vector3();
const zAxis = new THREE.Vector3(0, 0, 1);

// NormalizedSlider component that handles negative ranges correctly
interface NormalizedSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
}

function NormalizedSlider({ value, onValueChange, min, max, step = 0.01 }: NormalizedSliderProps) {
  // Ensure min < max
  const actualMin = Math.min(min, max);
  const actualMax = Math.max(min, max);
  const range = actualMax - actualMin;
  
  // Clamp the value to the valid range
  const clampedValue = Math.max(actualMin, Math.min(actualMax, value));
  
  // Normalize the value to 0-1 range for the slider visualization
  const normalizedValue = range > 0 ? (clampedValue - actualMin) / range : 0;
  
  // Handle value change by denormalizing back to the actual range
  const handleChange = (normalizedVal: number) => {
    const actualValue = normalizedVal * range + actualMin;
    // Round to step precision to avoid floating point issues
    const steppedValue = Math.round(actualValue / step) * step;
    // Clamp the final value to ensure it stays within bounds
    const finalValue = Math.max(actualMin, Math.min(actualMax, steppedValue));
    onValueChange(finalValue);
  };
  
  // Calculate normalized step (ensure it's not too small to avoid performance issues)
  const normalizedStep = range > 0 ? Math.max(0.001, step / range) : 0.01;
  
  return (
    <Slider
      value={normalizedValue}
      onValueChange={handleChange}
      min={0}
      max={1}
      step={normalizedStep}
    />
  );
}

export function XrevaPanelXR({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  width: initialWidth = 700,
  height: initialHeight = 450,
  minWidth = 300,
  maxWidth = 1000,
  minHeight = 250,
  maxHeight = 700,
  backgroundColor = "#0a0a0a",
  borderRadius = 16,
  title = "XReva Controls",
  tabs = true,
  backgroundOpacity = 0.95,
  useMaterialClass = "glass",
  dualHandMode = false,
  grabbable = true,
  handTracking = true,
  billboard = true,
  anchor,
  resizable = true,
  showSidePanel: initialShowSidePanel = true,
  onGrab,
  onRelease,
  onMove,
  onPinch,
  onPoint,
  onResize,
}: XrevaPanelXRProps) {
  const { values, setValue, folders, topLevelControls, activeTab, setActiveTab } =
    usePanelState(tabs);
  
  const groupRef = useRef<THREE.Group | null>(null);
  const storeRef = useRef<HandleStore<any>>(null);
  const innerTargetRef = useRef<THREE.Object3D>(null);
  const [isHighlighted, setIsHighlighted] = useState(false);
  
  // Reactive signals for dimensions
  const [height, setHeight] = useState(initialHeight);
  const [width, setWidth] = useState(initialWidth);
  const [menuWidth, setMenuWidth] = useState(200);
  const showSidePanel = useMemo(() => width > 500 && initialShowSidePanel, [width, initialShowSidePanel]);
  const sidePanelDisplay = useMemo(() => (showSidePanel ? 'flex' : 'none'), [showSidePanel]);
  const borderLeftRadius = useMemo(() => (showSidePanel ? 0 : borderRadius), [showSidePanel, borderRadius]);
  const paddingLeft = useMemo(() => (showSidePanel ? 20 : 0), [showSidePanel]);
  
  // Store initial dimensions for scaling
  const initialMaxHeight = useRef<number>(undefined);
  const initialWidthRef = useRef<number>(undefined);
  const containerRef = useRef<ComponentInternals>(null);
  const resizeContainerRef = useRef<ComponentInternals>(null);
  
  // Handle ref proxy for resize handle - using Container's interactionPanel
  const handleRef = useMemo(
    () => new Proxy<RefObject<THREE.Object3D | null>>(
      { current: null },
      { get: () => resizeContainerRef.current?.interactionPanel }
    ),
    [],
  );

  // Parse grabbable options
  const grabOptions = useMemo(
    () => typeof grabbable === "boolean"
      ? { enabled: grabbable }
      : grabbable || { enabled: false },
    [grabbable],
  );

  // Parse hand tracking options
  const handOptions = useMemo(
    () => typeof handTracking === "boolean"
      ? { enabled: handTracking }
      : handTracking || { enabled: false },
    [handTracking],
  );

  // Get material class
  const getMaterialClass = useMemo(() => {
    switch (useMaterialClass) {
      case "glass": return GlassMaterial;
      case "metal": return MetalMaterial;
      default: return undefined;
    }
  }, [useMaterialClass]);

  // Dual-hand interaction mode
  const {
    isGrabbed: dualHandGrabbed,
    hoveredControl: dualHandHovered,
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

  // XR Controller Grab behavior
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

  // Combined grab state
  const isGrabbed = dualHandMode ? dualHandGrabbed : controllerGrabbed || !!grabbedByHand;
  const isHovered = dualHandMode ? !!dualHandHovered : controllerHovered || !!hoveredHand;

  // Billboard effect - always face camera
  useFrame((state, dt) => {
    if (!groupRef.current || !storeRef.current?.getState()) return;
    
    // Billboard rotation
    if (billboard && !isGrabbed && !isAnchored) {
      state.camera.getWorldPosition(vectorHelper1);
      groupRef.current.getWorldPosition(vectorHelper2);
      quaternionHelper.setFromUnitVectors(zAxis, vectorHelper1.sub(vectorHelper2).normalize());
      eulerHelper.setFromQuaternion(quaternionHelper, 'YXZ');
      groupRef.current.rotation.y = damp(groupRef.current.rotation.y, eulerHelper.y, 10, dt);
    }
  });

  // Visual feedback for hover/grab states
  const panelBackgroundColor = useMemo(() => {
    if (isHighlighted || isGrabbed) return "#1a1a1a";
    if (isHovered) return "#0f0f0f";
    return backgroundColor;
  }, [backgroundColor, isHighlighted, isGrabbed, isHovered]);

  // Render a single control (XR-optimized)
  const renderControl = useCallback(
    (control: typeof topLevelControls[number]) => {
      const pathStr = control.path.join(".");
      const value = values[pathStr];
      const config = control.config as ControlConfig;

      switch (control.type) {
        case "number": {
          const { min = 0, max = 1, step = 0.01, label } = config;
          return (
            <Container key={pathStr} flexDirection="column" gap={8} minHeight={60}>
              <UIText fontSize={14} color={colors.mutedForeground}>
                {label || control.key}: {typeof value === "number" ? value.toFixed(2) : value}
              </UIText>
              <Container height={36}>
                <NormalizedSlider
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
            <Container key={pathStr} flexDirection="row" alignItems="center" gap={16} minHeight={44}>
              <Toggle
                checked={value as boolean}
                onCheckedChange={(checked: boolean) => setValue(pathStr, checked)}
              />
              <UIText fontSize={14} color={colors.foreground}>
                {config.label || control.key}
              </UIText>
            </Container>
          );

        case "select": {
          const options = Array.isArray(config.options) ? config.options : [];
          return (
            <Container key={pathStr} flexDirection="column" gap={8}>
              <UIText fontSize={14} color={colors.mutedForeground}>
                {config.label || control.key}
              </UIText>
              <Container flexDirection="row" gap={8} flexWrap="wrap">
                {options.map((option) => (
                  <Button
                    key={String(option)}
                    onClick={() => setValue(pathStr, option)}
                    variant={value === option ? "default" : "outline"}
                    size="sm"
                  >
                    <UIText fontSize={12}>
                      {String(option)}
                    </UIText>
                  </Button>
                ))}
              </Container>
            </Container>
          );
        }

        case "color": {
          const presetColors = ["#ff6030", "#4080ff", "#80ff40", "#ff4080", "#ffaa00", "#00ffaa"];
          return (
            <Container key={pathStr} flexDirection="column" gap={8}>
              <UIText fontSize={14} color={colors.mutedForeground}>
                {config.label || control.key}
              </UIText>
              <Container flexDirection="row" gap={8} flexWrap="wrap">
                {presetColors.map((color) => (
                  <Container
                    key={color}
                    width={36}
                    height={36}
                    backgroundColor={color}
                    borderRadius={8}
                    cursor="pointer"
                    onClick={() => setValue(pathStr, color)}
                    borderWidth={value === color ? 3 : 0}
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
              size="sm"
            >
              <UIText fontSize={14}>
                {config.label || control.key}
              </UIText>
            </Button>
          );

        case "vector3": {
          const vec = value as { x: number; y: number; z: number } | undefined;
          if (!vec) return null;

          return (
            <Container key={pathStr} flexDirection="column" gap={8}>
              <UIText fontSize={14} color={colors.mutedForeground}>
                {config.label || control.key}
              </UIText>
              {["x", "y", "z"].map((axis) => (
                <Container key={axis} flexDirection="column" gap={4}>
                  <UIText fontSize={12} color={colors.mutedForeground}>
                    {axis.toUpperCase()}: {vec[axis as keyof typeof vec].toFixed(2)}
                  </UIText>
                  <Container height={28}>
                    <NormalizedSlider
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
        <Container
          key={folder.path}
          flexDirection="column"
          gap={16}
          backgroundColor={colors.card}
          borderRadius={12}
          padding={20}
          panelMaterialClass={getMaterialClass}
          borderBend={0.3}
          borderWidth={2}
        >
          <UIText fontSize={16} fontWeight="semi-bold" color={colors.cardForeground}>
            {folder.key}
          </UIText>
          <Container flexDirection="column" gap={12}>
            {folder.controls.map((control) => renderControl(control))}
          </Container>
        </Container>
      );
    },
    [folders, renderControl, getMaterialClass],
  );

  // Width resize handle component
  const WidthHandle = useCallback(() => {
    const handleContainerRef = useRef<ComponentInternals>(null);
    const widthHandleRef = useMemo(
      () => new Proxy<RefObject<THREE.Object3D | null>>(
        { current: null },
        { get: () => handleContainerRef.current?.interactionPanel }
      ),
      [],
    );
    const initialWidthHandle = useRef<number>(undefined);

    if (!resizable || !showSidePanel) return null;

    return (
      <Handle
        apply={(state) => {
          if (state.first) {
            initialWidthHandle.current = menuWidth;
          } else if (initialWidthHandle.current != null && handleContainerRef.current != null) {
            const newWidth = clamp(
              initialWidthHandle.current + state.offset.position.x / (handleContainerRef.current as any).pixelSize.value,
              150,
              300
            );
            setMenuWidth(newWidth);
          }
        }}
        handleRef={widthHandleRef}
        targetRef="from-context"
        scale={false}
        multitouch={false}
        rotate={false}
      >
        <Container
          ref={handleContainerRef}
          positionType="absolute"
          height="90%"
          maxHeight={200}
          positionRight={-20}
          positionTop="50%"
          transformTranslateY="-50%"
          width={10}
          backgroundColor="white"
          backgroundOpacity={0.2}
          borderRadius={5}
          hover={{ backgroundOpacity: 0.5 }}
          cursor="pointer"
        />
      </Handle>
    );
  }, [resizable, showSidePanel, menuWidth, innerTargetRef]);

  // Bottom bar handle component
  const BarHandle = forwardRef<HandleStore<any>, {}>((_props, ref) => {
    const barContainerRef = useRef<ComponentInternals>(null);
    const barHandleRef = useMemo(
      () => new Proxy<RefObject<THREE.Object3D | null>>(
        { current: null },
        { get: () => barContainerRef.current?.interactionPanel }
      ),
      [],
    );
    
    return (
      <Handle 
        ref={ref} 
        handleRef={barHandleRef} 
        targetRef="from-context" 
        scale={false} 
        multitouch={false} 
        rotate={false}
      >
        <Container
          panelMaterialClass={getMaterialClass}
          borderBend={0.4}
          borderWidth={4}
          pointerEventsType={{ deny: 'touch' }}
          marginTop={10}
          hover={{
            maxWidth: 240,
            width: '100%',
            backgroundColor: colors.accent,
            marginX: 10,
            marginTop: 6,
            height: 18,
            transformTranslateY: 2,
          }}
          cursor="pointer"
          ref={barContainerRef}
          width="90%"
          maxWidth={200}
          height={14}
          borderRadius={10}
          backgroundColor={colors.background}
          marginX={20}
        />
      </Handle>
    );
  });

  // Render content based on tabs or sidebar navigation
  const renderContent = useMemo(() => {
    if (tabs && folders.length > 0) {
      // Tabs mode - show tab buttons and active folder content
      const activeFolder = folders.find((folder) => folder.key === activeTab);
      return (
        <>
          <Container flexDirection="row" gap={8} justifyContent="center" marginBottom={16}>
            {folders.map((folder) => (
              <Button
                key={folder.path}
                onClick={() => setActiveTab(folder.key)}
                variant={activeTab === folder.key ? "default" : "ghost"}
                size="sm"
              >
                <UIText fontSize={12}>
                  {folder.key.toUpperCase()}
                </UIText>
              </Button>
            ))}
          </Container>
          {activeFolder && renderFolder(activeFolder)}
        </>
      );
    } else if (showSidePanel && folders.length > 0) {
      // Sidebar mode - show all folders but with display none/flex based on active
      return (
        <Container flexDirection="column" gap={20}>
          {folders.map((folder) => (
            <Container
              key={folder.key}
              display={folder.key === activeTab ? "flex" : "none"}
              flexDirection="column"
              gap={20}
              width="100%"
            >
              {renderFolder(folder)}
            </Container>
          ))}
        </Container>
      );
    } else {
      // No sidebar or tabs - show everything
      return (
        <Container flexDirection="column" gap={20}>
          {topLevelControls.map((control) => renderControl(control))}
          {folders.map((folder) => renderFolder(folder))}
        </Container>
      );
    }
  }, [activeTab, folders, renderControl, renderFolder, tabs, topLevelControls, setActiveTab, showSidePanel]);

  return (
    <group position-y={-0.3}>
      <HandleTarget>
        <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
          <group ref={innerTargetRef}>
            
            <DefaultProperties borderColor={colors.background}>
              <Defaults>
                <Root
                  anchorY="bottom"
                  width={width}
                  height={height}
                  alignItems="center"
                  flexDirection="column"
                  pixelSize={0.0015}
                >
                  {/* Resize Handle */}
                  {resizable && (
                    <Handle
                      translate="as-scale"
                      targetRef={innerTargetRef}
                      apply={(state) => {
                        if (state.first) {
                          initialMaxHeight.current = height;
                          initialWidthRef.current = width;
                        } else if (initialMaxHeight.current != null && initialWidthRef.current != null) {
                          const newHeight = clamp(state.current.scale.y * initialMaxHeight.current, minHeight, maxHeight);
                          const newWidth = clamp(state.current.scale.x * initialWidthRef.current, minWidth, maxWidth);
                          setHeight(newHeight);
                          setWidth(newWidth);
                          onResize?.(newWidth, newHeight);
                        }
                      }}
                      handleRef={handleRef}
                      rotate={false}
                      multitouch={false}
                      scale={{ z: false }}
                    >
                      <Container
                        pointerEventsType={{ deny: 'touch' }}
                        ref={resizeContainerRef}
                        positionType="absolute"
                        positionTop={-26}
                        width={26}
                        height={26}
                        backgroundColor={colors.background}
                        borderRadius={100}
                        positionRight={-26}
                        panelMaterialClass={getMaterialClass}
                        borderBend={0.4}
                        borderWidth={4}
                      />
                    </Handle>
                  )}
                  
                  <Container alignItems="center" flexGrow={1} width="100%" flexDirection="column-reverse" gapRow={8}>
                    {/* Title Bar */}
                    <Container
                      display="flex"
                      alignItems="center"
                      flexShrink={0}
                      paddingLeft={16}
                      paddingRight={16}
                      paddingTop={4}
                      paddingBottom={4}
                      backgroundColor={colors.background}
                      borderRadius={16}
                      panelMaterialClass={MetalMaterial}
                      borderBend={0.4}
                      borderWidth={4}
                      flexDirection="row"
                      gapColumn={16}
                      width="90%"
                      zIndexOffset={10}
                      transformTranslateZ={10}
                      marginTop={-30}
                      maxWidth={350}
                      pointerEvents="none"
                    >
                      <MenuIcon width={16} color={colors.foreground} />
                      <UIText
                        fontSize={14}
                        fontWeight={500}
                        lineHeight={28}
                        color={colors.foreground}
                        flexDirection="column"
                      >
                        {title}
                      </UIText>
                      <Container flexGrow={1} />
                      <ExpandIcon width={16} color={colors.foreground} />
                      <SettingsIcon width={16} color={colors.foreground} />
                    </Container>

                    {/* Main Content Area */}
                    <Container width="100%" flexDirection="row" flexGrow={1}>
                      {/* Side Panel */}
                      {showSidePanel && (
                        <Container
                          display={sidePanelDisplay}
                          flexDirection="column"
                          borderLeftRadius={borderRadius}
                          backgroundColor="#555555"
                          borderColor="#555555"
                          panelMaterialClass={getMaterialClass}
                          borderWidth={4}
                          borderRightWidth={2}
                          borderBend={0.4}
                          width={menuWidth}
                          height="100%"
                          padding={16}
                          gapRow={16}
                        >
                          {/* Temporarily disabled - causing parent mismatch <WidthHandle /> */}
                          <UIText marginBottom={8} fontSize={20} fontWeight="semi-bold" color={colors.cardForeground}>
                            Categories
                          </UIText>

                          {folders.map((folder) => (
                            <Container
                              key={folder.key}
                              flexDirection="row"
                              alignItems="center"
                              justifyContent="space-between"
                              cursor="pointer"
                              onClick={() => setActiveTab(folder.key)}
                              padding={8}
                              borderRadius={8}
                              backgroundColor={activeTab === folder.key ? "#4080ff" : colors.background}
                              backgroundOpacity={activeTab === folder.key ? 0.3 : 0}
                              borderWidth={activeTab === folder.key ? 2 : 0}
                              borderColor="#4080ff"
                              hover={{ 
                                backgroundColor: activeTab === folder.key ? "#4080ff" : colors.accent, 
                                backgroundOpacity: activeTab === folder.key ? 0.4 : 0.2 
                              }}
                            >
                              <UIText 
                                color={activeTab === folder.key ? "#4080ff" : colors.cardForeground}
                                fontWeight={activeTab === folder.key ? "bold" : "normal"}
                              >
                                {folder.key}
                              </UIText>
                              {folder.key === "Grid" ? (
                                <GripIcon width={16} color={activeTab === folder.key ? "#4080ff" : colors.cardForeground} />
                              ) : (
                                <ListIcon width={16} color={activeTab === folder.key ? "#4080ff" : colors.cardForeground} />
                              )}
                            </Container>
                          ))}
                        </Container>
                      )}

                      {/* Main Panel */}
                      <Container
                        flexGrow={1}
                        scrollbarBorderRadius={4}
                        scrollbarOpacity={0.2}
                        flexDirection="column"
                        overflow="scroll"
                        paddingLeft={paddingLeft}
                        panelMaterialClass={getMaterialClass}
                        borderBend={0.4}
                        backgroundColor={panelBackgroundColor}
                        backgroundOpacity={backgroundOpacity}
                        borderRadius={borderRadius}
                        borderLeftRadius={borderLeftRadius}
                        borderWidth={4}
                        borderLeftWidth={0}
                      >
                        <Container 
                          flexShrink={0} 
                          display="flex" 
                          flexDirection="column" 
                          gapRow={16} 
                          padding={32}
                        >
                          {renderContent}
                        </Container>
                      </Container>
                    </Container>
                  </Container>
                  <BarHandle ref={storeRef} />
                </Root>
              </Defaults>
            </DefaultProperties>
          </group>
        </group>
      </HandleTarget>
    </group>
  );
}