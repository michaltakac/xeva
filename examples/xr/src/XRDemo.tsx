import { Suspense, useRef, useState, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { XR, createXRStore, XROrigin, useXR } from '@react-three/xr'
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

// XR Store for managing VR session with pass-through
// Quest 3 uses immersive-vr with blend-mode for pass-through
const xrStore = createXRStore({
  // Enable hand tracking for Quest 3
  hand: true,
  // Enable controller tracking
  controller: true,
  // Disable features not needed for basic pass-through
  hitTest: false,
  anchors: false,
  depthSensing: false,
  // Disable dom overlay
  domOverlay: false,
  // Add foveation for better performance
  foveation: 1,
  // Use VR mode (Quest 3 pass-through uses VR with blend mode)
  mode: 'immersive-vr',
  // Request features for pass-through
  sessionInit: {
    optionalFeatures: [
      'local-floor',
      'bounded-floor',
      'hand-tracking',
      'layers'
    ],
    requiredFeatures: []
  }
})

// Add error event listeners
xrStore.subscribe((state) => {
  if (state.session) {
    console.log('[XR] Session created:', state.session);
    
    state.session.addEventListener('end', () => {
      console.log('[XR] Session ended');
    });
    
    state.session.addEventListener('inputsourceschange', (event) => {
      console.log('[XR] Input sources changed:', event);
    });
    
    state.session.addEventListener('visibilitychange', () => {
      console.log('[XR] Visibility changed:', state.session.visibilityState);
    });
  }
})

// Main controllable 3D object with XREVA controls
function InteractiveObject() {
  const meshRef = useRef<THREE.Mesh>(null!)
  
  // Leva-style controls
  const {
    geometry: {
      shape,
      size,
      wireframe
    },
    material: {
      color,
      metalness,
      roughness,
      emissive,
      emissiveIntensity
    },
    animation: {
      autoRotate,
      rotationSpeed
    }
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

// Environment controls for AR (no backgrounds)
function EnvironmentSettings() {
  const {
    lighting: {
      ambientIntensity,
      directionalIntensity
    },
    helpers: {
      showGrid,
      showAxes
    }
  } = useControls('AR Environment', {
    lighting: {
      ambientIntensity: { value: 0.7, min: 0, max: 2, step: 0.1, label: 'Ambient Light' },
      directionalIntensity: { value: 0.5, min: 0, max: 2, step: 0.1, label: 'Directional Light' }
    },
    helpers: {
      showGrid: { value: false, label: 'Show Grid' },
      showAxes: { value: false, label: 'Show Axes' }
    }
  })
  
  return (
    <>
      {/* No Sky or Environment background in AR mode - pass-through shows real world */}
      {/* Only lighting to illuminate virtual objects */}
      <ambientLight intensity={ambientIntensity} />
      <directionalLight 
        position={[5, 10, 5]} 
        intensity={directionalIntensity} 
        castShadow 
        shadow-mapSize={[1024, 1024]}
      />
      
      {/* Optional helpers for debugging spatial positioning */}
      {showGrid && (
        <gridHelper args={[10, 10, '#666', '#333']} position={[0, 0, 0]} />
      )}
      
      {showAxes && (
        <axesHelper args={[2]} />
      )}
    </>
  )
}

// AR objects positioned in space (no floor/walls - we see real environment)
function TestObjects() {
  const {
    objects: {
      showCube,
      showSphere,
      showTorus,
      objectHeight
    }
  } = useControls('AR Objects', {
    objects: {
      showCube: { value: true, label: 'Show Cube' },
      showSphere: { value: true, label: 'Show Sphere' },
      showTorus: { value: true, label: 'Show Torus' },
      objectHeight: { value: 1.2, min: 0.5, max: 2.5, step: 0.1, label: 'Height from Floor' }
    }
  })
  
  return (
    <>
      {/* Virtual objects positioned at user-defined height */}
      {showCube && (
        <Box position={[-1.5, objectHeight, -2]} args={[0.4, 0.4, 0.4]}>
          <meshStandardMaterial 
            color="#4080ff" 
            metalness={0.5} 
            roughness={0.3}
            transparent
            opacity={0.9} 
          />
        </Box>
      )}
      
      {showSphere && (
        <Sphere position={[1.5, objectHeight, -2]} args={[0.3, 32, 32]}>
          <meshStandardMaterial 
            color="#80ff40" 
            metalness={0.5} 
            roughness={0.3}
            transparent
            opacity={0.9} 
          />
        </Sphere>
      )}
      
      {showTorus && (
        <Torus position={[0, objectHeight, -3]} args={[0.3, 0.12, 32, 32]}>
          <meshStandardMaterial 
            color="#ff4080" 
            metalness={0.5} 
            roughness={0.3}
            transparent
            opacity={0.9} 
          />
        </Torus>
      )}
      
      {/* No floor or walls - pass-through shows real environment */}
    </>
  )
}

// Pass-through enabler for Quest 3 with debugging
function PassthroughEnabler() {
  const { gl, scene } = useThree()
  const { session, isPresenting } = useXR()
  const [debugInfo, setDebugInfo] = useState<string>('')
  
  useEffect(() => {
    console.log('[PassthroughEnabler] isPresenting:', isPresenting, 'session:', session)
    
    if (isPresenting && session) {
      // Set transparent background for pass-through
      scene.background = null
      gl.setClearColor(0x000000, 0)
      
      // Log session properties for debugging
      const info = [
        `Session Mode: ${session.mode || 'unknown'}`,
        `Environment Blend: ${session.environmentBlendMode || 'not available'}`,
        `Visibility: ${session.visibilityState || 'unknown'}`,
        `Rendering State: ${session.renderState ? 'available' : 'not available'}`,
        `Base Layer: ${session.renderState?.baseLayer ? 'set' : 'not set'}`,
      ].join('\n')
      
      setDebugInfo(info)
      console.log('[PassthroughEnabler] Session info:\n', info)
      
      // Check if we're in the right mode for Quest 3
      if (session.environmentBlendMode === 'opaque') {
        console.warn('[PassthroughEnabler] Environment blend mode is opaque - pass-through may not work')
      }
    } else {
      setDebugInfo('')
    }
  }, [isPresenting, session, gl, scene])
  
  // Show debug info in XR
  if (isPresenting && debugInfo) {
    return (
      <Text
        position={[0, 0.5, -1]}
        fontSize={0.03}
        color="#00ff00"
        anchorX="center"
        anchorY="middle"
        maxWidth={2}
      >
        {debugInfo}
      </Text>
    )
  }
  
  return null
}

// XR Scene with all panels and error handling
function XRScene() {
  const [panelMode, setPanelMode] = useState<'floating' | 'anchored' | 'handheld'>('floating')
  const { session, isPresenting } = useXR()
  
  // Log scene mounting
  useEffect(() => {
    console.log('[XRScene] Mounted, isPresenting:', isPresenting)
    return () => {
      console.log('[XRScene] Unmounted')
    }
  }, [])
  
  useEffect(() => {
    console.log('[XRScene] Presentation state changed:', isPresenting)
  }, [isPresenting])
  
  return (
    <>
      {/* Enable pass-through */}
      <PassthroughEnabler />
      
      {/* Basic test content first to ensure XR works */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={0.5} />
      
      {/* Simple test object to verify pass-through */}
      <Box position={[0, 1.5, -2]} args={[0.5, 0.5, 0.5]}>
        <meshStandardMaterial color="#ff6030" />
      </Box>
      
      {/* Main scene content - commented out temporarily for testing */}
      {/* <EnvironmentSettings /> */}
      {/* <InteractiveObject /> */}
      {/* <TestObjects /> */}
      
      {/* Simplified floating panel for testing */}
      {panelMode === 'floating' && (
        <XrevaPanelXR
          position={[0, 1.2, -1.5]}
          rotation={[0, 0, 0]}
          title="Test Panel"
          tabs={false}
          grabbable={false}
          handTracking={false}
          billboard={false}
          width={400}
          height={300}
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
      
      {/* Mode switcher - commented out for testing */}
      {/* <group position={[-2, 1.5, -1]} rotation={[0, 0.3, 0]}>
      </group> */}
      
      {/* Simple title */}
      <Text
        position={[0, 2.5, -2]}
        fontSize={0.1}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        XReva AR Test
      </Text>
    </>
  )
}

// Main App component
export default function XRDemo() {
  const [xrSupported, setXrSupported] = useState(false)
  
  useEffect(() => {
    // Check for VR support (Quest 3 pass-through uses VR mode)
    if ('xr' in navigator) {
      navigator.xr?.isSessionSupported('immersive-vr').then((supported) => {
        console.log('[XR] VR session supported:', supported)
        setXrSupported(supported)
        
        // Also log available session modes for debugging
        if (navigator.xr) {
          navigator.xr.isSessionSupported('immersive-ar').then((arSupported) => {
            console.log('[XR] AR session supported:', arSupported)
          })
        }
      })
    }
  }, [])
  
  return (
    <>
      {/* Enter XR Button */}
      <button
        onClick={async () => {
          // Check if running on actual device vs emulator
          const isEmulator = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1'
          
          if (!xrSupported && isEmulator) {
            alert('WebXR not supported. Please use a WebXR-compatible browser or headset.')
            return
          }
          
          console.log('[XR] Attempting to enter VR mode...')
          
          try {
            await xrStore.enterVR() // Quest 3 pass-through uses VR mode
            console.log('[XR] Successfully requested VR session')
          } catch (error) {
            console.error('[XR] Failed to enter VR:', error)
            alert(`Failed to enter VR: ${error.message || error}`)
          }
        }}
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
        {xrSupported ? 'Enter AR Pass-through' : 'AR Not Supported (Use Quest 3)'}
      </button>
      
      {/* Canvas with AR support and transparent background */}
      <Canvas
        shadows
        camera={{ position: [0, 1.6, 3], fov: 60 }}
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%',
          background: 'transparent'
        }}
        gl={{ 
          antialias: true,
          alpha: true, // Enable transparency for AR
          preserveDrawingBuffer: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
          powerPreference: "high-performance",
          xrCompatible: true // Ensure XR compatibility
        }}
        dpr={[1, 2]}
      >
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
