import React from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useXRControls, XRPanel } from 'xeva'

function SimpleScene() {
  const { 
    color,
    size,
    rotationSpeed
  } = useXRControls('Test Controls', {
    color: { value: '#ff6030' },
    size: { value: 1, min: 0.5, max: 3, step: 0.1 },
    rotationSpeed: { value: 0.01, min: 0, max: 0.1, step: 0.01 }
  })

  return (
    <>
      {/* Basic lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 10]} intensity={1} />
      
      {/* Simple rotating cube */}
      <mesh rotation-y={Date.now() * 0.001 * rotationSpeed}>
        <boxGeometry args={[size, size, size]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* XEVA Control Panel */}
      <XRPanel position={[3, 0, 0]} />
    </>
  )
}

function AppSimple() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1a1a1a' }}>
      <Canvas camera={{ position: [5, 5, 5] }}>
        <SimpleScene />
        <OrbitControls />
      </Canvas>
    </div>
  )
}

export default AppSimple