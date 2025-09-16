import React, { Suspense, useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { 
  OrbitControls, 
  Sky, 
  Environment, 
  Stats,
  Float,
  Text,
  Sphere,
  Torus,
  Cone,
  PerformanceMonitor,
  AdaptiveDpr,
  AdaptiveEvents
} from '@react-three/drei'
import { useControls, XrevaPanel } from 'xreva'
import * as THREE from 'three'
import { FPSStats, FPSOverlay } from './FPSStats'

// Main controllable 3D object using XREVA controls
function Hero3DObject() {
  const meshRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  
  // Using the new Leva-like API
  const {
    geometry: {
      geometryType,
      size,
      segments,
      scale,
      positionX,
      positionY,
      positionZ
    },
    material: {
      color,
      emissive,
      emissiveIntensity,
      metalness,
      roughness,
      clearcoat,
      wireframe,
      transparent,
      opacity
    },
    animation: {
      autoRotate,
      rotationSpeed,
      floatEffect,
      floatSpeed,
      floatIntensity,
      pulse,
      pulseScale
    }
  } = useControls('Main Object', {
    geometry: {
      geometryType: {
        value: 'box',
        options: ['box', 'sphere', 'torus', 'cone', 'cylinder', 'dodecahedron']
      },
      size: { value: 2, min: 0.5, max: 5, step: 0.1 },
      segments: { value: 32, min: 3, max: 64, step: 1 },
      scale: { value: 1, min: 0.1, max: 3, step: 0.01 },
      positionX: { value: 0, min: -5, max: 5, step: 0.1 },
      positionY: { value: 0, min: -3, max: 3, step: 0.1 },
      positionZ: { value: 0, min: -5, max: 5, step: 0.1 }
    },
    material: {
      color: { value: '#ff6030' },
      emissive: { value: '#000000' },
      emissiveIntensity: { value: 0, min: 0, max: 1, step: 0.01 },
      metalness: { value: 0.5, min: 0, max: 1, step: 0.01 },
      roughness: { value: 0.5, min: 0, max: 1, step: 0.01 },
      clearcoat: { value: 0, min: 0, max: 1, step: 0.01 },
      wireframe: { value: false },
      transparent: { value: false },
      opacity: { value: 1, min: 0, max: 1, step: 0.01 }
    },
    animation: {
      autoRotate: { value: true },
      rotationSpeed: { value: 1, min: 0, max: 5, step: 0.1 },
      floatEffect: { value: false },
      floatSpeed: { value: 1, min: 0.1, max: 5, step: 0.1 },
      floatIntensity: { value: 1, min: 0, max: 3, step: 0.1 },
      pulse: { value: false },
      pulseScale: { value: 0.1, min: 0, max: 0.5, step: 0.01 }
    }
  })

  // Create geometry based on type
  const geometry = (() => {
    switch(geometryType) {
      case 'sphere':
        return <sphereGeometry args={[size/2, segments, segments]} />
      case 'torus':
        return <torusGeometry args={[size/2, size/4, segments, segments]} />
      case 'cone':
        return <coneGeometry args={[size/2, size, segments]} />
      case 'cylinder':
        return <cylinderGeometry args={[size/3, size/3, size, segments]} />
      case 'dodecahedron':
        return <dodecahedronGeometry args={[size/2, 0]} />
      default:
        return <boxGeometry args={[size, size, size]} />
    }
  })()

  // Animation using direct property manipulation to avoid re-renders
  useFrame((state, delta) => {
    if (!groupRef.current) return
    
    const time = state.clock.getElapsedTime()
    
    // Auto rotation - directly manipulate rotation
    if (autoRotate) {
      groupRef.current.rotation.y += delta * rotationSpeed
      groupRef.current.rotation.x += delta * rotationSpeed * 0.3
    }
    
    // Float effect - directly manipulate position
    if (floatEffect) {
      groupRef.current.position.y = positionY + Math.sin(time * floatSpeed) * 0.3 * floatIntensity
    } else {
      groupRef.current.position.y = positionY
    }
    
    // Pulse effect - directly manipulate scale
    if (pulse) {
      const pulseValue = 1 + Math.sin(time * 3) * pulseScale
      groupRef.current.scale.setScalar(scale * pulseValue)
    } else {
      groupRef.current.scale.setScalar(scale)
    }
  })

  return (
    <group ref={groupRef} position={[positionX, positionY, positionZ]}>
      <mesh 
        ref={meshRef}
        castShadow 
        receiveShadow
      >
        {geometry}
        <meshPhysicalMaterial 
          color={color}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          metalness={metalness}
          roughness={roughness}
          clearcoat={clearcoat}
          wireframe={wireframe}
          transparent={transparent}
          opacity={opacity}
        />
      </mesh>
    </group>
  )
}

// Particle System with XREVA controls
function ParticleSystem() {
  const pointsRef = useRef<THREE.Points>(null)
  const groupRef = useRef<THREE.Group>(null)
  const positionsRef = useRef<Float32Array | null>(null)
  const initialPositionsRef = useRef<Float32Array | null>(null)
  
  const {
    particlesVisible,
    particleCount,
    particleSize,
    particleColor,
    particleSpread,
    particleSpeed,
    particleWave
  } = useControls('Particles', {
    particlesVisible: { value: true },
    particleCount: { value: 500, min: 100, max: 2000, step: 100 },
    particleSize: { value: 0.05, min: 0.01, max: 0.2, step: 0.01 },
    particleColor: { value: '#ffaa00' },
    particleSpread: { value: 10, min: 5, max: 20, step: 1 },
    particleSpeed: { value: 0.5, min: 0, max: 2, step: 0.1 },
    particleWave: { value: false }
  })

  // Memoize particle positions to avoid recreating on every render
  const particles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3)
    const initialPositions = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * particleSpread
      const y = Math.random() * particleSpread
      const z = (Math.random() - 0.5) * particleSpread
      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z
      initialPositions[i * 3] = x
      initialPositions[i * 3 + 1] = y
      initialPositions[i * 3 + 2] = z
    }
    positionsRef.current = positions
    initialPositionsRef.current = initialPositions
    return positions
  }, [particleCount, particleSpread])

  // Optimized animation using direct property manipulation
  useFrame((state) => {
    if (!groupRef.current || !particlesVisible) return
    
    const time = state.clock.getElapsedTime()
    
    // Direct rotation manipulation
    groupRef.current.rotation.y = time * particleSpeed * 0.1
    
    // Wave effect with optimized buffer update
    if (particleWave && pointsRef.current && positionsRef.current && initialPositionsRef.current) {
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3
        // Use initial positions as base for wave calculation
        positions[i3 + 1] = initialPositionsRef.current[i3 + 1] + Math.sin(time * 2 + i * 0.01) * 2
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  if (!particlesVisible) return null

  return (
    <group ref={groupRef}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particles, 3]}
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
    </group>
  )
}

