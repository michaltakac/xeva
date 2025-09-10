// XEVA 3D UI Kitchen Sink Demo
// Comprehensive showcase of XEVA controls in a React Three Fiber environment

import React, { useRef, useState, useEffect, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { 
  OrbitControls, 
  PerspectiveCamera, 
  ContactShadows,
  Environment,
  Float,
  MeshReflectorMaterial,
  Text,
  Center,
  RoundedBox,
  Sphere,
  Torus,
  Cone,
  Cylinder,
  useMatcapTexture,
  useTexture,
  Stage
} from '@react-three/drei'
import { XRPanel, useXRControls } from 'xeva'
import * as THREE from 'three'

// Interactive Hero Object with comprehensive controls
function HeroObject() {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshStandardMaterial>(null)
  
  const { 
    // Geometry
    geometryType,
    wireframe,
    segments,
    
    // Material Properties
    color, 
    emissive,
    emissiveIntensity,
    roughness, 
    metalness,
    opacity,
    transparent,
    side,
    
    // Advanced Material
    clearcoat,
    clearcoatRoughness,
    reflectivity,
    envMapIntensity,
    
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
    float,
    floatIntensity,
    floatSpeed,
    pulse,
    pulseScale,
    
    // Actions
    reset,
    randomize,
    exportSettings
  } = useXRControls('🎨 Hero Object', {
    '🔷 Geometry': {
      folder: {
        geometryType: {
          value: 'box',
          options: ['box', 'sphere', 'torus', 'cone', 'cylinder', 'dodecahedron']
        },
        segments: { value: 32, min: 3, max: 64, step: 1 },
        wireframe: false
      },
      collapsed: false
    },
    
    '🎨 Material': {
      folder: {
        color: { value: '#ff6030', label: 'Base Color' },
        emissive: { value: '#000000', label: 'Emissive' },
        emissiveIntensity: { value: 0.2, min: 0, max: 2, step: 0.01 },
        roughness: { value: 0.3, min: 0, max: 1, step: 0.01 },
        metalness: { value: 0.7, min: 0, max: 1, step: 0.01 },
        opacity: { value: 1, min: 0, max: 1, step: 0.01 },
        transparent: false,
        side: { value: 'front', options: ['front', 'back', 'double'] }
      },
      collapsed: false
    },
    
    '✨ Advanced': {
      folder: {
        clearcoat: { value: 0.5, min: 0, max: 1, step: 0.01 },
        clearcoatRoughness: { value: 0.1, min: 0, max: 1, step: 0.01 },
        reflectivity: { value: 0.5, min: 0, max: 1, step: 0.01 },
        envMapIntensity: { value: 1, min: 0, max: 3, step: 0.1 }
      },
      collapsed: true
    },
    
    '📐 Transform': {
      folder: {
        positionX: { value: 0, min: -5, max: 5, step: 0.1 },
        positionY: { value: 2, min: -5, max: 5, step: 0.1 },
        positionZ: { value: 0, min: -5, max: 5, step: 0.1 },
        rotationX: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
        rotationY: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
        rotationZ: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
        scale: { value: 1, min: 0.1, max: 3, step: 0.01 }
      },
      collapsed: true
    },
    
    '🎬 Animation': {
      folder: {
        autoRotate: { value: true, label: 'Auto Rotate' },
        rotateSpeed: { value: 1, min: -5, max: 5, step: 0.1 },
        float: { value: true, label: 'Float Effect' },
        floatIntensity: { value: 1, min: 0, max: 5, step: 0.1 },
        floatSpeed: { value: 1, min: 0, max: 5, step: 0.1 },
        pulse: { value: false, label: 'Pulse Effect' },
        pulseScale: { value: 0.1, min: 0, max: 0.5, step: 0.01 }
      },
      collapsed: false
    },
    
    '⚡ Actions': {
      folder: {
        reset: {
          label: '🔄 Reset All',
          value: () => {
            if (meshRef.current) {
              meshRef.current.rotation.set(0, 0, 0)
              meshRef.current.position.set(0, 2, 0)
              meshRef.current.scale.setScalar(1)
            }
          }
        },
        randomize: {
          label: '🎲 Randomize',
          value: () => {
            if (materialRef.current) {
              materialRef.current.color.setHex(Math.random() * 0xffffff)
              materialRef.current.roughness = Math.random()
              materialRef.current.metalness = Math.random()
            }
          }
        },
        exportSettings: {
          label: '💾 Export Settings',
          value: () => {
            const settings = {
              geometry: geometryType,
              material: {
                color, roughness, metalness, emissive, emissiveIntensity
              },
              transform: {
                position: [positionX, positionY, positionZ],
                rotation: [rotationX, rotationY, rotationZ],
                scale
              }
            }
            console.log('Exported settings:', settings)
            alert('Settings exported to console!')
          }
        }
      },
      collapsed: false
    }
  })
  
  // Geometry selection
  const geometry = useMemo(() => {
    switch(geometryType) {
      case 'sphere':
        return <sphereGeometry args={[1.5, segments, segments]} />
      case 'torus':
        return <torusGeometry args={[1.2, 0.5, segments, segments]} />
      case 'cone':
        return <coneGeometry args={[1.2, 2, segments]} />
      case 'cylinder':
        return <cylinderGeometry args={[1, 1, 2, segments]} />
      case 'dodecahedron':
        return <dodecahedronGeometry args={[1.5, 0]} />
      default:
        return <boxGeometry args={[2, 2, 2, segments, segments, segments]} />
    }
  }, [geometryType, segments])
  
  // Material side mapping
  const sideMap = {
    'front': THREE.FrontSide,
    'back': THREE.BackSide,
    'double': THREE.DoubleSide
  }
  
  // Animation frame
  useFrame((state) => {
    if (!meshRef.current) return
    
    const time = state.clock.getElapsedTime()
    
    // Auto rotation
    if (autoRotate) {
      meshRef.current.rotation.y += 0.01 * rotateSpeed
    }
    
    // Float effect
    if (float) {
      meshRef.current.position.y = positionY + Math.sin(time * floatSpeed) * 0.3 * floatIntensity
    } else {
      meshRef.current.position.y = positionY
    }
    
    // Pulse effect
    if (pulse) {
      const pulseValue = 1 + Math.sin(time * 3) * pulseScale
      meshRef.current.scale.setScalar(scale * pulseValue)
    } else {
      meshRef.current.scale.setScalar(scale)
    }
  })
  
  // Apply static transforms
  useEffect(() => {
    if (!meshRef.current) return
    meshRef.current.position.x = positionX
    meshRef.current.position.z = positionZ
    meshRef.current.rotation.x = rotationX
    meshRef.current.rotation.z = rotationZ
  }, [positionX, positionZ, rotationX, rotationZ])
  
  return (
    <mesh 
      ref={meshRef}
      castShadow
      receiveShadow
    >
      {geometry}
      <meshPhysicalMaterial 
        ref={materialRef}
        color={color}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        roughness={roughness}
        metalness={metalness}
        wireframe={wireframe}
        opacity={opacity}
        transparent={transparent}
        side={sideMap[side]}
        clearcoat={clearcoat}
        clearcoatRoughness={clearcoatRoughness}
        reflectivity={reflectivity}
        envMapIntensity={envMapIntensity}
      />
    </mesh>
  )
}

// Particle System with controls
function ParticleSystem() {
  const pointsRef = useRef<THREE.Points>(null)
  const { scene } = useThree()
  
  const {
    particleCount,
    particleSize,
    particleColor,
    spread,
    rotationSpeed,
    waveEffect,
    waveAmplitude,
    visible
  } = useXRControls('✨ Particle System', {
    'Particles': {
      folder: {
        visible: { value: true, label: 'Show Particles' },
        particleCount: { value: 500, min: 100, max: 2000, step: 100 },
        particleSize: { value: 0.05, min: 0.01, max: 0.2, step: 0.01 },
        particleColor: { value: '#ffaa00', label: 'Color' },
        spread: { value: 10, min: 5, max: 20, step: 1 },
        rotationSpeed: { value: 0.5, min: 0, max: 2, step: 0.1 },
        waveEffect: { value: true, label: 'Wave Effect' },
        waveAmplitude: { value: 2, min: 0, max: 5, step: 0.1 }
      },
      collapsed: false
    }
  })
  
  // Generate particles
  const particles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * spread
      positions[i * 3 + 1] = Math.random() * spread
      positions[i * 3 + 2] = (Math.random() - 0.5) * spread
    }
    return positions
  }, [particleCount, spread])
  
  useFrame((state) => {
    if (!pointsRef.current || !visible) return
    
    const time = state.clock.getElapsedTime()
    pointsRef.current.rotation.y = time * rotationSpeed * 0.1
    
    if (waveEffect) {
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3
        positions[i3 + 1] = Math.sin(time + i * 0.01) * waveAmplitude + Math.random() * spread
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true
    }
  })
  
  if (!visible) return null
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length / 3}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial 
        size={particleSize}
        color={particleColor}
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  )
}

