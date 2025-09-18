import React, { Suspense, useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { XR, createXRStore, XROrigin, useXR, noEvents, PointerEvents } from '@react-three/xr'
import { OrbitHandles } from '@react-three/handle'
import { 
  Sky, 
  Environment, 
  Float,
  Text,
  Sphere,
  Torus,
  Cone,
  Box
} from '@react-three/drei'
import { useControls, XrevaPanelXR } from 'xreva'
import * as THREE from 'three'

// XR Store for managing VR/AR sessions
const xrStore = createXRStore({ 
  foveation: 0,
  hand: true,
  controller: true
})

// Environment component that adapts to AR/VR mode
function NonAREnvironment() {
  const inAR = useXR((s) => s.mode === 'immersive-ar')
  
  const envControls = useControls('Environment', {
    scene: {
      environment: {
        value: 'sunset',
        options: ['sunset', 'dawn', 'night', 'warehouse', 'forest', 'apartment', 'studio', 'city', 'park', 'lobby']
      },
      envIntensity: { value: 1, min: 0, max: 3, step: 0.1 },
      backgroundColor: { value: '#1a1a2e' }
    }
  })
  
  const { 
    environment = 'sunset',
    envIntensity = 1,
    backgroundColor = '#1a1a2e'
  } = envControls?.scene || {}
  
  if (inAR) {
    // In AR mode, only provide lighting, no backgrounds
    return (
      <>
        <ambientLight intensity={0.7} />
        <directionalLight 
          position={[5, 10, 5]} 
          intensity={0.5} 
          castShadow 
          shadow-mapSize={[1024, 1024]}
        />
      </>
    )
  }
  
  // In VR or non-XR mode, show full environment
  return (
    <>
      <color attach="background" args={[backgroundColor]} />
      <fog attach="fog" args={[backgroundColor, 10, 100]} />
      
      {['sunset', 'dawn', 'night', 'forest', 'park'].includes(environment) && (
        <Sky 
          distance={450000}
          sunPosition={[0, 1, 0]}
          inclination={0}
          azimuth={0.25}
        />
      )}
      
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
        shadow-mapSize={[1024, 1024]}
      />
    </>
  )
}

// Main controllable 3D object
function Hero3DObject() {
  const meshRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  
  const mainControls = useControls('Main Object', {
    geometry: {
      geometryType: {
        value: 'box',
        options: ['box', 'sphere', 'torus', 'cone', 'cylinder', 'dodecahedron']
      },
      size: { value: 1, min: 0.5, max: 3, step: 0.1 },
      segments: { value: 32, min: 3, max: 64, step: 1 },
      scale: { value: 1, min: 0.1, max: 3, step: 0.01 },
      positionX: { value: 0, min: -5, max: 5, step: 0.1 },
      positionY: { value: 0, min: -3, max: 3, step: 0.1 },
      positionZ: { value: -2, min: -5, max: 5, step: 0.1 }
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

  // Provide defaults for all control values
  const {
    geometryType = 'box',
    size = 1,
    segments = 32,
    scale = 1,
    positionX = 0,
    positionY = 0,
    positionZ = -2
  } = mainControls?.geometry || {}

  const {
    color = '#ff6030',
    emissive = '#000000',
    emissiveIntensity = 0,
    metalness = 0.5,
    roughness = 0.5,
    clearcoat = 0,
    wireframe = false,
    transparent = false,
    opacity = 1
  } = mainControls?.material || {}

  const {
    autoRotate = true,
    rotationSpeed = 1,
    floatEffect = false,
    floatSpeed = 1,
    floatIntensity = 1,
    pulse = false,
    pulseScale = 0.1
  } = mainControls?.animation || {}

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

  useFrame((state, delta) => {
    if (!groupRef.current) return
    
    const time = state.clock.getElapsedTime()
    
    if (autoRotate) {
      groupRef.current.rotation.y += delta * rotationSpeed
      groupRef.current.rotation.x += delta * rotationSpeed * 0.3
    }
    
    if (floatEffect) {
      groupRef.current.position.y = positionY + Math.sin(time * floatSpeed) * 0.3 * floatIntensity
    } else {
      groupRef.current.position.y = positionY
    }
    
    if (pulse) {
      const pulseValue = 1 + Math.sin(time * 3) * pulseScale
      groupRef.current.scale.setScalar(scale * pulseValue)
    } else {
      groupRef.current.scale.setScalar(scale)
    }
  })

  return (
    <group ref={groupRef} position={[positionX, positionY, positionZ]}>
      <mesh ref={meshRef} castShadow receiveShadow>
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

// Secondary Objects
function SecondaryObjects() {
  const extraControls = useControls('Extra Objects', {
    objects: {
      showSphere: { value: true },
      sphereColor: { value: '#4080ff' },
      showTorus: { value: true },
      torusColor: { value: '#ff4080' },
      showCone: { value: true },
      coneColor: { value: '#80ff40' }
    }
  })

  const {
    showSphere = true,
    sphereColor = '#4080ff',
    showTorus = true,
    torusColor = '#ff4080',
    showCone = true,
    coneColor = '#80ff40'
  } = extraControls?.objects || {}

  return (
    <>
      {showSphere && (
        <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
          <Sphere args={[0.5, 32, 32]} position={[-2, 1, -2]} castShadow>
            <meshStandardMaterial color={sphereColor} roughness={0.1} metalness={0.8} />
          </Sphere>
        </Float>
      )}
      
      {showTorus && (
        <Float speed={2} rotationIntensity={1} floatIntensity={0.3}>
          <Torus args={[0.4, 0.2, 32, 32]} position={[2, 1, -2]} castShadow>
            <meshStandardMaterial color={torusColor} roughness={0.3} metalness={0.6} />
          </Torus>
        </Float>
      )}
      
      {showCone && (
        <Float speed={1} rotationIntensity={0.3} floatIntensity={0.8}>
          <Cone args={[0.4, 0.8, 32]} position={[0, 1, -3.5]} castShadow>
            <meshStandardMaterial color={coneColor} roughness={0.2} metalness={0.7} />
          </Cone>
        </Float>
      )}
    </>
  )
}

// Particle System
function ParticleSystem() {
  const pointsRef = useRef<THREE.Points>(null)
  const groupRef = useRef<THREE.Group>(null)
  const positionsRef = useRef<Float32Array | null>(null)
  const initialPositionsRef = useRef<Float32Array | null>(null)
  
  const particleControls = useControls('Particles', {
    particlesVisible: { value: true },
    particleCount: { value: 300, min: 100, max: 1000, step: 100 },
    particleSize: { value: 0.03, min: 0.01, max: 0.1, step: 0.01 },
    particleColor: { value: '#ffaa00' },
    particleSpread: { value: 8, min: 5, max: 20, step: 1 },
    particleSpeed: { value: 0.5, min: 0, max: 2, step: 0.1 },
    particleWave: { value: false }
  })

  const {
    particlesVisible = true,
    particleCount = 300,
    particleSize = 0.03,
    particleColor = '#ffaa00',
    particleSpread = 8,
    particleSpeed = 0.5,
    particleWave = false
  } = particleControls || {}

  const particles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3)
    const initialPositions = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * particleSpread
      const y = Math.random() * particleSpread * 0.5
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

  useFrame((state) => {
    if (!groupRef.current || !particlesVisible) return
    
    const time = state.clock.getElapsedTime()
    groupRef.current.rotation.y = time * particleSpeed * 0.1
    
    if (particleWave && pointsRef.current && positionsRef.current && initialPositionsRef.current) {
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3
        positions[i3 + 1] = initialPositionsRef.current[i3 + 1] + Math.sin(time * 2 + i * 0.01) * 1
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

// XR Scene with all content
function XRScene() {
  const inAR = useXR((s) => s.mode === 'immersive-ar')
  const { isPresenting } = useXR()
  
  const controls = useControls('UI Settings', {
    ui: {
      showPanel: { value: true },
      panelScale: { value: 1.6, min: 0.5, max: 3.0, step: 0.1 },
      panelBillboard: { value: true }
    }
  })
  
  // Provide defaults if controls are not yet initialized
  const {
    showPanel = true,
    panelScale = 1.6,
    panelBillboard = true
  } = controls?.ui || {}
  
  // Fixed panel position - adjustable only via grab/move interactions
  const panelPosition = { x: 1.5, y: 1.2, z: -1.5 }

  return (
    <>
      <NonAREnvironment />
      
      {/* Floor (only in VR/non-XR mode) */}
      {!inAR && (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
            <planeGeometry args={[50, 50]} />
            <meshStandardMaterial 
              color="#101010"
              metalness={0.8}
              roughness={0.1}
            />
          </mesh>
          <gridHelper 
            args={[20, 20, '#444', '#222']} 
            position={[0, -1.99, 0]} 
          />
        </>
      )}
      
      {/* Main Objects */}
      <Hero3DObject />
      <SecondaryObjects />
      <ParticleSystem />
      
      {/* Title */}
      <Text
        position={[0, 3, -5]}
        fontSize={isPresenting ? 0.5 : 1.5}
        color="#ff6030"
        anchorX="center"
        anchorY="middle"
      >
        XREVA {inAR ? 'AR' : 'VR'} DEMO
        <meshStandardMaterial 
          color="#ff6030" 
          metalness={0.8} 
          roughness={0.2}
          emissive="#ff6030"
          emissiveIntensity={0.2}
        />
      </Text>
      
      {/* XR Control Panel */}
      {showPanel && (
        <XrevaPanelXR 
          position={[panelPosition.x, panelPosition.y, panelPosition.z]}
          rotation={[0, -0.2, 0]}
          title="XReva Controls"
          scale={panelScale}
          billboard={panelBillboard}
          grabbable={true}
          resizable={true}
          useMaterialClass="glass"
          width={700}
          height={450}
          minWidth={400}
          maxWidth={1000}
          minHeight={300}
          maxHeight={700}
          dualHandMode={false}
          handTracking={{
            enabled: true,
            gestures: {
              pinch: true,
              point: true
            }
          }}
        />
      )}
    </>
  )
}

// Main App Component
export default function XRUnifiedDemo() {
  const [xrSupported, setXrSupported] = useState({ vr: false, ar: false })
  
  useEffect(() => {
    if ('xr' in navigator && navigator.xr) {
      Promise.all([
        navigator.xr.isSessionSupported('immersive-vr'),
        navigator.xr.isSessionSupported('immersive-ar')
      ]).then(([vr, ar]) => {
        console.log('[XR] VR supported:', vr, 'AR supported:', ar)
        setXrSupported({ vr, ar })
      })
    }
  }, [])
  
  return (
    <>
      {/* XR Entry Buttons */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '1rem',
          position: 'absolute',
          zIndex: 10000,
          bottom: '1rem',
          left: '50%',
          transform: 'translate(-50%, 0)',
        }}
      >
        <button
          style={{
            background: 'white',
            borderRadius: '0.5rem',
            border: 'none',
            fontWeight: 'bold',
            color: 'black',
            padding: '1rem 2rem',
            cursor: xrSupported.ar ? 'pointer' : 'not-allowed',
            fontSize: '1.5rem',
            boxShadow: '0px 0px 20px rgba(0,0,0,1)',
            opacity: xrSupported.ar ? 1 : 0.5
          }}
          onClick={() => xrSupported.ar && xrStore.enterAR()}
          disabled={!xrSupported.ar}
        >
          {xrSupported.ar ? 'Enter AR' : 'AR Not Supported'}
        </button>
        <button
          style={{
            background: 'white',
            borderRadius: '0.5rem',
            border: 'none',
            fontWeight: 'bold',
            color: 'black',
            padding: '1rem 2rem',
            cursor: xrSupported.vr ? 'pointer' : 'not-allowed',
            fontSize: '1.5rem',
            boxShadow: '0px 0px 20px rgba(0,0,0,1)',
            opacity: xrSupported.vr ? 1 : 0.5
          }}
          onClick={() => xrSupported.vr && xrStore.enterVR()}
          disabled={!xrSupported.vr}
        >
          {xrSupported.vr ? 'Enter VR' : 'VR Not Supported'}
        </button>
      </div>
      
      {/* Canvas */}
      <Canvas
        events={noEvents}
        gl={{ 
          localClippingEnabled: true,
          alpha: true,
          preserveDrawingBuffer: true,
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          powerPreference: "high-performance"
        }}
        style={{ width: '100%', height: '100vh' }}
        camera={{ position: [0, 1.6, 3], fov: 60 }}
      >
        <PointerEvents batchEvents={false} />
        <OrbitHandles />
        
        <XR store={xrStore}>
          <XROrigin position={[0, 0, 0]} />
          <Suspense fallback={null}>
            <XRScene />
          </Suspense>
        </XR>
      </Canvas>
    </>
  )
}