// Secondary Objects with XEVA controls
function SecondaryObjects() {
  const {
    objects: {
      showSphere,
      sphereColor,
      showTorus,
      torusColor,
      showCone,
      coneColor
    }
  } = useControls('Extras', {
    objects: {
      showSphere: { value: true },
      sphereColor: { value: '#4080ff' },
      showTorus: { value: true },
      torusColor: { value: '#ff4080' },
      showCone: { value: true },
      coneColor: { value: '#80ff40' }
    }
  })

  return (
    <>
      {showSphere && (
        <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
          <Sphere args={[0.7, 32, 32]} position={[-3, 1, -2]} castShadow>
            <meshStandardMaterial color={sphereColor} roughness={0.1} metalness={0.8} />
          </Sphere>
        </Float>
      )}
      
      {showTorus && (
        <Float speed={2} rotationIntensity={1} floatIntensity={0.3}>
          <Torus args={[0.6, 0.3, 32, 32]} position={[3, 1, -2]} castShadow>
            <meshStandardMaterial color={torusColor} roughness={0.3} metalness={0.6} />
          </Torus>
        </Float>
      )}
      
      {showCone && (
        <Float speed={1} rotationIntensity={0.3} floatIntensity={0.8}>
          <Cone args={[0.6, 1.2, 32]} position={[0, 1, -4]} castShadow>
            <meshStandardMaterial color={coneColor} roughness={0.2} metalness={0.7} />
          </Cone>
        </Float>
      )}
    </>
  )
}

