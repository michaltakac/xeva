import { Suspense, useRef, useMemo, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { 
  OrbitControls, 
  Sky, 
  Environment, 
  Stats,
  MeshReflectorMaterial,
  Text
} from '@react-three/drei'
import { Root, Container, Text as UIText } from '@react-three/uikit'
import { Card, Defaults, Slider, Button, Toggle } from '@react-three/uikit-default'
import * as THREE from 'three'

// Main controllable 3D object
function Hero3DObject({ controls }: { controls: any }) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  // Create geometry based on type
  const geometry = useMemo(() => {
    switch(controls.geometryType) {
      case 'sphere':
        return <sphereGeometry args={[controls.size/2, controls.segments, controls.segments]} />
      case 'torus':
        return <torusGeometry args={[controls.size/2, controls.size/4, controls.segments, controls.segments]} />
      case 'cone':
        return <coneGeometry args={[controls.size/2, controls.size, controls.segments]} />
      case 'cylinder':
        return <cylinderGeometry args={[controls.size/3, controls.size/3, controls.size, controls.segments]} />
      case 'dodecahedron':
        return <dodecahedronGeometry args={[controls.size/2, 0]} />
      default:
        return <boxGeometry args={[controls.size, controls.size, controls.size]} />
    }
  }, [controls.geometryType, controls.size, controls.segments])

  // Animation
  useFrame((state, delta) => {
    if (!meshRef.current) return
    
    const time = state.clock.getElapsedTime()
    
    // Auto rotation
    if (controls.autoRotate) {
      meshRef.current.rotation.y += delta * controls.rotationSpeed
    }
    
    // Float effect
    if (controls.floatEffect) {
      meshRef.current.position.y = controls.positionY + Math.sin(time) * 0.3
    } else {
      meshRef.current.position.y = controls.positionY
    }
  })

  return (
    <mesh 
      ref={meshRef}
      position={[controls.positionX, controls.positionY, controls.positionZ]}
      castShadow 
      receiveShadow
    >
      {geometry}
      <meshPhysicalMaterial 
        color={controls.color}
        emissive={controls.emissive}
        emissiveIntensity={controls.emissiveIntensity}
        metalness={controls.metalness}
        roughness={controls.roughness}
        wireframe={controls.wireframe}
      />
    </mesh>
  )
}

