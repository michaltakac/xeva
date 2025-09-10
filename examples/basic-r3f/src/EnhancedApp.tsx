import React, { Suspense, useRef, useMemo } from 'react'
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
  Box,
  Torus,
  Cone,
  Cylinder,
  Dodecahedron
} from '@react-three/drei'
import { useXRControls, XRPanel } from 'xeva'
import * as THREE from 'three'

// Main controllable 3D object with extensive controls
function Hero3DObject() {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null)
  
  const controls = useXRControls('🎮 Main Object', {
    '📐 Geometry': {
      folder: {
        geometryType: {
          value: 'box',
          options: ['box', 'sphere', 'torus', 'cone', 'cylinder', 'dodecahedron']
        },
        size: { value: 2, min: 0.5, max: 5, step: 0.1 },
        segments: { value: 32, min: 3, max: 64, step: 1 }
      },
      collapsed: false
    },
    
    '📍 Transform': {
      folder: {
        positionX: { value: 0, min: -10, max: 10, step: 0.1 },
        positionY: { value: 0, min: -5, max: 5, step: 0.1 },
        positionZ: { value: 0, min: -10, max: 10, step: 0.1 },
        rotationX: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
        rotationY: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
        rotationZ: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
        scale: { value: 1, min: 0.1, max: 3, step: 0.01 }
      },
      collapsed: true
    },
    
    '🎨 Material': {
      folder: {
        color: { value: '#ff6030' },
        emissive: { value: '#000000' },
        emissiveIntensity: { value: 0, min: 0, max: 1, step: 0.01 },
        metalness: { value: 0.5, min: 0, max: 1, step: 0.01 },
        roughness: { value: 0.5, min: 0, max: 1, step: 0.01 },
        clearcoat: { value: 0, min: 0, max: 1, step: 0.01 },
        clearcoatRoughness: { value: 0, min: 0, max: 1, step: 0.01 },
        reflectivity: { value: 0.5, min: 0, max: 1, step: 0.01 },
        wireframe: false,
        transparent: false,
        opacity: { value: 1, min: 0, max: 1, step: 0.01 }
      },
      collapsed: true
    },
    
    '✨ Animation': {
      folder: {
        autoRotate: true,
        rotateSpeed: { value: 1, min: 0, max: 5, step: 0.1 },
        float: false,
        floatSpeed: { value: 1, min: 0.1, max: 5, step: 0.1 },
        floatIntensity: { value: 1, min: 0, max: 3, step: 0.1 },
        pulse: false,
        pulseScale: { value: 0.1, min: 0, max: 0.5, step: 0.01 }
      },
      collapsed: true
    },
    
    '⚡ Actions': {
      folder: {
        resetTransform: {
          value: () => {
            if (meshRef.current) {
              meshRef.current.position.set(0, 0, 0)
              meshRef.current.rotation.set(0, 0, 0)
              meshRef.current.scale.setScalar(1)
            }
          },
          label: '🔄 Reset Transform'
        },
        randomizeColors: {
          value: () => {
            const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16)
            // This would need to update the control value
            console.log('Random color:', randomColor)
          },
          label: '🎲 Random Colors'
        }
      },
      collapsed: true
    }
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
      meshRef.current.rotation.y += delta * rotateSpeed
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

  return (
    <mesh 
      ref={meshRef}
      position={[positionX, positionY, positionZ]}
      rotation={[rotationX, rotationY, rotationZ]}
      castShadow 
      receiveShadow
    >
      {geometry}
      <meshPhysicalMaterial 
        ref={materialRef}
        color={color}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        metalness={metalness}
        roughness={roughness}
        clearcoat={clearcoat}
        clearcoatRoughness={clearcoatRoughness}
        reflectivity={reflectivity}
        wireframe={wireframe}
        transparent={transparent}
        opacity={opacity}
      />
    </mesh>
  )
}

