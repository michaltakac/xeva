// XR example demonstrating XEVA controls in VR/AR
// XR docs: https://pmndrs.github.io/xr/docs/

import React, { useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { XR, createXRStore } from '@react-three/xr'
import { Environment } from '@react-three/drei'
import { XRPanel, XRHUDPanel, useXRControls } from 'xeva'
import * as THREE from 'three'

const xrStore = createXRStore()

function InteractiveObject() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  const {
    color,
    emissive,
    emissiveIntensity,
    roughness,
    metalness,
    size,
    shape,
    animate
  } = useXRControls('Object Settings', {
    appearance: {
      folder: {
        color: '#00ff88',
        emissive: '#ff0066',
        emissiveIntensity: { value: 0.2, min: 0, max: 1, step: 0.01 },
        roughness: { value: 0.3, min: 0, max: 1, step: 0.01 },
        metalness: { value: 0.7, min: 0, max: 1, step: 0.01 }
      },
      collapsed: false
    },
    geometry: {
      folder: {
        size: { value: 0.5, min: 0.1, max: 2, step: 0.1 },
        shape: { 
          value: 'sphere', 
          options: {
            'Sphere': 'sphere',
            'Box': 'box',
            'Torus': 'torus',
            'Cone': 'cone'
          }
        }
      }
    },
    animate: true
  })
  
  React.useEffect(() => {
    if (!animate || !meshRef.current) return
    
    const animateObject = () => {
      if (!meshRef.current) return
      meshRef.current.rotation.y += 0.01
      meshRef.current.rotation.x += 0.005
      requestAnimationFrame(animateObject)
    }
    
    const id = requestAnimationFrame(animateObject)
    return () => cancelAnimationFrame(id)
  }, [animate])
  
  const geometryProps = {
    sphere: <sphereGeometry args={[size, 32, 32]} />,
    box: <boxGeometry args={[size, size, size]} />,
    torus: <torusGeometry args={[size, size * 0.4, 16, 100]} />,
    cone: <coneGeometry args={[size, size * 1.5, 32]} />
  }
  
  return (
    <mesh ref={meshRef} position={[0, 1.5, -2]}>
      {geometryProps[shape as keyof typeof geometryProps]}
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        roughness={roughness}
        metalness={metalness}
      />
    </mesh>
  )
}

function XRScene() {
  const {
    groundColor,
    fogDensity,
    showGrid,
    showStats
  } = useXRControls('Environment', {
    groundColor: '#1a1a2e',
    fogDensity: { value: 0.02, min: 0, max: 0.1, step: 0.001 },
    showGrid: true,
    showStats: false
  })
  
  return (
    <>
      <fog attach="fog" args={[groundColor, 0, fogDensity ? 1 / fogDensity : 100]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      
      {showGrid && (
        <gridHelper args={[10, 10, '#444', '#222']} position={[0, 0, 0]} />
      )}
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color={groundColor} />
      </mesh>
      
      <InteractiveObject />
      
      {/* World-anchored panel */}
      <XRPanel
        position={[-1.5, 1.5, -2]}
        width={400}
        height={450}
        billboard={true}
      />
      
      {/* HUD panel that follows the camera */}
      <XRHUDPanel
        offset={[0.8, -0.3, -1.5]}
        width={300}
        height={200}
      >
        {/* This panel will show environment controls */}
      </XRHUDPanel>
    </>
  )
}

export default function App() {
  const [xrMode, setXrMode] = useState<'none' | 'vr' | 'ar'>('none')
  
  return (
    <>
      <div className="xr-buttons">
        <button
          className="xr-button"
          onClick={() => {
            xrStore.enterVR()
            setXrMode('vr')
          }}
          disabled={xrMode !== 'none'}
        >
          Enter VR
        </button>
        <button
          className="xr-button"
          onClick={() => {
            xrStore.enterAR()
            setXrMode('ar')
          }}
          disabled={xrMode !== 'none'}
        >
          Enter AR
        </button>
      </div>
      
      <Canvas>
        <XR store={xrStore}>
          <XRScene />
          <Environment preset="sunset" />
        </XR>
      </Canvas>
    </>
  )
}