import React, { Suspense, useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { 
  OrbitControls, 
  Sky, 
  Environment, 
  Stats, 
  Float,
  MeshReflectorMaterial,
  Text
} from '@react-three/drei'
import { useXRControls, XRPanel } from 'xeva'
import * as THREE from 'three'

// Main controllable 3D object - using flat structure for controls
function Hero3DObject() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  const { 
    geometryType,
    size,
    segments,
    positionX,
    positionY,
    positionZ,
    rotationSpeed,
    color,
    emissive,
    emissiveIntensity,
    metalness,
    roughness,
    wireframe,
    autoRotate,
    floatEffect
  } = useXRControls('Main Object', {
    geometryType: {
      value: 'box',
      options: ['box', 'sphere', 'torus', 'cone', 'cylinder', 'dodecahedron']
    },
    size: { value: 2, min: 0.5, max: 5, step: 0.1 },
    segments: { value: 32, min: 3, max: 64, step: 1 },
    positionX: { value: 0, min: -5, max: 5, step: 0.1 },
    positionY: { value: 0, min: -3, max: 3, step: 0.1 },
    positionZ: { value: 0, min: -5, max: 5, step: 0.1 },
    rotationSpeed: { value: 1, min: 0, max: 5, step: 0.1 },
    color: { value: '#ff6030' },
    emissive: { value: '#000000' },
    emissiveIntensity: { value: 0, min: 0, max: 1, step: 0.01 },
    metalness: { value: 0.5, min: 0, max: 1, step: 0.01 },
    roughness: { value: 0.5, min: 0, max: 1, step: 0.01 },
    wireframe: false,
    autoRotate: true,
    floatEffect: false
  })

  // Create geometry based on type
  const geometry = useMemo(() => {
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
  }, [geometryType, size, segments])

  // Animation
  useFrame((state, delta) => {
    if (!meshRef.current) return
    
    const time = state.clock.getElapsedTime()
    
    // Auto rotation
    if (autoRotate) {
      meshRef.current.rotation.y += delta * rotationSpeed
    }
    
    // Float effect
    if (floatEffect) {
      meshRef.current.position.y = positionY + Math.sin(time) * 0.3
    } else {
      meshRef.current.position.y = positionY
    }
  })

  return (
    <mesh 
      ref={meshRef}
      position={[positionX, positionY, positionZ]}
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
        wireframe={wireframe}
      />
    </mesh>
  )
}

// Particle system
function ParticleSystem() {
  const pointsRef = useRef<THREE.Points>(null)
  
  const {
    particlesVisible,
    particleCount,
    particleSize,
    particleColor,
    particleSpread
  } = useXRControls('Particles', {
    particlesVisible: true,
    particleCount: { value: 500, min: 100, max: 2000, step: 100 },
    particleSize: { value: 0.05, min: 0.01, max: 0.2, step: 0.01 },
    particleColor: { value: '#ffaa00' },
    particleSpread: { value: 10, min: 5, max: 20, step: 1 }
  })

  const particles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * particleSpread
      positions[i * 3 + 1] = Math.random() * particleSpread
      positions[i * 3 + 2] = (Math.random() - 0.5) * particleSpread
    }
    return positions
  }, [particleCount, particleSpread])

  useFrame((state) => {
    if (!pointsRef.current || !particlesVisible) return
    pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.1
  })

  if (!particlesVisible) return null

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

// Environment controls
function SceneEnvironment() {
  const {
    environmentPreset,
    showBackground,
    lightIntensity,
    ambientIntensity,
    fogEnabled,
    fogColor,
    fogNear,
    fogFar
  } = useXRControls('Environment', {
    environmentPreset: {
      value: 'sunset',
      options: ['sunset', 'dawn', 'night', 'warehouse', 'forest', 'apartment', 'studio', 'city', 'park', 'lobby']
    },
    showBackground: true,
    lightIntensity: { value: 1, min: 0, max: 2, step: 0.1 },
    ambientIntensity: { value: 0.4, min: 0, max: 1, step: 0.1 },
    fogEnabled: false,
    fogColor: { value: '#1a1a2e' },
    fogNear: { value: 5, min: 0, max: 50, step: 1 },
    fogFar: { value: 50, min: 10, max: 200, step: 1 }
  })

  return (
    <>
      <ambientLight intensity={ambientIntensity} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={lightIntensity} 
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <Environment 
        preset={environmentPreset as any}
        background={showBackground}
      />
      {fogEnabled && <fog attach="fog" args={[fogColor, fogNear, fogFar]} />}
    </>
  )
}