// Control Panel using uikit-default
function ControlPanel({ controls, setControls }: { controls: any; setControls: any }) {
  return (
    <Root
      width={400}
      height={600}
      pixelSize={0.01}
      backgroundColor="#0a0a0a"
      borderRadius={16}
      padding={16}
      overflow="scroll"
    >
      <Defaults>
        <Container flexDirection="column" gap={16}>
          {/* Title */}
          <UIText fontSize={20} fontWeight="bold" color="white" textAlign="center">
            3D Object Controls
          </UIText>
          
          {/* Geometry Controls */}
          <Card padding={16} gap={12}>
            <UIText fontSize={16} fontWeight="medium" color="white">
              Geometry
            </UIText>
            
            <Container flexDirection="column" gap={8}>
              <UIText fontSize={12} color="#888">Geometry Type</UIText>
              <Container flexDirection="row" gap={8}>
                {['box', 'sphere', 'torus', 'cone'].map(type => (
                  <Button
                    key={type}
                    onClick={() => setControls({ ...controls, geometryType: type })}
                    variant={controls.geometryType === type ? 'default' : 'outline'}
                    size="sm"
                  >
                    <UIText>{type}</UIText>
                  </Button>
                ))}
              </Container>
              
              <UIText fontSize={12} color="#888">Size: {controls.size.toFixed(1)}</UIText>
              <Slider
                value={controls.size}
                onValueChange={(v: number) => setControls({ ...controls, size: v })}
                min={0.5}
                max={5}
                step={0.1}
              />
              
              <UIText fontSize={12} color="#888">Segments: {controls.segments}</UIText>
              <Slider
                value={controls.segments}
                onValueChange={(v: number) => setControls({ ...controls, segments: v })}
                min={3}
                max={64}
                step={1}
              />
            </Container>
          </Card>
          
          {/* Position Controls */}
          <Card padding={16} gap={12}>
            <UIText fontSize={16} fontWeight="medium" color="white">
              Position
            </UIText>
            
            <Container flexDirection="column" gap={8}>
              <UIText fontSize={12} color="#888">X: {controls.positionX.toFixed(1)}</UIText>
              <Slider
                value={controls.positionX}
                onValueChange={(v: number) => setControls({ ...controls, positionX: v })}
                min={-5}
                max={5}
                step={0.1}
              />
              
              <UIText fontSize={12} color="#888">Y: {controls.positionY.toFixed(1)}</UIText>
              <Slider
                value={controls.positionY}
                onValueChange={(v: number) => setControls({ ...controls, positionY: v })}
                min={-3}
                max={3}
                step={0.1}
              />
              
              <UIText fontSize={12} color="#888">Z: {controls.positionZ.toFixed(1)}</UIText>
              <Slider
                value={controls.positionZ}
                onValueChange={(v: number) => setControls({ ...controls, positionZ: v })}
                min={-5}
                max={5}
                step={0.1}
              />
            </Container>
          </Card>
          
          {/* Material Controls */}
          <Card padding={16} gap={12}>
            <UIText fontSize={16} fontWeight="medium" color="white">
              Material
            </UIText>
            
            <Container flexDirection="column" gap={8}>
              <UIText fontSize={12} color="#888">Color</UIText>
              <Container flexDirection="row" gap={8}>
                {['#ff6030', '#4080ff', '#80ff40', '#ff4080'].map(color => (
                  <Container
                    key={color}
                    width={32}
                    height={32}
                    backgroundColor={color}
                    borderRadius={8}
                    cursor="pointer"
                    onClick={() => setControls({ ...controls, color })}
                  />
                ))}
              </Container>
              
              <UIText fontSize={12} color="#888">Metalness: {controls.metalness.toFixed(2)}</UIText>
              <Slider
                value={controls.metalness}
                onValueChange={(v: number) => setControls({ ...controls, metalness: v })}
                min={0}
                max={1}
                step={0.01}
              />
              
              <UIText fontSize={12} color="#888">Roughness: {controls.roughness.toFixed(2)}</UIText>
              <Slider
                value={controls.roughness}
                onValueChange={(v: number) => setControls({ ...controls, roughness: v })}
                min={0}
                max={1}
                step={0.01}
              />
              
              <Container flexDirection="row" alignItems="center" gap={8}>
                <Toggle
                  checked={controls.wireframe}
                  onCheckedChange={(checked: boolean) => setControls({ ...controls, wireframe: checked })}
                />
                <UIText fontSize={12} color="white">Wireframe</UIText>
              </Container>
            </Container>
          </Card>
          
          {/* Animation Controls */}
          <Card padding={16} gap={12}>
            <UIText fontSize={16} fontWeight="medium" color="white">
              Animation
            </UIText>
            
            <Container flexDirection="column" gap={8}>
              <Container flexDirection="row" alignItems="center" gap={8}>
                <Toggle
                  checked={controls.autoRotate}
                  onCheckedChange={(checked: boolean) => setControls({ ...controls, autoRotate: checked })}
                />
                <UIText fontSize={12} color="white">Auto Rotate</UIText>
              </Container>
              
              <UIText fontSize={12} color="#888">Rotation Speed: {controls.rotationSpeed.toFixed(1)}</UIText>
              <Slider
                value={controls.rotationSpeed}
                onValueChange={(v: number) => setControls({ ...controls, rotationSpeed: v })}
                min={0}
                max={5}
                step={0.1}
              />
              
              <Container flexDirection="row" alignItems="center" gap={8}>
                <Toggle
                  checked={controls.floatEffect}
                  onCheckedChange={(checked: boolean) => setControls({ ...controls, floatEffect: checked })}
                />
                <UIText fontSize={12} color="white">Float Effect</UIText>
              </Container>
            </Container>
          </Card>
        </Container>
      </Defaults>
    </Root>
  )
}

// Scene component
function Scene() {
  const [controls, setControls] = useState({
    geometryType: 'box',
    size: 2,
    segments: 32,
    positionX: 0,
    positionY: 0,
    positionZ: 0,
    rotationSpeed: 1,
    color: '#ff6030',
    emissive: '#000000',
    emissiveIntensity: 0,
    metalness: 0.5,
    roughness: 0.5,
    wireframe: false,
    autoRotate: true,
    floatEffect: false
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
      <Environment preset="sunset" background />
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1} 
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
      <gridHelper 
        args={[20, 20, '#444', '#222']} 
        position={[0, -1.99, 0]} 
      />
      
      {/* Main Hero Object */}
      <Hero3DObject controls={controls} />
      
      {/* 3D Text */}
      <Text
        position={[0, 5, -5]}
        fontSize={1.5}
        color="#ff6030"
        anchorX="center"
        anchorY="middle"
      >
        UIKIT DEMO
        <meshStandardMaterial 
          color="#ff6030" 
          metalness={0.8} 
          roughness={0.2}
          emissive="#ff6030"
          emissiveIntensity={0.2}
        />
      </Text>
      
      {/* Control Panel positioned in 3D space */}
      <group position={[4, 0, 0]}>
        <ControlPanel controls={controls} setControls={setControls} />
      </group>
      
      {/* Stats */}
      <Stats />
    </>
  )
}

// Main App
function UIKitDemo() {
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

export default UIKitDemo