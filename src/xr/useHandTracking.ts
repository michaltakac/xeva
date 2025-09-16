import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useXR } from "@react-three/xr";
import * as THREE from "three";
import { forEachController } from "./controllerUtils";

// Hand joint indices based on WebXR Hand Input spec
const HAND_JOINTS = {
  WRIST: 0,
  THUMB_METACARPAL: 1,
  THUMB_PHALANX_PROXIMAL: 2,
  THUMB_PHALANX_DISTAL: 3,
  THUMB_TIP: 4,
  INDEX_METACARPAL: 5,
  INDEX_PHALANX_PROXIMAL: 6,
  INDEX_PHALANX_INTERMEDIATE: 7,
  INDEX_PHALANX_DISTAL: 8,
  INDEX_TIP: 9,
  MIDDLE_METACARPAL: 10,
  MIDDLE_PHALANX_PROXIMAL: 11,
  MIDDLE_PHALANX_INTERMEDIATE: 12,
  MIDDLE_PHALANX_DISTAL: 13,
  MIDDLE_TIP: 14,
  RING_METACARPAL: 15,
  RING_PHALANX_PROXIMAL: 16,
  RING_PHALANX_INTERMEDIATE: 17,
  RING_PHALANX_DISTAL: 18,
  RING_TIP: 19,
  PINKY_METACARPAL: 20,
  PINKY_PHALANX_PROXIMAL: 21,
  PINKY_PHALANX_INTERMEDIATE: 22,
  PINKY_PHALANX_DISTAL: 23,
  PINKY_TIP: 24,
};

interface HandGesture {
  type: "pinch" | "point" | "fist" | "open" | "thumbsUp" | "peace";
  confidence: number;
}

interface HandTrackingOptions {
  enabled?: boolean;
  gestures?: {
    pinch?: boolean;
    point?: boolean;
    fist?: boolean;
    open?: boolean;
    thumbsUp?: boolean;
    peace?: boolean;
  };
  visualFeedback?: {
    showSkeleton?: boolean;
    showRaycast?: boolean;
    highlightOnHover?: boolean;
    cursorType?: "ring" | "dot" | "sphere";
  };
  pinchThreshold?: number;
  onPinchStart?: (hand: "left" | "right", position: THREE.Vector3) => void;
  onPinchEnd?: (hand: "left" | "right") => void;
  onPinchMove?: (hand: "left" | "right", position: THREE.Vector3) => void;
  onPointStart?: (hand: "left" | "right", direction: THREE.Vector3) => void;
  onPointEnd?: (hand: "left" | "right") => void;
  onGestureDetected?: (hand: "left" | "right", gesture: HandGesture) => void;
}