// Secondary objects
function SecondaryObjects() {
  const {
    showSphere,
    sphereColor,
    showTorus,
    torusColor,
    showCone,
    coneColor
  } = useXRControls('Extra Objects', {
    showSphere: true,
    sphereColor: { value: '#4080ff' },
    showTorus: true,
    torusColor: { value: '#ff4080' },
    showCone: true,
    coneColor: { value: '#80ff40' }
  })

  return (
    <>
      {showSphere && (
        <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
          <mesh position={[-3, 1, -2]} castShadow>
            <sphereGeometry args={[0.7, 32, 32]} />
            <meshStandardMaterial color={sphereColor} roughness={0.1} metalness={0.8} />
          </mesh>
        </Float>
      )}
      
      {showTorus && (
        <Float speed={2} rotationIntensity={1} floatIntensity={0.3}>
          <mesh position={[3, 1, -2]} castShadow>
            <torusGeometry args={[0.6, 0.3, 32, 32]} />
            <meshStandardMaterial color={torusColor} roughness={0.3} metalness={0.6} />
          </mesh>
        </Float>
      )}
      
      {showCone && (
        <Float speed={1} rotationIntensity={0.3} floatIntensity={0.8}>
          <mesh position={[0, 1, -4]} castShadow>
            <coneGeometry args={[0.6, 1.2, 32]} />
            <meshStandardMaterial color={coneColor} roughness={0.2} metalness={0.7} />
          </mesh>
        </Float>
      )}
    </>
  )
}

// Scene component
function Scene() {
  const {
    showGrid,
    gridSize,
    showStats,
    panelX,
    panelScale
  } = useXRControls('Scene', {
    showGrid: true,
    gridSize: { value: 20, min: 10, max: 50, step: 5 },
    showStats: true,
    panelX: { value: 4, min: 2, max: 8, step: 0.5 },
    panelScale: { value: 1, min: 0.5, max: 2, step: 0.1 }
  })

  return (
    <>
      {/* Sky */}
      <Sky 
        distance={450000}
        sunPosition={[0, 1, 0]}
        inclination={0}
        azimuth={0.25}
      />
      
      {/* Environment and Lighting */}
      <SceneEnvironment />
      
      {/* Additional lights */}
      <pointLight position={[-10, 5, -10]} intensity={0.5} color="#ff6030" />
      <spotLight position={[0, 15, 0]} angle={0.3} penumbra={1} intensity={0.5} castShadow />
      
      {/* Floor with reflections */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={2048}
          mixBlur={1}
          mixStrength={80}
          roughness={1}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#101010"
          metalness={0.5}
          mirror={0}
        />
      </mesh>
      
      {/* Grid Helper */}
      {showGrid && (
        <gridHelper 
          args={[gridSize, gridSize, '#444', '#222']} 
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
        XEVA DEMO
        <meshStandardMaterial 
          color="#ff6030" 
          metalness={0.8} 
          roughness={0.2}
          emissive="#ff6030"
          emissiveIntensity={0.2}
        />
      </Text>
      
      {/* XEVA Control Panel */}
      <XRPanel 
        position={[panelX, 0, 0]}
        width={3.5 * panelScale}
        height={5 * panelScale}
        billboard={false}
      />
      
      {/* Stats */}
      {showStats && <Stats />}
    </>
  )
}

// Main App
function SimpleWorkingApp() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#000' }}>
      <Canvas
        shadows
        camera={{ position: [8, 6, 8], fov: 60 }}
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
          minDistance={3}
          maxDistance={30}
        />
      </Canvas>
    </div>
  )
}

export default SimpleWorkingApp