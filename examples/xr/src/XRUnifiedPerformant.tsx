import { Suspense, useRef, useEffect, useState, useMemo } from 'react'
import { Signal, signal, computed } from '@preact/signals-react'
import { Canvas, useFrame } from '@react-three/fiber'
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

// Create signals for all controls to avoid re-renders
// Environment signals
const environment = signal('sunset')
const envIntensity = signal(1)
const backgroundColor = signal('#1a1a2e')

// Main object geometry signals
const geometryType = signal('box')
const size = signal(1)
const segments = signal(32)
const scale = signal(1)
const positionX = signal(0)
const positionY = signal(0)
const positionZ = signal(-2)

// Main object material signals
const color = signal('#ff6030')
const emissive = signal('#000000')
const emissiveIntensity = signal(0)
const metalness = signal(0.5)
const roughness = signal(0.5)
const clearcoat = signal(0)
const wireframe = signal(false)
const transparent = signal(false)
const opacity = signal(1)

// Animation signals
const autoRotate = signal(true)
const rotationSpeed = signal(1)
const floatEffect = signal(false)
const floatSpeed = signal(1)
const floatIntensity = signal(1)
const pulse = signal(false)
const pulseScale = signal(0.1)

// Secondary objects signals
const showSphere = signal(true)
const sphereColor = signal('#4080ff')
const showTorus = signal(true)
const torusColor = signal('#ff4080')
const showCone = signal(true)
const coneColor = signal('#80ff40')

// Particles signals
const particlesVisible = signal(true)
const particleCount = signal(300)
const particleSize = signal(0.03)
const particleColor = signal('#ffaa00')
const particleSpread = signal(8)
const particleSpeed = signal(0.5)
const particleWave = signal(false)

// UI signals
const showPanel = signal(true)
const panelPositionX = signal(1.5)
const panelPositionY = signal(1.2)
const panelPositionZ = signal(-1.5)
const panelScale = signal(0.8)
const panelBillboard = signal(true)

