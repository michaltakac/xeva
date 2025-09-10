// Basic R3F example demonstrating XEVA controls
// R3F: https://r3f.docs.pmnd.rs/getting-started/introduction

import React, { useRef, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Grid, ContactShadows } from '@react-three/drei'
import { XRPanel, useXRControls } from 'xeva'
import * as THREE from 'three'

function DemoBox() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  const { 
    // Appearance
    color, 
    emissive,
    emissiveIntensity,
    roughness, 
    metalness,
    wireframe,
    opacity,
    transparent,
    
    // Transform
    positionX,
    positionY,
    positionZ,
    rotationX,
    rotationY,
    rotationZ,
    scale,
    
    // Animation
    autoRotate,
    rotateSpeed,
    bounce,
    bounceHeight,
    
    // Actions
    reset,
    randomize
  } = useXRControls('Kitchen Sink Demo', {
    '🎨 Appearance': {
      folder: {
        color: { value: '#ff6030', label: 'Base Color' },
        emissive: { value: '#000000', label: 'Emissive Color' },
        emissiveIntensity: { value: 0.1, min: 0, max: 2, step: 0.01 },
        roughness: { value: 0.4, min: 0, max: 1, step: 0.01 },
        metalness: { value: 0.6, min: 0, max: 1, step: 0.01 },
        opacity: { value: 1, min: 0, max: 1, step: 0.01 },
        transparent: false,
        wireframe: false
      },
      collapsed: false
    },
    
    '📐 Transform': {
      folder: {
        positionX: { value: 0, min: -5, max: 5, step: 0.1, label: 'Position X' },
        positionY: { value: 0, min: -5, max: 5, step: 0.1, label: 'Position Y' },
        positionZ: { value: 0, min: -5, max: 5, step: 0.1, label: 'Position Z' },
        rotationX: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01, label: 'Rotation X' },
        rotationY: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01, label: 'Rotation Y' },
        rotationZ: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01, label: 'Rotation Z' },
        scale: { value: 1, min: 0.1, max: 3, step: 0.01 }
      },
      collapsed: true
    },
    
    '🎬 Animation': {
      folder: {
        autoRotate: { value: true, label: 'Auto Rotate' },
        rotateSpeed: { value: 1, min: 0, max: 5, step: 0.1, label: 'Rotation Speed' },
        bounce: { value: false, label: 'Bounce Animation' },
        bounceHeight: { value: 0.5, min: 0, max: 2, step: 0.1, label: 'Bounce Height' }
      },
      collapsed: false
    },
    
    '⚡ Actions': {
      folder: {
        reset: () => {
          console.log('Reset clicked!')
          if (meshRef.current) {
            meshRef.current.rotation.set(0, 0, 0)
            meshRef.current.position.set(0, 0, 0)
            meshRef.current.scale.setScalar(1)
          }
        },
        randomize: () => {
          console.log('Randomize clicked!')
          // This would need to update the store values
          // For now just log
        }
      },
      collapsed: false
    }
  })
  
  // Apply animations
  useEffect(() => {
    if (!meshRef.current) return
    
    const animate = () => {
      if (!meshRef.current) return
      
      const time = Date.now() * 0.001
      
      // Auto rotation
      if (autoRotate) {
        meshRef.current.rotation.y += 0.01 * rotateSpeed
      }
      
      // Bounce animation
      if (bounce) {
        meshRef.current.position.y = positionY + Math.sin(time * 2) * bounceHeight
      } else {
        meshRef.current.position.y = positionY
      }
      
      requestAnimationFrame(animate)
    }
    
    const id = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(id)
  }, [autoRotate, rotateSpeed, bounce, bounceHeight, positionY])
  
  // Apply transform
  useEffect(() => {
    if (!meshRef.current) return
    meshRef.current.position.x = positionX
    meshRef.current.position.z = positionZ
    meshRef.current.rotation.x = rotationX
    meshRef.current.rotation.y = rotationY
    meshRef.current.rotation.z = rotationZ
    meshRef.current.scale.setScalar(scale)
  }, [positionX, positionZ, rotationX, rotationY, rotationZ, scale])
  
  return (
    <mesh 
      ref={meshRef}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial 
        color={color}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        roughness={roughness}
        metalness={metalness}
        wireframe={wireframe}
        opacity={opacity}
        transparent={transparent}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function Scene() {
  const { 
    // Lighting
    lightIntensity,
    lightColor,
    ambientIntensity,
    lightX,
    lightY,
    lightZ,
    shadows,
    
    // Background
    backgroundColor,
    fogColor,
    fogNear,
    fogFar,
    
    // Grid
    showGrid,
    gridSize,
    
    // Camera
    fov,
    near,
    far
  } = useXRControls('Scene Settings', {
    '💡 Lighting': {
      folder: {
        lightIntensity: { value: 1, min: 0, max: 3, step: 0.1 },
        lightColor: '#ffffff',
        ambientIntensity: { value: 0.5, min: 0, max: 2, step: 0.1 },
        lightX: { value: 5, min: -10, max: 10, step: 0.5 },
        lightY: { value: 5, min: -10, max: 10, step: 0.5 },
        lightZ: { value: 5, min: -10, max: 10, step: 0.5 },
        shadows: true
      },
      collapsed: false
    },
    
    '🌍 Background': {
      folder: {
        backgroundColor: { value: '#0a0a0a', label: 'Background Color' },
        fogColor: { value: '#000000', label: 'Fog Color' },
        fogNear: { value: 10, min: 0, max: 50, step: 1 },
        fogFar: { value: 50, min: 10, max: 200, step: 1 }
      },
      collapsed: true
    },
    
    '📏 Display': {
      folder: {
        showGrid: true,
        gridSize: { value: 10, min: 5, max: 50, step: 5 }
      },
      collapsed: true
    },
    
    '📷 Camera': {
      folder: {
        fov: { value: 50, min: 20, max: 120, step: 1 },
        near: { value: 0.1, min: 0.01, max: 1, step: 0.01 },
        far: { value: 100, min: 10, max: 1000, step: 10 }
      },
      collapsed: true
    }
  })
  
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={ambientIntensity} />
      <directionalLight 
        position={[lightX, lightY, lightZ]}
        intensity={lightIntensity}
        color={lightColor}
        castShadow={shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      
      {/* Additional lights for better illumination */}
      <pointLight position={[10, 10, 10]} intensity={0.5} />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#ff6030" />
      
      {/* Fog */}
      <fog attach="fog" args={[fogColor, fogNear, fogFar]} />
      
      {/* Grid */}
      {showGrid && (
        <Grid 
          args={[gridSize, gridSize]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor="#6e6e6e"
          sectionSize={2}
          sectionThickness={1}
          sectionColor="#9d9d9d"
          fadeDistance={30}
          fadeStrength={1}
          followCamera={false}
          infiniteGrid={true}
        />
      )}
      
      {/* Contact shadows */}
      <ContactShadows 
        position={[0, -1.5, 0]}
        opacity={0.5}
        scale={10}
        blur={2}
        far={4}
      />
      
      {/* Main object */}
      <DemoBox />
    </>
  )
}

export default function App() {
  const [panelSide, setPanelSide] = useState<'left' | 'right'>('left')
  
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      {/* Controls for panel position */}
      <div style={{ 
        position: 'absolute', 
        top: 10, 
        left: '50%', 
        transform: 'translateX(-50%)',
        zIndex: 100,
        display: 'flex',
        gap: '10px'
      }}>
        <button 
          onClick={() => setPanelSide('left')}
          style={{
            padding: '8px 16px',
            background: panelSide === 'left' ? '#ff6030' : '#333',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Panel Left
        </button>
        <button 
          onClick={() => setPanelSide('right')}
          style={{
            padding: '8px 16px',
            background: panelSide === 'right' ? '#ff6030' : '#333',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Panel Right
        </button>
      </div>
      
      <Canvas shadows gl={{ antialias: true, alpha: false }}>
        <PerspectiveCamera makeDefault position={[5, 5, 10]} />
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
        />
        
        {/* XEVA Control Panel - Double sided material */}
        <XRPanel 
          position={[panelSide === 'left' ? -5 : 5, 0, 0]}
          width={3}
          height={4}
          billboard={false}
        />
        
        <Scene />
      </Canvas>
    </div>
  )
}