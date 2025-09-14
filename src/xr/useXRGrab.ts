import { useRef, useEffect, useState, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { useXR, useXRStore } from "@react-three/xr";
import * as THREE from "three";

interface XRGrabOptions {
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
  onGrab?: (controller: THREE.XRTargetRaySpace | THREE.XRGripSpace) => void;
  onRelease?: () => void;
  onMove?: (position: THREE.Vector3, rotation: THREE.Quaternion) => void;
}

export function useXRGrab(
  ref: React.RefObject<THREE.Group | null>,
  options: XRGrabOptions = {},
) {
  const {
    enabled = true,
    constraints = {},
    hapticFeedback = {},
    onGrab,
    onRelease,
    onMove,
  } = options;

  const {
    minDistance = 0.3,
    maxDistance = 5,
    lockRotation = false,
    snapToGrid = false,
    gridSize = 0.1,
  } = constraints;

  const {
    onGrab: grabHaptic = 0.3,
    onRelease: releaseHaptic = 0.1,
    onHover: hoverHaptic = 0.05,
  } = hapticFeedback;

  // Use the correct v6 API
  const store = useXRStore();
  const session = useXR((state) => state.session);
  const controllers = useXR((state) => (state as any).controllers || []);
  // const hands = useXR((state) => (state as any).hands || [])

  const [isGrabbed, setIsGrabbed] = useState(false);
  const [grabbedBy, setGrabbedBy] = useState<"left" | "right" | null>(null);
  const [grabbedController, setGrabbedController] = useState<
    THREE.XRTargetRaySpace | THREE.XRGripSpace | null
  >(null);
  const [isHovered, setIsHovered] = useState(false);

  const grabOffset = useRef(new THREE.Matrix4());
  const worldPosition = useRef(new THREE.Vector3());
  const worldQuaternion = useRef(new THREE.Quaternion());
  const tempMatrix = useRef(new THREE.Matrix4());
  const initialScale = useRef(new THREE.Vector3());

  // Raycaster for hover detection
  const raycaster = useRef(new THREE.Raycaster());
  const tempDirection = useRef(new THREE.Vector3());

  // Snap to grid helper
  const snapValue = (value: number) => {
    if (!snapToGrid) return value;
    return Math.round(value / gridSize) * gridSize;
  };

  // Apply haptic feedback using v6 API
  const applyHapticFeedback = useCallback(
    (
      handedness: "left" | "right",
      intensity: number,
      duration: number = 50,
    ) => {
      if (!session) return;

      // Find the input source for this controller
      const controller = controllers.get(handedness);
      if (!controller?.inputSource?.gamepad?.hapticActuators?.[0]) return;

      controller.inputSource.gamepad.hapticActuators[0].pulse(
        intensity,
        duration,
      );
    },
    [session, controllers],
  );

  // Handle select events (trigger press)
  useEffect(() => {
    if (!enabled || !session || !ref.current) return;

    const handleSelectStart = (
      event: THREE.Event & { target: THREE.XRTargetRaySpace },
    ) => {
      if (isGrabbed) return;

      // Determine handedness from the controller
      let handedness: "left" | "right" | null = null;
      controllers.forEach((controller: any, hand: any) => {
        if (
          controller.controller === event.target ||
          controller.grip === event.target
        ) {
          handedness = hand as "left" | "right";
        }
      });

      if (!handedness || !ref.current) return;

      // Check if ray intersects with panel
      const controller = controllers.get(handedness);
      if (!controller) return;

      // Get ray direction
      tempMatrix.current.identity();
      tempMatrix.current.extractRotation(controller.controller.matrixWorld);
      tempDirection.current.set(0, 0, -1);
      tempDirection.current.applyMatrix4(tempMatrix.current);

      // Set up raycaster
      raycaster.current.set(
        controller.controller.position,
        tempDirection.current,
      );
      const intersects = raycaster.current.intersectObject(ref.current, true);

      if (intersects.length > 0) {
        const distance = controller.controller.position.distanceTo(
          ref.current.position,
        );

        if (distance >= minDistance && distance <= maxDistance) {
          // Calculate grab offset
          tempMatrix.current.copy(controller.grip.matrixWorld);
          tempMatrix.current.invert();
          tempMatrix.current.multiply(ref.current.matrixWorld);
          grabOffset.current.copy(tempMatrix.current);

          // Store initial scale
          ref.current.getWorldScale(initialScale.current);

          setIsGrabbed(true);
          setGrabbedBy(handedness);
          setGrabbedController(controller.grip);

          // Haptic feedback
          applyHapticFeedback(handedness, grabHaptic);

          // Callback
          onGrab?.(controller.grip);
        }
      }
    };

    const handleSelectEnd = (
      event: THREE.Event & { target: THREE.XRTargetRaySpace },
    ) => {
      if (!isGrabbed) return;

      // Determine handedness
      let handedness: "left" | "right" | null = null;
      controllers.forEach((controller: any, hand: any) => {
        if (
          controller.controller === event.target ||
          controller.grip === event.target
        ) {
          handedness = hand as "left" | "right";
        }
      });

      if (handedness === grabbedBy) {
        setIsGrabbed(false);
        setGrabbedBy(null);
        setGrabbedController(null);

        // Haptic feedback
        if (handedness) applyHapticFeedback(handedness, releaseHaptic);

        // Callback
        onRelease?.();
      }
    };

    // Add event listeners to all controllers
    controllers.forEach((controller: any) => {
      controller.controller.addEventListener(
        "selectstart",
        handleSelectStart as any,
      );
      controller.controller.addEventListener(
        "selectend",
        handleSelectEnd as any,
      );
    });

    return () => {
      controllers.forEach((controller: any) => {
        controller.controller.removeEventListener(
          "selectstart",
          handleSelectStart as any,
        );
        controller.controller.removeEventListener(
          "selectend",
          handleSelectEnd as any,
        );
      });
    };
  }, [
    enabled,
    session,
    isGrabbed,
    grabbedBy,
    controllers,
    ref,
    applyHapticFeedback,
  ]);

  // Handle squeeze events (grip press) for more natural grabbing
  useEffect(() => {
    if (!enabled || !session || !ref.current) return;

    const handleSqueezeStart = (
      event: THREE.Event & { target: THREE.XRGripSpace },
    ) => {
      if (isGrabbed) return;

      // Determine handedness
      let handedness: "left" | "right" | null = null;
      controllers.forEach((controller: any, hand: any) => {
        if (controller.grip === event.target) {
          handedness = hand as "left" | "right";
        }
      });

      if (!handedness || !ref.current) return;

      const controller = controllers.get(handedness);
      if (!controller) return;

      // Check distance for grip-based grabbing
      const distance = controller.grip.position.distanceTo(
        ref.current.position,
      );

      if (distance <= 0.3) {
        // Close proximity for grip grab
        // Calculate grab offset
        tempMatrix.current.copy(controller.grip.matrixWorld);
        tempMatrix.current.invert();
        tempMatrix.current.multiply(ref.current.matrixWorld);
        grabOffset.current.copy(tempMatrix.current);

        // Store initial scale
        ref.current.getWorldScale(initialScale.current);

        setIsGrabbed(true);
        setGrabbedBy(handedness);
        setGrabbedController(controller.grip);

        // Haptic feedback
        applyHapticFeedback(handedness, grabHaptic);

        // Callback
        onGrab?.(controller.grip);
      }
    };

    const handleSqueezeEnd = (
      event: THREE.Event & { target: THREE.XRGripSpace },
    ) => {
      if (!isGrabbed) return;

      // Determine handedness
      let handedness: "left" | "right" | null = null;
      controllers.forEach((controller: any, hand: any) => {
        if (controller.grip === event.target) {
          handedness = hand as "left" | "right";
        }
      });

      if (handedness === grabbedBy) {
        setIsGrabbed(false);
        setGrabbedBy(null);
        setGrabbedController(null);

        // Haptic feedback
        if (handedness) applyHapticFeedback(handedness, releaseHaptic);

        // Callback
        onRelease?.();
      }
    };

    // Add squeeze listeners for grip-based interaction
    controllers.forEach((controller: any) => {
      controller.grip.addEventListener(
        "squeezestart",
        handleSqueezeStart as any,
      );
      controller.grip.addEventListener("squeezeend", handleSqueezeEnd as any);
    });

    return () => {
      controllers.forEach((controller: any) => {
        controller.grip.removeEventListener(
          "squeezestart",
          handleSqueezeStart as any,
        );
        controller.grip.removeEventListener(
          "squeezeend",
          handleSqueezeEnd as any,
        );
      });
    };
  }, [
    enabled,
    session,
    isGrabbed,
    grabbedBy,
    controllers,
    ref,
    applyHapticFeedback,
  ]);

  // Update grabbed object position
  useFrame(() => {
    if (!isGrabbed || !ref.current || !grabbedController) return;

    // Apply grab offset to controller transform
    tempMatrix.current.copy(grabbedController.matrixWorld);
    tempMatrix.current.multiply(grabOffset.current);

    // Extract position and rotation
    tempMatrix.current.decompose(
      worldPosition.current,
      worldQuaternion.current,
      new THREE.Vector3(), // scale (ignored)
    );

    // Apply constraints
    const camera = (store.getState() as any).camera;
    if (camera) {
      const distance = worldPosition.current.distanceTo(camera.position);
      if (distance < minDistance || distance > maxDistance) {
        // Clamp to min/max distance
        worldPosition.current.sub(camera.position);
        worldPosition.current.normalize();
        worldPosition.current.multiplyScalar(
          Math.max(minDistance, Math.min(maxDistance, distance)),
        );
        worldPosition.current.add(camera.position);
      }
    }

    // Snap to grid
    if (snapToGrid) {
      worldPosition.current.x = snapValue(worldPosition.current.x);
      worldPosition.current.y = snapValue(worldPosition.current.y);
      worldPosition.current.z = snapValue(worldPosition.current.z);
    }

    // Apply transform
    ref.current.position.copy(worldPosition.current);
    if (!lockRotation) {
      ref.current.quaternion.copy(worldQuaternion.current);
    }

    // Maintain original scale
    ref.current.scale.copy(initialScale.current);

    // Callback
    onMove?.(worldPosition.current, worldQuaternion.current);
  });

  // Hover detection
  useFrame(() => {
    if (!enabled || isGrabbed || !ref.current || !session) return;

    let newHovered = false;

    // Check all controllers for hover
    controllers.forEach((controller: any, handedness: any) => {
      // Get ray direction
      tempMatrix.current.identity();
      tempMatrix.current.extractRotation(controller.controller.matrixWorld);
      tempDirection.current.set(0, 0, -1);
      tempDirection.current.applyMatrix4(tempMatrix.current);

      // Set up raycaster
      raycaster.current.set(
        controller.controller.position,
        tempDirection.current,
      );
      const intersects = raycaster.current.intersectObject(ref.current!, true);

      if (intersects.length > 0) {
        newHovered = true;

        if (!isHovered && hoverHaptic > 0) {
          applyHapticFeedback(handedness as "left" | "right", hoverHaptic, 20);
        }
      }
    });

    setIsHovered(newHovered);
  });

  return {
    isGrabbed,
    grabbedBy,
    isHovered,
    // Export store for external XR management
    xrStore: store,
  };
}
