import { Suspense, useRef, useMemo, useState } from 'react'
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
      meshRef.current.rotation.x += delta * controls.rotationSpeed * 0.3
    }
    
    // Float effect
    if (controls.floatEffect) {
      meshRef.current.position.y = controls.positionY + Math.sin(time * controls.floatSpeed) * 0.3 * controls.floatIntensity
    } else {
      meshRef.current.position.y = controls.positionY
    }
    
    // Pulse effect
    if (controls.pulse) {
      const pulseValue = 1 + Math.sin(time * 3) * controls.pulseScale
      meshRef.current.scale.setScalar(controls.scale * pulseValue)
    } else {
      meshRef.current.scale.setScalar(controls.scale)
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
        clearcoat={controls.clearcoat}
        clearcoatRoughness={controls.clearcoatRoughness}
        wireframe={controls.wireframe}
        transparent={controls.transparent}
        opacity={controls.opacity}
      />
    </mesh>
  )
}

// Particle System
function ParticleSystem({ controls }: { controls: any }) {
  const pointsRef = useRef<THREE.Points>(null)
  
  const particles = useMemo(() => {
    const positions = new Float32Array(controls.particleCount * 3)
    for (let i = 0; i < controls.particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * controls.particleSpread
      positions[i * 3 + 1] = Math.random() * controls.particleSpread
      positions[i * 3 + 2] = (Math.random() - 0.5) * controls.particleSpread
    }
    return positions
  }, [controls.particleCount, controls.particleSpread])

  useFrame((state) => {
    if (!pointsRef.current || !controls.particlesVisible) return
    
    const time = state.clock.getElapsedTime()
    pointsRef.current.rotation.y = time * controls.particleSpeed * 0.1
    
    if (controls.particleWave) {
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < controls.particleCount; i++) {
        const i3 = i * 3
        positions[i3 + 1] = Math.sin(time + i * 0.01) * 2 + Math.random() * controls.particleSpread
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  if (!controls.particlesVisible) return null

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
        size={controls.particleSize}
        color={controls.particleColor}
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  )
}

// Secondary Objects
function SecondaryObjects({ controls }: { controls: any }) {
  return (
    <>
      {controls.showSphere && (
        <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
          <Sphere args={[0.7, 32, 32]} position={[-3, 1, -2]} castShadow>
            <meshStandardMaterial color={controls.sphereColor} roughness={0.1} metalness={0.8} />
          </Sphere>
        </Float>
      )}
      
      {controls.showTorus && (
        <Float speed={2} rotationIntensity={1} floatIntensity={0.3}>
          <Torus args={[0.6, 0.3, 32, 32]} position={[3, 1, -2]} castShadow>
            <meshStandardMaterial color={controls.torusColor} roughness={0.3} metalness={0.6} />
          </Torus>
        </Float>
      )}
      
      {controls.showCone && (
        <Float speed={1} rotationIntensity={0.3} floatIntensity={0.8}>
          <Cone args={[0.6, 1.2, 32]} position={[0, 1, -4]} castShadow>
            <meshStandardMaterial color={controls.coneColor} roughness={0.2} metalness={0.7} />
          </Cone>
        </Float>
      )}
    </>
  )
}

// Control Panel using uikit-default
function ControlPanel({ controls, setControls }: { controls: any; setControls: any }) {
  const [activeTab, setActiveTab] = useState('geometry')
  
  return (
    <Root
      width={420}
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
            3D Controls Panel
          </UIText>
          
          {/* Tab Navigation */}
          <Container flexDirection="row" gap={4} justifyContent="center">
            {['geometry', 'material', 'animation', 'particles', 'extras'].map(tab => (
              <Button
                key={tab}
                onClick={() => setActiveTab(tab)}
                variant={activeTab === tab ? 'default' : 'outline'}
                size="sm"
              >
                <UIText fontSize={10}>{tab.toUpperCase()}</UIText>
              </Button>
            ))}
          </Container>
          
          {/* Geometry Tab */}
          {activeTab === 'geometry' && (
            <Card padding={16} gap={12}>
              <UIText fontSize={16} fontWeight="medium" color="white">
                Geometry Settings
              </UIText>
              
              <Container flexDirection="column" gap={8}>
                <UIText fontSize={12} color="#888">Type</UIText>
                <Container flexDirection="row" gap={4} flexWrap="wrap">
                  {['box', 'sphere', 'torus', 'cone', 'cylinder', 'dodecahedron'].map(type => (
                    <Button
                      key={type}
                      onClick={() => setControls({ ...controls, geometryType: type })}
                      variant={controls.geometryType === type ? 'default' : 'outline'}
                      size="sm"
                    >
                      <UIText fontSize={10}>{type}</UIText>
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
                
                <UIText fontSize={12} color="#888">Scale: {controls.scale.toFixed(2)}</UIText>
                <Slider
                  value={controls.scale}
                  onValueChange={(v: number) => setControls({ ...controls, scale: v })}
                  min={0.1}
                  max={3}
                  step={0.01}
                />
                
                <UIText fontSize={12} color="#888">Position</UIText>
                {['X', 'Y', 'Z'].map(axis => (
                  <Container key={axis} flexDirection="column" gap={4}>
                    <UIText fontSize={10} color="#666">{axis}: {controls[`position${axis}`].toFixed(1)}</UIText>
                    <Slider
                      value={controls[`position${axis}`]}
                      onValueChange={(v: number) => setControls({ ...controls, [`position${axis}`]: v })}
                      min={-5}
                      max={5}
                      step={0.1}
                    />
                  </Container>
                ))}
              </Container>
            </Card>
          )}
          
          {/* Material Tab */}
          {activeTab === 'material' && (
            <Card padding={16} gap={12}>
              <UIText fontSize={16} fontWeight="medium" color="white">
                Material Properties
              </UIText>
              
              <Container flexDirection="column" gap={8}>
                <UIText fontSize={12} color="#888">Color</UIText>
                <Container flexDirection="row" gap={8} flexWrap="wrap">
                  {['#ff6030', '#4080ff', '#80ff40', '#ff4080', '#ffaa00', '#00ffaa'].map(color => (
                    <Container
                      key={color}
                      width={36}
                      height={36}
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
                
                <UIText fontSize={12} color="#888">Clearcoat: {controls.clearcoat.toFixed(2)}</UIText>
                <Slider
                  value={controls.clearcoat}
                  onValueChange={(v: number) => setControls({ ...controls, clearcoat: v })}
                  min={0}
                  max={1}
                  step={0.01}
                />
                
                <UIText fontSize={12} color="#888">Emissive Intensity: {controls.emissiveIntensity.toFixed(2)}</UIText>
                <Slider
                  value={controls.emissiveIntensity}
                  onValueChange={(v: number) => setControls({ ...controls, emissiveIntensity: v })}
                  min={0}
                  max={1}
                  step={0.01}
                />
                
                <UIText fontSize={12} color="#888">Opacity: {controls.opacity.toFixed(2)}</UIText>
                <Slider
                  value={controls.opacity}
                  onValueChange={(v: number) => setControls({ ...controls, opacity: v })}
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
                
                <Container flexDirection="row" alignItems="center" gap={8}>
                  <Toggle
                    checked={controls.transparent}
                    onCheckedChange={(checked: boolean) => setControls({ ...controls, transparent: checked })}
                  />
                  <UIText fontSize={12} color="white">Transparent</UIText>
                </Container>
              </Container>
            </Card>
          )}
          
          {/* Animation Tab */}
          {activeTab === 'animation' && (
            <Card padding={16} gap={12}>
              <UIText fontSize={16} fontWeight="medium" color="white">
                Animation Controls
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
                
                <UIText fontSize={12} color="#888">Float Speed: {controls.floatSpeed.toFixed(1)}</UIText>
                <Slider
                  value={controls.floatSpeed}
                  onValueChange={(v: number) => setControls({ ...controls, floatSpeed: v })}
                  min={0.1}
                  max={5}
                  step={0.1}
                />
                
                <UIText fontSize={12} color="#888">Float Intensity: {controls.floatIntensity.toFixed(1)}</UIText>
                <Slider
                  value={controls.floatIntensity}
                  onValueChange={(v: number) => setControls({ ...controls, floatIntensity: v })}
                  min={0}
                  max={3}
                  step={0.1}
                />
                
                <Container flexDirection="row" alignItems="center" gap={8}>
                  <Toggle
                    checked={controls.pulse}
                    onCheckedChange={(checked: boolean) => setControls({ ...controls, pulse: checked })}
                  />
                  <UIText fontSize={12} color="white">Pulse Effect</UIText>
                </Container>
                
                <UIText fontSize={12} color="#888">Pulse Scale: {controls.pulseScale.toFixed(2)}</UIText>
                <Slider
                  value={controls.pulseScale}
                  onValueChange={(v: number) => setControls({ ...controls, pulseScale: v })}
                  min={0}
                  max={0.5}
                  step={0.01}
                />
              </Container>
            </Card>
          )}
          
          {/* Particles Tab */}
          {activeTab === 'particles' && (
            <Card padding={16} gap={12}>
              <UIText fontSize={16} fontWeight="medium" color="white">
                Particle System
              </UIText>
              
              <Container flexDirection="column" gap={8}>
                <Container flexDirection="row" alignItems="center" gap={8}>
                  <Toggle
                    checked={controls.particlesVisible}
                    onCheckedChange={(checked: boolean) => setControls({ ...controls, particlesVisible: checked })}
                  />
                  <UIText fontSize={12} color="white">Show Particles</UIText>
                </Container>
                
                <UIText fontSize={12} color="#888">Count: {controls.particleCount}</UIText>
                <Slider
                  value={controls.particleCount}
                  onValueChange={(v: number) => setControls({ ...controls, particleCount: Math.round(v) })}
                  min={100}
                  max={2000}
                  step={100}
                />
                
                <UIText fontSize={12} color="#888">Size: {controls.particleSize.toFixed(2)}</UIText>
                <Slider
                  value={controls.particleSize}
                  onValueChange={(v: number) => setControls({ ...controls, particleSize: v })}
                  min={0.01}
                  max={0.2}
                  step={0.01}
                />
                
                <UIText fontSize={12} color="#888">Spread: {controls.particleSpread}</UIText>
                <Slider
                  value={controls.particleSpread}
                  onValueChange={(v: number) => setControls({ ...controls, particleSpread: v })}
                  min={5}
                  max={20}
                  step={1}
                />
                
                <UIText fontSize={12} color="#888">Speed: {controls.particleSpeed.toFixed(1)}</UIText>
                <Slider
                  value={controls.particleSpeed}
                  onValueChange={(v: number) => setControls({ ...controls, particleSpeed: v })}
                  min={0}
                  max={2}
                  step={0.1}
                />
                
                <UIText fontSize={12} color="#888">Color</UIText>
                <Container flexDirection="row" gap={8}>
                  {['#ffaa00', '#ff00ff', '#00ffff', '#ffff00'].map(color => (
                    <Container
                      key={color}
                      width={32}
                      height={32}
                      backgroundColor={color}
                      borderRadius={8}
                      cursor="pointer"
                      onClick={() => setControls({ ...controls, particleColor: color })}
                    />
                  ))}
                </Container>
                
                <Container flexDirection="row" alignItems="center" gap={8}>
                  <Toggle
                    checked={controls.particleWave}
                    onCheckedChange={(checked: boolean) => setControls({ ...controls, particleWave: checked })}
                  />
                  <UIText fontSize={12} color="white">Wave Animation</UIText>
                </Container>
              </Container>
            </Card>
          )}
          
          {/* Extras Tab */}
          {activeTab === 'extras' && (
            <Card padding={16} gap={12}>
              <UIText fontSize={16} fontWeight="medium" color="white">
                Extra Objects & Scene
              </UIText>
              
              <Container flexDirection="column" gap={8}>
                <Container flexDirection="row" alignItems="center" gap={8}>
                  <Toggle
                    checked={controls.showSphere}
                    onCheckedChange={(checked: boolean) => setControls({ ...controls, showSphere: checked })}
                  />
                  <UIText fontSize={12} color="white">Show Sphere</UIText>
                </Container>
                
                <Container flexDirection="row" alignItems="center" gap={8}>
                  <Toggle
                    checked={controls.showTorus}
                    onCheckedChange={(checked: boolean) => setControls({ ...controls, showTorus: checked })}
                  />
                  <UIText fontSize={12} color="white">Show Torus</UIText>
                </Container>
                
                <Container flexDirection="row" alignItems="center" gap={8}>
                  <Toggle
                    checked={controls.showCone}
                    onCheckedChange={(checked: boolean) => setControls({ ...controls, showCone: checked })}
                  />
                  <UIText fontSize={12} color="white">Show Cone</UIText>
                </Container>
                
                <Container flexDirection="row" alignItems="center" gap={8}>
                  <Toggle
                    checked={controls.showGrid}
                    onCheckedChange={(checked: boolean) => setControls({ ...controls, showGrid: checked })}
                  />
                  <UIText fontSize={12} color="white">Show Grid</UIText>
                </Container>
                
                <Container flexDirection="row" alignItems="center" gap={8}>
                  <Toggle
                    checked={controls.showStats}
                    onCheckedChange={(checked: boolean) => setControls({ ...controls, showStats: checked })}
                  />
                  <UIText fontSize={12} color="white">Show Stats</UIText>
                </Container>
                
                <UIText fontSize={12} color="#888">Environment</UIText>
                <Container flexDirection="row" gap={4} flexWrap="wrap">
                  {['sunset', 'dawn', 'night', 'warehouse', 'forest'].map(env => (
                    <Button
                      key={env}
                      onClick={() => setControls({ ...controls, environment: env })}
                      variant={controls.environment === env ? 'default' : 'outline'}
                      size="sm"
                    >
                      <UIText fontSize={10}>{env}</UIText>
                    </Button>
                  ))}
                </Container>
              </Container>
            </Card>
          )}
        </Container>
      </Defaults>
    </Root>
  )
}

// Scene component
function Scene() {
  const [controls, setControls] = useState({
    // Geometry
    geometryType: 'box',
    size: 2,
    segments: 32,
    scale: 1,
    positionX: 0,
    positionY: 0,
    positionZ: 0,
    
    // Material
    color: '#ff6030',
    emissive: '#000000',
    emissiveIntensity: 0,
    metalness: 0.5,
    roughness: 0.5,
    clearcoat: 0,
    clearcoatRoughness: 0,
    wireframe: false,
    transparent: false,
    opacity: 1,
    
    // Animation
    autoRotate: true,
    rotationSpeed: 1,
    floatEffect: false,
    floatSpeed: 1,
    floatIntensity: 1,
    pulse: false,
    pulseScale: 0.1,
    
    // Particles
    particlesVisible: true,
    particleCount: 500,
    particleSize: 0.05,
    particleColor: '#ffaa00',
    particleSpread: 10,
    particleSpeed: 0.5,
    particleWave: false,
    
    // Extras
    showSphere: true,
    sphereColor: '#4080ff',
    showTorus: true,
    torusColor: '#ff4080',
    showCone: true,
    coneColor: '#80ff40',
    showGrid: true,
    showStats: true,
    environment: 'sunset'
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
      <Environment preset={controls.environment as any} background />
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
      {controls.showGrid && (
        <gridHelper 
          args={[20, 20, '#444', '#222']} 
          position={[0, -1.99, 0]} 
        />
      )}
      
      {/* Main Hero Object */}
      <Hero3DObject controls={controls} />
      
      {/* Secondary Objects */}
      <SecondaryObjects controls={controls} />
      
      {/* Particle System */}
      <ParticleSystem controls={controls} />
      
      {/* 3D Text */}
      <Text
        position={[0, 5, -5]}
        fontSize={1.5}
        color="#ff6030"
        anchorX="center"
        anchorY="middle"
      >
        ENHANCED DEMO
        <meshStandardMaterial 
          color="#ff6030" 
          metalness={0.8} 
          roughness={0.2}
          emissive="#ff6030"
          emissiveIntensity={0.2}
        />
      </Text>
      
      {/* Control Panel positioned in 3D space */}
      <group position={[4.5, 0, 0]}>
        <ControlPanel controls={controls} setControls={setControls} />
      </group>
      
      {/* Stats */}
      {controls.showStats && <Stats />}
    </>
  )
}

// Main App
function EnhancedUIKitDemo() {
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

export default EnhancedUIKitDemo