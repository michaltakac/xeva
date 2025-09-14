import { Suspense, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { XR, createXRStore, XROrigin } from '@react-three/xr'
import { 
  Sky, 
  Environment, 
  Float,
  Text,
  Box,
  Sphere,
  Torus
} from '@react-three/drei'
// Import from xreva package (aliased to src in vite config)
import { useControls, XrevaPanelXR } from 'xreva'
import * as THREE from 'three'

// XR Store for managing XR session
const xrStore = createXRStore({
  // Enable hand tracking for Quest 3
  hand: true,
  // Enable hit testing for AR features
  hitTest: true,
  // Enable depth sensing if available
  depthSensing: true,
  // Enable dom overlay for 2D UI elements
  domOverlay: true
})

// Main controllable 3D object with XREVA controls
function InteractiveObject() {
  const meshRef = useRef<THREE.Mesh>(null!)
  
  // Leva-style controls
  const {
    shape,
    size,
    color,
    metalness,
    roughness,
    wireframe,
    autoRotate,
    rotationSpeed,
    emissive,
    emissiveIntensity
  } = useControls('Object', {
    geometry: {
      shape: {
        value: 'box',
        options: ['box', 'sphere', 'torus', 'cone', 'cylinder']
      },
      size: { value: 0.5, min: 0.1, max: 2, step: 0.1 },
      wireframe: { value: false }
    },
    material: {
      color: { value: '#ff6030' },
      emissive: { value: '#000000' },
      emissiveIntensity: { value: 0, min: 0, max: 1, step: 0.01 },
      metalness: { value: 0.5, min: 0, max: 1, step: 0.01 },
      roughness: { value: 0.5, min: 0, max: 1, step: 0.01 }
    },
    animation: {
      autoRotate: { value: true },
      rotationSpeed: { value: 1, min: 0, max: 5, step: 0.1 }
    }
  })
  
  // Render different geometries
  const renderGeometry = () => {
    switch(shape) {
      case 'sphere':
        return <sphereGeometry args={[size, 32, 32]} />
      case 'torus':
        return <torusGeometry args={[size, size/3, 32, 32]} />
      case 'cone':
        return <coneGeometry args={[size, size * 1.5, 32]} />
      case 'cylinder':
        return <cylinderGeometry args={[size, size, size * 1.5, 32]} />
      default:
        return <boxGeometry args={[size, size, size]} />
    }
  }
  
  return (
    <Float
      speed={autoRotate ? rotationSpeed : 0}
      rotationIntensity={autoRotate ? 1 : 0}
      floatIntensity={0.5}
    >
      <mesh ref={meshRef} position={[0, 1.5, -2]} castShadow receiveShadow>
        {renderGeometry()}
        <meshPhysicalMaterial 
          color={color}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          metalness={metalness}
          roughness={roughness}
          wireframe={wireframe}
          clearcoat={0.1}
        />
      </mesh>
    </Float>
  )
}

// Environment controls
function EnvironmentSettings() {
  const {
    preset,
    showGrid,
    ambientIntensity
  } = useControls('Environment', {
    lighting: {
      preset: {
        value: 'sunset',
        options: ['sunset', 'dawn', 'night', 'warehouse', 'forest', 'apartment']
      },
      ambientIntensity: { value: 0.5, min: 0, max: 2, step: 0.1 }
    },
    effects: {
      showGrid: { value: true }
    }
  })
  
  return (
    <>
      <Sky distance={450000} />
      <Environment preset={preset as any} background />
      <ambientLight intensity={ambientIntensity} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      
      {showGrid && (
        <gridHelper args={[20, 20, '#444', '#222']} position={[0, 0, 0]} />
      )}
      
      <fog attach="fog" args={['#0a0a0a', 5, 50]} />
    </>
  )
}

// Test objects for interaction
function TestObjects() {
  return (
    <>
      <Box position={[-2, 0.5, -2]} args={[1, 1, 1]}>
        <meshStandardMaterial color="#4080ff" />
      </Box>
      
      <Sphere position={[2, 0.5, -2]} args={[0.5, 32, 32]}>
        <meshStandardMaterial color="#80ff40" />
      </Sphere>
      
      <Torus position={[0, 0.5, -4]} args={[0.5, 0.2, 32, 32]}>
        <meshStandardMaterial color="#ff4080" />
      </Torus>
      
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      
      {/* Walls for spatial anchoring tests */}
      <mesh position={[0, 2.5, -5]} receiveShadow>
        <planeGeometry args={[10, 5]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
    </>
  )
}

// XR Scene with all panels
function XRScene() {
  const [panelMode, setPanelMode] = useState<'floating' | 'anchored' | 'handheld'>('floating')
  
  return (
    <>
      {/* Main scene content */}
      <EnvironmentSettings />
      <InteractiveObject />
      <TestObjects />
      
      {/* Floating panel - dual-hand mode: left grabs, right interacts */}
      {panelMode === 'floating' && (
        <XrevaPanelXR
          position={[1.5, 1.5, -2]}
          rotation={[0, -0.3, 0]}
          title="XR Controls (Dual-Hand)"
          tabs={true}
          dualHandMode={true} // Enable left-hand grab, right-hand interact
          grabbable={{
            enabled: true,
            constraints: {
              minDistance: 0.5,
              maxDistance: 3,
              snapToGrid: true,
              gridSize: 0.1
            },
            hapticFeedback: {
              onGrab: 0.3,
              onRelease: 0.1,
              onHover: 0.05
            }
          }}
          handTracking={{
            enabled: true,
            gestures: {
              pinch: true,
              point: true
            },
            visualFeedback: {
              highlightOnHover: true,
              showRaycast: true
            }
          }}
          billboard={false}
          width={500}
          height={700}
        />
      )}
      
      {/* Wall-anchored panel */}
      {panelMode === 'anchored' && (
        <XrevaPanelXR
          position={[0, 1.5, -4.5]}
          title="Wall Panel"
          tabs={false}
          anchor={{
            type: 'wall',
            autoAlign: true,
            offset: [0, 0, 0.1]
          }}
          grabbable={false}
          handTracking={{
            enabled: true,
            gestures: {
              point: true
            }
          }}
          width={600}
          height={400}
        />
      )}
      
      {/* Controller-attached panel */}
      {panelMode === 'handheld' && (
        <>
          <XrevaPanelXR
            position={[0, 0, 0]}
            title="Left Hand"
            tabs={false}
            anchor={{
              type: 'controller',
              target: 'left',
              offset: [0, 0.15, 0],
              followTarget: true,
              smoothing: 0.2
            }}
            grabbable={false}
            width={300}
            height={200}
            scale={0.5}
          />
          
          <XrevaPanelXR
            position={[0, 0, 0]}
            title="Right Hand"
            tabs={false}
            anchor={{
              type: 'controller',
              target: 'right',
              offset: [0, 0.15, 0],
              followTarget: true,
              smoothing: 0.2
            }}
            grabbable={false}
            width={300}
            height={200}
            scale={0.5}
          />
        </>
      )}
      
      {/* Mode switcher - using regular 3D objects for now */}
      <group position={[-2, 1.5, -1]} rotation={[0, 0.3, 0]}>
          <Text
            position={[0, 0.3, 0]}
            fontSize={0.05}
            color="white"
            anchorX="center"
          >
            Select Panel Mode:
          </Text>
          
          <Box
            position={[-0.15, 0, 0]}
            args={[0.2, 0.1, 0.02]}
            onClick={() => setPanelMode('floating')}
          >
            <meshStandardMaterial color={panelMode === 'floating' ? '#4ade80' : '#666'} />
          </Box>
          <Text position={[-0.15, -0.08, 0]} fontSize={0.03} color="white" anchorX="center">
            Floating
          </Text>
          
          <Box
            position={[0, 0, 0]}
            args={[0.2, 0.1, 0.02]}
            onClick={() => setPanelMode('anchored')}
          >
            <meshStandardMaterial color={panelMode === 'anchored' ? '#4ade80' : '#666'} />
          </Box>
          <Text position={[0, -0.08, 0]} fontSize={0.03} color="white" anchorX="center">
            Anchored
          </Text>
          
          <Box
            position={[0.15, 0, 0]}
            args={[0.2, 0.1, 0.02]}
            onClick={() => setPanelMode('handheld')}
          >
            <meshStandardMaterial color={panelMode === 'handheld' ? '#4ade80' : '#666'} />
          </Box>
          <Text position={[0.15, -0.08, 0]} fontSize={0.03} color="white" anchorX="center">
            Handheld
          </Text>
      </group>
      
      {/* Instructions */}
      <Text
        position={[0, 3, -3]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        XREVA XR Demo - Quest 3
      </Text>
      
      <Text
        position={[0, 2.7, -3]}
        fontSize={0.08}
        color="#aaa"
        anchorX="center"
        anchorY="middle"
        maxWidth={3}
        textAlign="center"
      >
        Dual-Hand Mode: LEFT hand grabs panel, RIGHT hand interacts{'\n'}
        Left Grip: Grab panel | Right Trigger: Click controls{'\n'}
        Try different panel modes!
      </Text>
    </>
  )
}

// Main App component
export default function XRDemo() {
  return (
    <>
      {/* Enter XR Button */}
      <button
        onClick={() => xrStore.enterVR()}
        style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '12px 24px',
          fontSize: '18px',
          backgroundColor: '#ff6030',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          zIndex: 1000
        }}
      >
        Enter VR (Quest 3)
      </button>
      
      {/* Canvas with XR support */}
      <Canvas
        shadows
        camera={{ position: [0, 1.6, 3], fov: 60 }}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      >
        <XR store={xrStore}>
          <XROrigin />
          <Suspense fallback={null}>
            <XRScene />
          </Suspense>
        </XR>
      </Canvas>
    </>
  )
}