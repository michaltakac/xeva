// XR HUD panel - camera-locked: https://pmndrs.github.io/xr/docs/

import React from "react";
import { useFrame } from "@react-three/fiber";
import { XRPanel } from "./XRPanel";
import type { XRHUDPanelProps } from "../core/types";
import * as THREE from "three";

export function XRHUDPanel({ offset = [0, 0, -2], ...props }: XRHUDPanelProps) {
  const groupRef = React.useRef<THREE.Group>(null);

  // Lock to camera position with offset
  useFrame(({ camera }) => {
    if (groupRef.current) {
      // Set position relative to camera
      groupRef.current.position.copy(camera.position);
      groupRef.current.quaternion.copy(camera.quaternion);

      // Apply offset in camera space
      const offsetVector = new THREE.Vector3(...offset);
      offsetVector.applyQuaternion(camera.quaternion);
      groupRef.current.position.add(offsetVector);
    }
  });

  return (
    <group ref={groupRef}>
      <XRPanel {...props} position={[0, 0, 0]} billboard={true} />
    </group>
  );
}
