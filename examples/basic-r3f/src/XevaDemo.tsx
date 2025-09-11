import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { 
  OrbitControls, 
  Sky, 
  Environment, 
  Stats,
  Float,
  MeshReflectorMaterial,
  Text,
  Sphere,
  Torus,
  Cone
} from '@react-three/drei'
import { useControls, XevaPanel } from 'xeva'
import * as THREE from 'three'

// Main controllable 3D object using XEVA controls
function Hero3DObject() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  // Using the new Leva-like API
  const {
    geometryType,
    size,
    segments,
    scale,
    positionX,
    positionY,
    positionZ,
    color,
    emissive,
    emissiveIntensity,
    metalness,
    roughness,
    clearcoat,
    wireframe,
    transparent,
    opacity,
    autoRotate,
    rotationSpeed,
    floatEffect,
    floatSpeed,
    floatIntensity,
    pulse,
    pulseScale
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
      wireframe: false,
      transparent: false,
      opacity: { value: 1, min: 0, max: 1, step: 0.01 }
    },
    animation: {
      autoRotate: true,
      rotationSpeed: { value: 1, min: 0, max: 5, step: 0.1 },
      floatEffect: false,
      floatSpeed: { value: 1, min: 0.1, max: 5, step: 0.1 },
      floatIntensity: { value: 1, min: 0, max: 3, step: 0.1 },
      pulse: false,
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

  // Animation
  useFrame((state, delta) => {
    if (!meshRef.current) return
    
    const time = state.clock.getElapsedTime()
    
    // Auto rotation
    if (autoRotate) {
      meshRef.current.rotation.y += delta * rotationSpeed
      meshRef.current.rotation.x += delta * rotationSpeed * 0.3
    }
    
    // Float effect
    if (floatEffect) {
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
        clearcoat={clearcoat}
        wireframe={wireframe}
        transparent={transparent}
        opacity={opacity}
      />
    </mesh>
  )
}

// Particle System with XEVA controls
function ParticleSystem() {
  const pointsRef = useRef<THREE.Points>(null)
  
  const {
    particlesVisible,
    particleCount,
    particleSize,
    particleColor,
    particleSpread,
    particleSpeed,
    particleWave
  } = useControls('Particles', {
    particlesVisible: true,
    particleCount: { value: 500, min: 100, max: 2000, step: 100 },
    particleSize: { value: 0.05, min: 0.01, max: 0.2, step: 0.01 },
    particleColor: { value: '#ffaa00' },
    particleSpread: { value: 10, min: 5, max: 20, step: 1 },
    particleSpeed: { value: 0.5, min: 0, max: 2, step: 0.1 },
    particleWave: false
  })

  const particles = (() => {
    const positions = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * particleSpread
      positions[i * 3 + 1] = Math.random() * particleSpread
      positions[i * 3 + 2] = (Math.random() - 0.5) * particleSpread
    }
    return positions
  })()

  useFrame((state) => {
    if (!pointsRef.current || !particlesVisible) return
    
    const time = state.clock.getElapsedTime()
    pointsRef.current.rotation.y = time * particleSpeed * 0.1
    
    if (particleWave) {
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3
        positions[i3 + 1] = Math.sin(time + i * 0.01) * 2 + Math.random() * particleSpread
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true
    }
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

// Secondary Objects with XEVA controls
function SecondaryObjects() {
  const {
    showSphere,
    sphereColor,
    showTorus,
    torusColor,
    showCone,
    coneColor
  } = useControls('Extras', {
    objects: {
      showSphere: true,
      sphereColor: { value: '#4080ff' },
      showTorus: true,
      torusColor: { value: '#ff4080' },
      showCone: true,
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
    environment,
    showGrid,
    showStats
  } = useControls('Scene', {
    environment: {
      value: 'sunset',
      options: ['sunset', 'dawn', 'night', 'warehouse', 'forest', 'apartment', 'studio']
    },
    showGrid: true,
    showStats: true
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
      <Environment preset={environment as any} background />
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1.2} 
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
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
        XEVA DEMO
        <meshStandardMaterial 
          color="#ff6030" 
          metalness={0.8} 
          roughness={0.2}
          emissive="#ff6030"
          emissiveIntensity={0.2}
        />
      </Text>
      
      {/* XEVA Control Panel - uses the new component */}
      <XevaPanel 
        position={[4.5, 0, 0]}
        title="XEVA Controls"
        tabs={true}
      />
      
      {/* Stats */}
      {showStats && <Stats />}
    </>
  )
}

// Main App using refactored XEVA
function XevaDemo() {
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

export default XevaDemo