// Scene Environment Controls
function SceneEnvironment() {
  const { 
    // Lighting
    directionalIntensity,
    directionalColor,
    ambientIntensity,
    lightX,
    lightY,
    lightZ,
    shadows,
    
    // Environment
    preset,
    background,
    blur,
    
    // Effects
    fog,
    fogColor,
    fogNear,
    fogFar,
    
    // Grid
    showGrid,
    gridSize,
    gridDivisions,
    
    // Helpers
    showAxes,
    showStats
  } = useXRControls('🌍 Environment', {
    '💡 Lighting': {
      folder: {
        directionalIntensity: { value: 1.5, min: 0, max: 5, step: 0.1 },
        directionalColor: '#ffffff',
        ambientIntensity: { value: 0.4, min: 0, max: 2, step: 0.1 },
        lightX: { value: 5, min: -10, max: 10, step: 0.5 },
        lightY: { value: 8, min: 0, max: 20, step: 0.5 },
        lightZ: { value: 5, min: -10, max: 10, step: 0.5 },
        shadows: true
      },
      collapsed: false
    },
    
    '🏞️ Environment': {
      folder: {
        preset: {
          value: 'sunset',
          options: ['sunset', 'dawn', 'night', 'warehouse', 'forest', 'apartment', 'studio', 'city', 'park', 'lobby']
        },
        background: { value: true, label: 'Show Background' },
        blur: { value: 0.1, min: 0, max: 1, step: 0.01 }
      },
      collapsed: false
    },
    
    '🌫️ Atmosphere': {
      folder: {
        fog: { value: true, label: 'Enable Fog' },
        fogColor: { value: '#1a1a2e', label: 'Fog Color' },
        fogNear: { value: 5, min: 0, max: 50, step: 1 },
        fogFar: { value: 30, min: 10, max: 100, step: 1 }
      },
      collapsed: true
    },
    
    '📏 Helpers': {
      folder: {
        showGrid: { value: true, label: 'Show Grid' },
        gridSize: { value: 20, min: 10, max: 50, step: 5 },
        gridDivisions: { value: 20, min: 10, max: 50, step: 5 },
        showAxes: { value: false, label: 'Show Axes' },
        showStats: { value: false, label: 'Show Stats' }
      },
      collapsed: true
    }
  })
  
  return (
    <>
      {/* Environment preset */}
      {preset && (
        <Suspense fallback={null}>
          <Environment 
            preset={preset as any}
            background={background}
            blur={blur}
          />
        </Suspense>
      )}
      
      {/* Main lighting */}
      <ambientLight intensity={ambientIntensity} />
      <directionalLight 
        position={[lightX, lightY, lightZ]}
        intensity={directionalIntensity}
        color={directionalColor}
        castShadow={shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      
      {/* Additional accent lights */}
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#ff6030" />
      <pointLight position={[-10, 5, -10]} intensity={0.3} color="#30ff60" />
      <spotLight position={[0, 15, 0]} angle={0.3} penumbra={1} intensity={0.5} castShadow />
      
      {/* Fog */}
      {fog && <fog attach="fog" args={[fogColor, fogNear, fogFar]} />}
      
      {/* Grid */}
      {showGrid && (
        <gridHelper args={[gridSize || 20, gridDivisions || 20, '#444444', '#222222']} />
      )}
      
      {/* Axes helper */}
      {showAxes && <axesHelper args={[5]} />}
      
      {/* Ground with reflections */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={2048}
          mixBlur={1}
          mixStrength={50}
          roughness={1}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#101010"
          metalness={0.5}
        />
      </mesh>
      
      {/* Contact shadows */}
      <ContactShadows 
        position={[0, 0, 0]}
        opacity={0.4}
        scale={20}
        blur={2}
        far={5}
      />
    </>
  )
}

// Secondary Objects Showcase
function SecondaryObjects() {
  const {
    showSphere,
    showTorus,
    showCone,
    arrangement,
    spacing
  } = useXRControls('🎭 Secondary Objects', {
    'Display': {
      folder: {
        showSphere: { value: true, label: 'Sphere' },
        showTorus: { value: true, label: 'Torus' },
        showCone: { value: true, label: 'Cone' },
        arrangement: { value: 'circle', options: ['circle', 'line', 'grid'] },
        spacing: { value: 3, min: 2, max: 6, step: 0.5 }
      },
      collapsed: false
    }
  })
  
  const getPosition = (index: number, total: number) => {
    switch(arrangement) {
      case 'circle':
        const angle = (index / total) * Math.PI * 2
        return [Math.cos(angle) * spacing, 0.5, Math.sin(angle) * spacing]
      case 'line':
        return [(index - total/2) * spacing * 0.8, 0.5, -3]
      case 'grid':
        const gridSize = Math.ceil(Math.sqrt(total))
        const x = (index % gridSize - gridSize/2) * spacing * 0.8
        const z = (Math.floor(index / gridSize) - gridSize/2) * spacing * 0.8 - 3
        return [x, 0.5, z]
      default:
        return [0, 0, 0]
    }
  }
  
  const objects = []
  let index = 0
  
  if (showSphere) {
    const pos = getPosition(index++, 3)
    objects.push(
      <Float key="sphere" speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
        <Sphere args={[0.7, 32, 32]} position={pos as [number, number, number]} castShadow>
          <meshStandardMaterial color="#4080ff" roughness={0.1} metalness={0.8} />
        </Sphere>
      </Float>
    )
  }
  
  if (showTorus) {
    const pos = getPosition(index++, 3)
    objects.push(
      <Float key="torus" speed={2} rotationIntensity={1} floatIntensity={0.3}>
        <Torus args={[0.6, 0.3, 32, 32]} position={pos as [number, number, number]} castShadow>
          <meshStandardMaterial color="#ff4080" roughness={0.3} metalness={0.6} />
        </Torus>
      </Float>
    )
  }
  
  if (showCone) {
    const pos = getPosition(index++, 3)
    objects.push(
      <Float key="cone" speed={1} rotationIntensity={0.3} floatIntensity={0.8}>
        <Cone args={[0.6, 1.2, 32]} position={pos as [number, number, number]} castShadow>
          <meshStandardMaterial color="#80ff40" roughness={0.2} metalness={0.7} />
        </Cone>
      </Float>
    )
  }
  
  return <>{objects}</>
}

// Camera Controls
function CameraController() {
  const { camera } = useThree()
  
  const {
    fov,
    near,
    far,
    autoRotate,
    autoRotateSpeed,
    enableDamping,
    dampingFactor,
    maxDistance,
    minDistance
  } = useXRControls('📷 Camera', {
    'Perspective': {
      folder: {
        fov: { value: 50, min: 20, max: 120, step: 1 },
        near: { value: 0.1, min: 0.01, max: 1, step: 0.01 },
        far: { value: 100, min: 50, max: 500, step: 10 }
      },
      collapsed: false
    },
    'Controls': {
      folder: {
        autoRotate: { value: false, label: 'Auto Rotate' },
        autoRotateSpeed: { value: 1, min: -5, max: 5, step: 0.1 },
        enableDamping: { value: true, label: 'Smooth Movement' },
        dampingFactor: { value: 0.05, min: 0.01, max: 0.1, step: 0.01 },
        minDistance: { value: 3, min: 1, max: 20, step: 1 },
        maxDistance: { value: 30, min: 10, max: 100, step: 1 }
      },
      collapsed: false
    }
  })
  
  // Update camera properties
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = fov
      camera.near = near
      camera.far = far
      camera.updateProjectionMatrix()
    }
  }, [camera, fov, near, far])
  
  return (
    <OrbitControls 
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      autoRotate={autoRotate}
      autoRotateSpeed={autoRotateSpeed}
      enableDamping={enableDamping}
      dampingFactor={dampingFactor}
      minDistance={minDistance}
      maxDistance={maxDistance}
    />
  )
}