// Particle system with controls
function ParticleSystem() {
  const pointsRef = useRef<THREE.Points>(null)
  
  const {
    visible,
    count,
    size,
    color: particleColor,
    spread,
    speed,
    wave
  } = useXRControls('✨ Particles', {
    visible: true,
    count: { value: 500, min: 100, max: 2000, step: 100 },
    size: { value: 0.05, min: 0.01, max: 0.2, step: 0.01 },
    color: { value: '#ffaa00' },
    spread: { value: 10, min: 5, max: 20, step: 1 },
    speed: { value: 0.5, min: 0, max: 2, step: 0.1 },
    wave: false
  })

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * spread
      positions[i * 3 + 1] = Math.random() * spread
      positions[i * 3 + 2] = (Math.random() - 0.5) * spread
    }
    return positions
  }, [count, spread])

  useFrame((state) => {
    if (!pointsRef.current || !visible) return
    
    const time = state.clock.getElapsedTime()
    pointsRef.current.rotation.y = time * speed * 0.1
    
    if (wave) {
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < count; i++) {
        const i3 = i * 3
        positions[i3 + 1] = Math.sin(time + i * 0.01) * 2 + Math.random() * spread
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
        size={size}
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
    preset,
    background,
    intensity,
    blur,
    fogColor,
    fogNear,
    fogFar,
    fogEnabled
  } = useXRControls('🌍 Environment', {
    preset: {
      value: 'sunset',
      options: ['sunset', 'dawn', 'night', 'warehouse', 'forest', 'apartment', 'studio', 'city', 'park', 'lobby']
    },
    background: true,
    intensity: { value: 1, min: 0, max: 2, step: 0.1 },
    blur: { value: 0, min: 0, max: 1, step: 0.01 },
    fogEnabled: false,
    fogColor: { value: '#ffffff' },
    fogNear: { value: 5, min: 0, max: 50, step: 1 },
    fogFar: { value: 50, min: 10, max: 200, step: 1 }
  })

  return (
    <>
      <Environment 
        preset={preset as any}
        background={background}
        backgroundIntensity={intensity}
        backgroundBlurriness={blur}
      />
      {fogEnabled && <fog attach="fog" args={[fogColor, fogNear, fogFar]} />}
    </>
  )
}

// Secondary objects
function SecondaryObjects() {
  const {
    showSpheres,
    sphereColor,
    showTorus,
    torusColor,
    showCone,
    coneColor
  } = useXRControls('🎭 Extra Objects', {
    showSpheres: true,
    sphereColor: { value: '#4080ff' },
    showTorus: true,
    torusColor: { value: '#ff4080' },
    showCone: true,
    coneColor: { value: '#80ff40' }
  })

  return (
    <>
      {showSpheres && (
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

// Scene component
function Scene() {
  const {
    showGrid,
    gridSize,
    showStats,
    panelPosition,
    panelScale
  } = useXRControls('⚙️ Scene Settings', {
    showGrid: true,
    gridSize: { value: 20, min: 10, max: 50, step: 5 },
    showStats: true,
    panelPosition: { value: 4, min: 2, max: 8, step: 0.5 },
    panelScale: { value: 1, min: 0.5, max: 2, step: 0.1 }
  })

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1.2} 
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <pointLight position={[-10, 5, -10]} intensity={0.5} color="#ff6030" />
      <spotLight position={[0, 15, 0]} angle={0.3} penumbra={1} intensity={0.5} castShadow />
      
      {/* Sky and Environment */}
      <Sky 
        distance={450000}
        sunPosition={[0, 1, 0]}
        inclination={0}
        azimuth={0.25}
      />
      <SceneEnvironment />
      
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
        XEVA CONTROLS
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
        position={[panelPosition, 0, 0]}
        width={3.5 * panelScale}
        height={5 * panelScale}
        billboard={false}
        opacity={0.95}
      />
      
      {/* Stats */}
      {showStats && <Stats />}
    </>
  )
}

// Main App
function EnhancedApp() {
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

export default EnhancedApp