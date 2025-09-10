import React, { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Sky, Environment, Stats } from '@react-three/drei'
import { useXRControls, XRPanel } from 'xeva'
import * as THREE from 'three'

// Simple rotating box with XEVA controls
function ControlledBox() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  const { 
    color,
    size,
    rotationSpeed,
    metalness,
    roughness
  } = useXRControls('Box Controls', {
    color: { value: '#ff6030' },
    size: { value: 2, min: 0.5, max: 5, step: 0.1 },
    rotationSpeed: { value: 1, min: 0, max: 5, step: 0.1 },
    metalness: { value: 0.5, min: 0, max: 1, step: 0.01 },
    roughness: { value: 0.5, min: 0, max: 1, step: 0.01 }
  })

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * rotationSpeed * 0.5
      meshRef.current.rotation.y += delta * rotationSpeed
    }
  })

  return (
    <mesh ref={meshRef} position={[0, 0, 0]} castShadow receiveShadow>
      <boxGeometry args={[size, size, size]} />
      <meshStandardMaterial 
        color={color}
        metalness={metalness}
        roughness={roughness}
      />
    </mesh>
  )
}

// Scene component containing all 3D objects
function Scene() {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1} 
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      
      {/* Environment and Sky */}
      <Sky 
        distance={450000}
        sunPosition={[0, 1, 0]}
        inclination={0}
        azimuth={0.25}
      />
      <Environment preset="sunset" />
      
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      
      {/* Grid Helper */}
      <gridHelper args={[20, 20, '#444', '#222']} position={[0, -1.99, 0]} />
      
      {/* Main controlled object */}
      <ControlledBox />
      
      {/* XEVA Control Panel positioned in 3D space */}
      <XRPanel 
        position={[4, 0, 0]}
        width={3}
        height={4}
      />
    </>
  )
}

// Main App component
function WorkingApp() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas
        shadows
        camera={{ position: [5, 3, 5], fov: 60 }}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
        
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          makeDefault
        />
        
        <Stats />
      </Canvas>
    </div>
  )
}

export default WorkingApp