// Scene component with environment controls
function Scene() {
  const {
    scene: {
      environment,
      envIntensity,
      backgroundColor,
      fog,
      showGrid,
      showStats
    }
  } = useControls('Scene Settings', {
    scene: {
      environment: {
        value: 'sunset',
        options: ['sunset', 'dawn', 'night', 'warehouse', 'forest', 'apartment', 'studio', 'city', 'park', 'lobby'],
        label: 'Environment'
      },
      envIntensity: { value: 1, min: 0, max: 3, step: 0.1, label: 'Environment Intensity' },
      backgroundColor: { value: '#1a1a2e', label: 'Background Color' },
      fog: { value: true, label: 'Enable Fog' },
      showGrid: { value: true, label: 'Show Grid' },
      showStats: { value: true, label: 'Show FPS Stats' }
    }
  })

  return (
    <>
      {/* Background color */}
      <color attach="background" args={[backgroundColor]} />
      
      {/* Fog */}
      {fog && <fog attach="fog" args={[backgroundColor, 10, 100]} />}
      
      {/* Sky - only show for outdoor environments */}
      {['sunset', 'dawn', 'night', 'forest', 'park'].includes(environment) && (
        <Sky 
          distance={450000}
          sunPosition={[0, 1, 0]}
          inclination={0}
          azimuth={0.25}
        />
      )}
      
      {/* Environment and Lighting */}
      <Environment 
        preset={environment as any} 
        background={!['sunset', 'dawn', 'night', 'forest', 'park'].includes(environment)}
        environmentIntensity={envIntensity}
      />
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1.2} 
        castShadow
        shadow-mapSize={[1024, 1024]} // Reduced from 2048 for better performance
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <pointLight position={[-10, 5, -10]} intensity={0.5} color="#ff6030" />
      <spotLight position={[0, 15, 0]} angle={0.3} penumbra={1} intensity={0.5} castShadow />
      
      {/* Floor - using standard material due to React 19 compatibility */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial 
          color="#101010"
          metalness={0.8}
          roughness={0.1}
          envMapIntensity={1}
        />
      </mesh>
      
      {/* Grid Helper */}
      {showGrid && (
        <gridHelper 
          args={[20, 20, '#444', '#222']} 
          position={[0, -1.99, 0]} 
        />
      )}
      
      {/* Main Hero Object */}
      <Hero3DObject />
      
      {/* Secondary Objects */}
      <SecondaryObjects />
      
      {/* Particle System */}
      <ParticleSystem />
      
      {/* 3D Text */}
      <Text
        position={[0, 5, -5]}
        fontSize={1.5}
        color="#ff6030"
        anchorX="center"
        anchorY="middle"
      >
        XREVA DEMO
        <meshStandardMaterial 
          color="#ff6030" 
          metalness={0.8} 
          roughness={0.2}
          emissive="#ff6030"
          emissiveIntensity={0.2}
        />
      </Text>
      
      {/* XReva Control Panel - uses the new component */}
      <XrevaPanel 
        position={[5, 1, 0]}
        rotation={[0, -0.3, 0]}
        title="XReva Controls"
        tabs={true}
        scale={0.8}
        billboard={false}
      />
      
      {/* FPS Stats - using custom component for React 19 compatibility */}
      {showStats && <FPSStats />}
    </>
  )
}

// Main App using refactored XEVA
function XrevaDemo() {
  // Simple state to control FPS display from outside canvas
  const [showFPSOverlay, setShowFPSOverlay] = React.useState(false)
  
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#000' }}>
      {/* Alternative FPS overlay (outside canvas) */}
      {showFPSOverlay && <FPSOverlay />}
      
      <Canvas
        shadows
        camera={{ position: [8, 6, 8], fov: 60 }}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        gl={{ 
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          powerPreference: "high-performance",
          alpha: false,
          stencil: false,
          depth: true
        }}
        dpr={[1, 2]} // Limit pixel ratio for better performance
        performance={{ min: 0.5 }} // Adaptive performance
      >
        <Suspense fallback={null}>
          {/* Adaptive performance monitoring */}
          <AdaptiveDpr pixelated />
          <AdaptiveEvents />
          <PerformanceMonitor 
            onIncline={() => console.log('Performance improving')}
            onDecline={() => console.log('Performance declining')}
            flipflops={3}
            onFallback={() => console.log('Fallback triggered')}
          />
          
          <Scene />
        </Suspense>
        
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          makeDefault
          minDistance={3}
          maxDistance={30}
        />
      </Canvas>
    </div>
  )
}

export default XrevaDemo