export function useHandTracking(
  ref: React.RefObject<THREE.Group | null>,
  options: HandTrackingOptions = {},
) {
  const {
    enabled = true,
    gestures = {
      pinch: true,
      point: true,
      fist: false,
      open: false,
      thumbsUp: false,
      peace: false,
    },
    visualFeedback = {
      showSkeleton: false,
      showRaycast: true,
      highlightOnHover: true,
      cursorType: "ring",
    },
    pinchThreshold = 0.02, // 2cm threshold for pinch detection
    onPinchStart,
    onPinchEnd,
    onPinchMove,
    onPointStart,
    onPointEnd,
    onGestureDetected,
  } = options;

  // const store = useXRStore()
  const session = useXR((state) => state.session);
  const hands = useXR((state) => (state as any).hands);

  const [leftPinching, setLeftPinching] = useState(false);
  const [rightPinching, setRightPinching] = useState(false);
  const [leftPointing, setLeftPointing] = useState(false);
  const [rightPointing, setRightPointing] = useState(false);
  const [hoveredHand, setHoveredHand] = useState<"left" | "right" | null>(null);
  const [grabbedByHand, setGrabbedByHand] = useState<"left" | "right" | null>(
    null,
  );

  const pinchPositions = useRef({
    left: new THREE.Vector3(),
    right: new THREE.Vector3(),
  });
  const pointDirections = useRef({
    left: new THREE.Vector3(),
    right: new THREE.Vector3(),
  });
  const grabOffset = useRef(new THREE.Matrix4());
  const tempVector = useRef(new THREE.Vector3());
  const tempVector2 = useRef(new THREE.Vector3());
  const raycaster = useRef(new THREE.Raycaster());

  // Calculate pinch distance between thumb tip and index tip
  const calculatePinchDistance = (hand: THREE.XRHandSpace): number => {
    if (!hand.joints) return Infinity;

    const thumbTip = (hand.joints as any)[HAND_JOINTS.THUMB_TIP];
    const indexTip = (hand.joints as any)[HAND_JOINTS.INDEX_TIP];

    if (!thumbTip || !indexTip) return Infinity;

    thumbTip.getWorldPosition(tempVector.current);
    indexTip.getWorldPosition(tempVector2.current);

    return tempVector.current.distanceTo(tempVector2.current);
  };

  // Calculate pointing direction from index finger
  const calculatePointDirection = (hand: THREE.XRHandSpace): THREE.Vector3 => {
    const direction = new THREE.Vector3(0, 0, -1);

    if (!hand.joints) return direction;

    const indexTip = (hand.joints as any)[HAND_JOINTS.INDEX_TIP];
    const indexProximal = (hand.joints as any)[
      HAND_JOINTS.INDEX_PHALANX_PROXIMAL
    ];

    if (!indexTip || !indexProximal) return direction;

    indexTip.getWorldPosition(tempVector.current);
    indexProximal.getWorldPosition(tempVector2.current);

    direction.subVectors(tempVector.current, tempVector2.current).normalize();

    return direction;
  };

  // Detect hand gestures
  const detectGesture = (hand: THREE.XRHandSpace): HandGesture | null => {
    if (!hand.joints) return null;

    const pinchDist = calculatePinchDistance(hand);

    // Pinch gesture
    if (gestures.pinch && pinchDist < pinchThreshold) {
      return { type: "pinch", confidence: 1 - pinchDist / pinchThreshold };
    }

    // Point gesture - index extended, others curled
    if (gestures.point) {
      const indexTip = (hand.joints as any)[HAND_JOINTS.INDEX_TIP];
      const indexBase = (hand.joints as any)[HAND_JOINTS.INDEX_METACARPAL];
      const middleTip = (hand.joints as any)[HAND_JOINTS.MIDDLE_TIP];
      const middleBase = (hand.joints as any)[HAND_JOINTS.MIDDLE_METACARPAL];

      if (indexTip && indexBase && middleTip && middleBase) {
        indexTip.getWorldPosition(tempVector.current);
        indexBase.getWorldPosition(tempVector2.current);
        const indexExtended = tempVector.current.distanceTo(
          tempVector2.current,
        );

        middleTip.getWorldPosition(tempVector.current);
        middleBase.getWorldPosition(tempVector2.current);
        const middleExtended = tempVector.current.distanceTo(
          tempVector2.current,
        );

        if (indexExtended > middleExtended * 1.3) {
          return { type: "point", confidence: 0.8 };
        }
      }
    }

    // Additional gestures can be added here
    // Fist: all fingers curled
    // Open: all fingers extended
    // ThumbsUp: thumb extended, others curled
    // Peace: index and middle extended, others curled

    return null;
  };

  // Get pinch position (midpoint between thumb and index tips)
  const getPinchPosition = (hand: THREE.XRHandSpace): THREE.Vector3 => {
    const position = new THREE.Vector3();

    if (!hand.joints) return position;

    const thumbTip = (hand.joints as any)[HAND_JOINTS.THUMB_TIP];
    const indexTip = (hand.joints as any)[HAND_JOINTS.INDEX_TIP];

    if (thumbTip && indexTip) {
      thumbTip.getWorldPosition(tempVector.current);
      indexTip.getWorldPosition(tempVector2.current);
      position
        .addVectors(tempVector.current, tempVector2.current)
        .multiplyScalar(0.5);
    }

    return position;
  };

  // Handle pinch grab interaction
  useFrame(() => {
    if (!enabled || !session || !ref.current) return;

    forEachController(hands, (hand: any, handedness: any) => {
      const handStr = handedness as "left" | "right";
      const isPinching = handStr === "left" ? leftPinching : rightPinching;
      const wasPointing = handStr === "left" ? leftPointing : rightPointing;

      // Detect current gesture
      const gesture = detectGesture(hand);

      if (gesture) {
        onGestureDetected?.(handStr, gesture);

        // Handle pinch gesture
        if (gesture.type === "pinch") {
          const pinchPos = getPinchPosition(hand);
          pinchPositions.current[handStr].copy(pinchPos);

          if (!isPinching) {
            // Pinch started
            if (handStr === "left") setLeftPinching(true);
            else setRightPinching(true);

            onPinchStart?.(handStr, pinchPos);

            // Check if pinching near the panel to grab it
            if (!grabbedByHand && ref.current) {
              const distance = pinchPos.distanceTo(ref.current.position);
              if (distance < 0.5) {
                // Within grab range
                // Calculate grab offset
                const handMatrix = new THREE.Matrix4();
                hand.matrixWorld.decompose(
                  tempVector.current,
                  new THREE.Quaternion(),
                  new THREE.Vector3(),
                );
                handMatrix.setPosition(pinchPos);
                handMatrix.invert();
                handMatrix.multiply(ref.current.matrixWorld);
                grabOffset.current.copy(handMatrix);

                setGrabbedByHand(handStr);
              }
            }
          } else {
            // Pinch continuing
            onPinchMove?.(handStr, pinchPos);

            // Update grabbed panel position
            if (grabbedByHand === handStr && ref.current) {
              const handMatrix = new THREE.Matrix4();
              hand.matrixWorld.decompose(
                tempVector.current,
                new THREE.Quaternion(),
                new THREE.Vector3(),
              );
              handMatrix.setPosition(pinchPos);
              handMatrix.multiply(grabOffset.current);

              handMatrix.decompose(
                ref.current.position,
                ref.current.quaternion,
                ref.current.scale,
              );
            }
          }
        } else if (isPinching) {
          // Pinch ended
          if (handStr === "left") setLeftPinching(false);
          else setRightPinching(false);

          onPinchEnd?.(handStr);

          // Release grabbed panel
          if (grabbedByHand === handStr) {
            setGrabbedByHand(null);
          }
        }

        // Handle point gesture
        if (gesture.type === "point") {
          const pointDir = calculatePointDirection(hand);
          pointDirections.current[handStr].copy(pointDir);

          if (!wasPointing) {
            // Point started
            if (handStr === "left") setLeftPointing(true);
            else setRightPointing(true);

            onPointStart?.(handStr, pointDir);
          }

          // Check for hover with raycast
          if (visualFeedback.highlightOnHover && ref.current) {
            const indexTip = (hand.joints as any)[HAND_JOINTS.INDEX_TIP];
            if (indexTip) {
              indexTip.getWorldPosition(tempVector.current);
              raycaster.current.set(tempVector.current, pointDir);
              const intersects = raycaster.current.intersectObject(
                ref.current,
                true,
              );

              if (intersects.length > 0) {
                setHoveredHand(handStr);
              } else if (hoveredHand === handStr) {
                setHoveredHand(null);
              }
            }
          }
        } else if (wasPointing) {
          // Point ended
          if (handStr === "left") setLeftPointing(false);
          else setRightPointing(false);

          onPointEnd?.(handStr);

          if (hoveredHand === handStr) {
            setHoveredHand(null);
          }
        }
      } else {
        // No gesture detected, reset states if needed
        if (isPinching) {
          if (handStr === "left") setLeftPinching(false);
          else setRightPinching(false);
          onPinchEnd?.(handStr);
        }
        if (wasPointing) {
          if (handStr === "left") setLeftPointing(false);
          else setRightPointing(false);
          onPointEnd?.(handStr);
        }
        if (grabbedByHand === handStr) {
          setGrabbedByHand(null);
        }
        if (hoveredHand === handStr) {
          setHoveredHand(null);
        }
      }
    });
  });

  return {
    leftPinching,
    rightPinching,
    leftPointing,
    rightPointing,
    hoveredHand,
    grabbedByHand,
    // Expose current positions/directions for visualization
    pinchPositions: pinchPositions.current,
    pointDirections: pointDirections.current,
  };
}