// Environment component that adapts to AR/VR mode
function NonAREnvironment() {
  const inAR = useXR((s) => s.mode === 'immersive-ar')
  
  // Set up controls that update signals
  useControls('Environment', {
    scene: {
      environment: {
        value: environment.value,
        options: ['sunset', 'dawn', 'night', 'warehouse', 'forest', 'apartment', 'studio', 'city', 'park', 'lobby'],
        onChange: (v: string) => { environment.value = v }
      },
      envIntensity: { 
        value: envIntensity.value, 
        min: 0, 
        max: 3, 
        step: 0.1,
        onChange: (v: number) => { envIntensity.value = v }
      },
      backgroundColor: { 
        value: backgroundColor.value,
        onChange: (v: string) => { backgroundColor.value = v }
      }
    }
  })
  
  if (inAR) {
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
  
  return (
    <>
      <color attach="background" args={[backgroundColor.value]} />
      <fog attach="fog" args={[backgroundColor.value, 10, 100]} />
      
      {['sunset', 'dawn', 'night', 'forest', 'park'].includes(environment.value) && (
        <Sky 
          distance={450000}
          sunPosition={[0, 1, 0]}
          inclination={0}
          azimuth={0.25}
        />
      )}
      
      <Environment 
        preset={environment.value as any} 
        background={!['sunset', 'dawn', 'night', 'forest', 'park'].includes(environment.value)}
        environmentIntensity={envIntensity.value}
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

// Main controllable 3D object - optimized with signals
function Hero3DObject() {
  const meshRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  
  // Set up controls that update signals
  useControls('Main Object', {
    geometry: {
      geometryType: {
        value: geometryType.value,
        options: ['box', 'sphere', 'torus', 'cone', 'cylinder', 'dodecahedron'],
        onChange: (v: string) => { geometryType.value = v }
      },
      size: { 
        value: size.value, 
        min: 0.5, 
        max: 3, 
        step: 0.1,
        onChange: (v: number) => { size.value = v }
      },
      segments: { 
        value: segments.value, 
        min: 3, 
        max: 64, 
        step: 1,
        onChange: (v: number) => { segments.value = v }
      },
      scale: { 
        value: scale.value, 
        min: 0.1, 
        max: 3, 
        step: 0.01,
        onChange: (v: number) => { scale.value = v }
      },
      positionX: { 
        value: positionX.value, 
        min: -5, 
        max: 5, 
        step: 0.1,
        onChange: (v: number) => { positionX.value = v }
      },
      positionY: { 
        value: positionY.value, 
        min: -3, 
        max: 3, 
        step: 0.1,
        onChange: (v: number) => { positionY.value = v }
      },
      positionZ: { 
        value: positionZ.value, 
        min: -5, 
        max: 5, 
        step: 0.1,
        onChange: (v: number) => { positionZ.value = v }
      }
    },
    material: {
      color: { 
        value: color.value,
        onChange: (v: string) => { color.value = v }
      },
      emissive: { 
        value: emissive.value,
        onChange: (v: string) => { emissive.value = v }
      },
      emissiveIntensity: { 
        value: emissiveIntensity.value, 
        min: 0, 
        max: 1, 
        step: 0.01,
        onChange: (v: number) => { emissiveIntensity.value = v }
      },
      metalness: { 
        value: metalness.value, 
        min: 0, 
        max: 1, 
        step: 0.01,
        onChange: (v: number) => { metalness.value = v }
      },
      roughness: { 
        value: roughness.value, 
        min: 0, 
        max: 1, 
        step: 0.01,
        onChange: (v: number) => { roughness.value = v }
      },
      clearcoat: { 
        value: clearcoat.value, 
        min: 0, 
        max: 1, 
        step: 0.01,
        onChange: (v: number) => { clearcoat.value = v }
      },
      wireframe: { 
        value: wireframe.value,
        onChange: (v: boolean) => { wireframe.value = v }
      },
      transparent: { 
        value: transparent.value,
        onChange: (v: boolean) => { transparent.value = v }
      },
      opacity: { 
        value: opacity.value, 
        min: 0, 
        max: 1, 
        step: 0.01,
        onChange: (v: number) => { opacity.value = v }
      }
    },
    animation: {
      autoRotate: { 
        value: autoRotate.value,
        onChange: (v: boolean) => { autoRotate.value = v }
      },
      rotationSpeed: { 
        value: rotationSpeed.value, 
        min: 0, 
        max: 5, 
        step: 0.1,
        onChange: (v: number) => { rotationSpeed.value = v }
      },
      floatEffect: { 
        value: floatEffect.value,
        onChange: (v: boolean) => { floatEffect.value = v }
      },
      floatSpeed: { 
        value: floatSpeed.value, 
        min: 0.1, 
        max: 5, 
        step: 0.1,
        onChange: (v: number) => { floatSpeed.value = v }
      },
      floatIntensity: { 
        value: floatIntensity.value, 
        min: 0, 
        max: 3, 
        step: 0.1,
        onChange: (v: number) => { floatIntensity.value = v }
      },
      pulse: { 
        value: pulse.value,
        onChange: (v: boolean) => { pulse.value = v }
      },
      pulseScale: { 
        value: pulseScale.value, 
        min: 0, 
        max: 0.5, 
        step: 0.01,
        onChange: (v: number) => { pulseScale.value = v }
      }
    }
  })

  // Memoized geometry that only updates when signal changes
  const geometry = useMemo(() => {
    const type = geometryType.value
    const s = size.value
    const seg = segments.value
    
    switch(type) {
      case 'sphere':
        return <sphereGeometry args={[s/2, seg, seg]} />
      case 'torus':
        return <torusGeometry args={[s/2, s/4, seg, seg]} />
      case 'cone':
        return <coneGeometry args={[s/2, s, seg]} />
      case 'cylinder':
        return <cylinderGeometry args={[s/3, s/3, s, seg]} />
      case 'dodecahedron':
        return <dodecahedronGeometry args={[s/2, 0]} />
      default:
        return <boxGeometry args={[s, s, s]} />
    }
  }, [geometryType.value, size.value, segments.value])

  // Animation using signals directly - no re-renders!
  useFrame((state, delta) => {
    if (!groupRef.current) return
    
    const time = state.clock.getElapsedTime()
    
    // Read signals directly in animation loop
    if (autoRotate.value) {
      groupRef.current.rotation.y += delta * rotationSpeed.value
      groupRef.current.rotation.x += delta * rotationSpeed.value * 0.3
    }
    
    if (floatEffect.value) {
      groupRef.current.position.y = positionY.value + Math.sin(time * floatSpeed.value) * 0.3 * floatIntensity.value
    } else {
      groupRef.current.position.y = positionY.value
    }
    
    if (pulse.value) {
      const pulseValue = 1 + Math.sin(time * 3) * pulseScale.value
      groupRef.current.scale.setScalar(scale.value * pulseValue)
    } else {
      groupRef.current.scale.setScalar(scale.value)
    }
    
    // Update position directly from signals
    groupRef.current.position.x = positionX.value
    groupRef.current.position.z = positionZ.value
  })

  return (
    <group ref={groupRef} position={[positionX.value, positionY.value, positionZ.value]}>
      <mesh ref={meshRef} castShadow receiveShadow>
        {geometry}
        <meshPhysicalMaterial 
          color={color.value}
          emissive={emissive.value}
          emissiveIntensity={emissiveIntensity.value}
          metalness={metalness.value}
          roughness={roughness.value}
          clearcoat={clearcoat.value}
          wireframe={wireframe.value}
          transparent={transparent.value}
          opacity={opacity.value}
        />
      </mesh>
    </group>
  )
}

// Secondary Objects with signals
function SecondaryObjects() {
  useControls('Extra Objects', {
    objects: {
      showSphere: { 
        value: showSphere.value,
        onChange: (v: boolean) => { showSphere.value = v }
      },
      sphereColor: { 
        value: sphereColor.value,
        onChange: (v: string) => { sphereColor.value = v }
      },
      showTorus: { 
        value: showTorus.value,
        onChange: (v: boolean) => { showTorus.value = v }
      },
      torusColor: { 
        value: torusColor.value,
        onChange: (v: string) => { torusColor.value = v }
      },
      showCone: { 
        value: showCone.value,
        onChange: (v: boolean) => { showCone.value = v }
      },
      coneColor: { 
        value: coneColor.value,
        onChange: (v: string) => { coneColor.value = v }
      }
    }
  })

  return (
    <>
      {showSphere.value && (
        <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
          <Sphere args={[0.5, 32, 32]} position={[-2, 1, -2]} castShadow>
            <meshStandardMaterial color={sphereColor.value} roughness={0.1} metalness={0.8} />
          </Sphere>
        </Float>
      )}
      
      {showTorus.value && (
        <Float speed={2} rotationIntensity={1} floatIntensity={0.3}>
          <Torus args={[0.4, 0.2, 32, 32]} position={[2, 1, -2]} castShadow>
            <meshStandardMaterial color={torusColor.value} roughness={0.3} metalness={0.6} />
          </Torus>
        </Float>
      )}
      
      {showCone.value && (
        <Float speed={1} rotationIntensity={0.3} floatIntensity={0.8}>
          <Cone args={[0.4, 0.8, 32]} position={[0, 1, -3.5]} castShadow>
            <meshStandardMaterial color={coneColor.value} roughness={0.2} metalness={0.7} />
          </Cone>
        </Float>
      )}
    </>
  )
}

// Particle System optimized with signals
function ParticleSystem() {
  const pointsRef = useRef<THREE.Points>(null)
  const groupRef = useRef<THREE.Group>(null)
  const positionsRef = useRef<Float32Array | null>(null)
  const initialPositionsRef = useRef<Float32Array | null>(null)
  
  useControls('Particles', {
    particlesVisible: { 
      value: particlesVisible.value,
      onChange: (v: boolean) => { particlesVisible.value = v }
    },
    particleCount: { 
      value: particleCount.value, 
      min: 100, 
      max: 1000, 
      step: 100,
      onChange: (v: number) => { particleCount.value = v }
    },
    particleSize: { 
      value: particleSize.value, 
      min: 0.01, 
      max: 0.1, 
      step: 0.01,
      onChange: (v: number) => { particleSize.value = v }
    },
    particleColor: { 
      value: particleColor.value,
      onChange: (v: string) => { particleColor.value = v }
    },
    particleSpread: { 
      value: particleSpread.value, 
      min: 5, 
      max: 20, 
      step: 1,
      onChange: (v: number) => { particleSpread.value = v }
    },
    particleSpeed: { 
      value: particleSpeed.value, 
      min: 0, 
      max: 2, 
      step: 0.1,
      onChange: (v: number) => { particleSpeed.value = v }
    },
    particleWave: { 
      value: particleWave.value,
      onChange: (v: boolean) => { particleWave.value = v }
    }
  })

  const particles = useMemo(() => {
    const count = particleCount.value
    const spread = particleSpread.value
    const positions = new Float32Array(count * 3)
    const initialPositions = new Float32Array(count * 3)
    
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * spread
      const y = Math.random() * spread * 0.5
      const z = (Math.random() - 0.5) * spread
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
  }, [particleCount.value, particleSpread.value])

  // Optimized animation using signals directly
  useFrame((state) => {
    if (!groupRef.current || !particlesVisible.value) return
    
    const time = state.clock.getElapsedTime()
    groupRef.current.rotation.y = time * particleSpeed.value * 0.1
    
    if (particleWave.value && pointsRef.current && positionsRef.current && initialPositionsRef.current) {
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array
      const count = particleCount.value
      for (let i = 0; i < count; i++) {
        const i3 = i * 3
        positions[i3 + 1] = initialPositionsRef.current[i3 + 1] + Math.sin(time * 2 + i * 0.01) * 1
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  if (!particlesVisible.value) return null

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
          size={particleSize.value}
          color={particleColor.value}
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
  const isPresenting = useXR((s) => s.session !== null)
  
  useControls('UI Settings', {
    ui: {
      showPanel: { 
        value: showPanel.value,
        onChange: (v: boolean) => { showPanel.value = v }
      },
      panelPosition: { 
        value: { 
          x: panelPositionX.value, 
          y: panelPositionY.value, 
          z: panelPositionZ.value 
        },
        onChange: (v: { x: number; y: number; z: number }) => {
          panelPositionX.value = v.x
          panelPositionY.value = v.y
          panelPositionZ.value = v.z
        }
      },
      panelScale: { 
        value: panelScale.value, 
        min: 0.5, 
        max: 1.5, 
        step: 0.1,
        onChange: (v: number) => { panelScale.value = v }
      },
      panelBillboard: { 
        value: panelBillboard.value,
        onChange: (v: boolean) => { panelBillboard.value = v }
      }
    }
  })

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
      {showPanel.value && (
        <XrevaPanelXR 
          position={[panelPositionX.value, panelPositionY.value, panelPositionZ.value]}
          rotation={[0, -0.2, 0]}
          title="XReva Controls"
          tabs={true}
          scale={panelScale.value}
          billboard={panelBillboard.value}
          grabbable={true}
          resizable={true}
          showSidePanel={true}
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
export default function XRUnifiedPerformant() {
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