// Main App Component
export default function App() {
  const [panelMode, setPanelMode] = useState<'left' | 'right' | 'floating'>('left')
  const [showInfo, setShowInfo] = useState(true)
  
  const {
    panelScale,
    panelOpacity,
    billboard
  } = useXRControls('🎛️ Panel Settings', {
    'Appearance': {
      folder: {
        panelScale: { value: 1, min: 0.5, max: 2, step: 0.1 },
        panelOpacity: { value: 0.95, min: 0.5, max: 1, step: 0.05 },
        billboard: { value: false, label: 'Face Camera' }
      },
      collapsed: false
    }
  })
  
  const getPanelPosition = (): [number, number, number] => {
    switch(panelMode) {
      case 'left': return [-6, 0, 0]
      case 'right': return [6, 0, 0]
      case 'floating': return [0, 3, -5]
      default: return [-6, 0, 0]
    }
  }
  
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      {/* UI Controls */}
      <div style={{ 
        position: 'absolute', 
        top: 10, 
        left: '50%', 
        transform: 'translateX(-50%)',
        zIndex: 100,
        display: 'flex',
        gap: '10px',
        background: 'rgba(0,0,0,0.7)',
        padding: '10px',
        borderRadius: '8px',
        backdropFilter: 'blur(10px)'
      }}>
        <button 
          onClick={() => setPanelMode('left')}
          style={{
            padding: '8px 16px',
            background: panelMode === 'left' ? '#ff6030' : '#333',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
        >
          📍 Left Panel
        </button>
        <button 
          onClick={() => setPanelMode('right')}
          style={{
            padding: '8px 16px',
            background: panelMode === 'right' ? '#ff6030' : '#333',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
        >
          📍 Right Panel
        </button>
        <button 
          onClick={() => setPanelMode('floating')}
          style={{
            padding: '8px 16px',
            background: panelMode === 'floating' ? '#ff6030' : '#333',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
        >
          🎈 Floating Panel
        </button>
        <button 
          onClick={() => setShowInfo(!showInfo)}
          style={{
            padding: '8px 16px',
            background: '#333',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
        >
          {showInfo ? '🙈 Hide' : '👁️ Show'} Info
        </button>
      </div>
      
      {/* Info Panel */}
      {showInfo && (
        <div style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          maxWidth: '400px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
          zIndex: 100
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#ff6030' }}>
            🎨 XEVA 3D UI Kitchen Sink
          </h3>
          <p style={{ margin: '5px 0', fontSize: '14px', opacity: 0.9 }}>
            Interactive showcase of XEVA's 3D UI components in React Three Fiber.
          </p>
          <ul style={{ margin: '10px 0', paddingLeft: '20px', fontSize: '13px', opacity: 0.8 }}>
            <li>🎮 Orbit controls: Click and drag to rotate</li>
            <li>🔍 Scroll to zoom in/out</li>
            <li>🎛️ Use the control panel to modify objects</li>
            <li>✨ All changes are real-time</li>
          </ul>
          <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <small style={{ opacity: 0.6 }}>
              Built with XEVA, Three.js, and React Three Fiber
            </small>
          </div>
        </div>
      )}
      
      <Canvas 
        shadows 
        gl={{ 
          antialias: true, 
          alpha: false,
          powerPreference: "high-performance",
          stencil: false,
          depth: true
        }}
        dpr={[1, 2]}
      >
        <PerspectiveCamera makeDefault position={[8, 6, 12]} />
        <CameraController />
        
        {/* XEVA 3D Control Panel */}
        <XRPanel 
          position={getPanelPosition()}
          width={3.5 * panelScale}
          height={5 * panelScale}
          billboard={billboard}
          opacity={panelOpacity}
        />
        
        {/* Basic lighting to ensure visibility */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={1} />
        
        {/* Test object to verify scene is working */}
        <mesh position={[0, 2, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="red" />
        </mesh>
        
        {/* Scene Components */}
        <SceneEnvironment />
        <HeroObject />
        <SecondaryObjects />
        <ParticleSystem />
        
        {/* 3D Text Label */}
        <Center position={[0, 5, -5]}>
          <Text
            fontSize={1.5}
            color="#ff6030"
            anchorX="center"
            anchorY="middle"
            font="https://fonts.gstatic.com/s/raleway/v28/1Ptxg8zYS_SKggPN4iEgvnHyvveLxVvaorCIPrQ.ttf"
          >
            XEVA SHOWCASE
            <meshStandardMaterial 
              color="#ff6030" 
              metalness={0.8} 
              roughness={0.2}
              emissive="#ff6030"
              emissiveIntensity={0.2}
            />
          </Text>
        </Center>
      </Canvas>
    </div>
  )
}