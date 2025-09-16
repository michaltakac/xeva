import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import Stats from 'stats.js'

// Custom FPS Stats component that works with React 19
export function FPSStats() {
  const statsRef = useRef<Stats>()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    // Create stats instance
    statsRef.current = new Stats()
    statsRef.current.showPanel(0) // 0: fps, 1: ms, 2: mb
    
    // Style the stats panel
    const dom = statsRef.current.dom
    dom.style.position = 'absolute'
    dom.style.top = '10px'
    dom.style.left = '10px'
    dom.style.zIndex = '100'
    
    // Add to DOM
    document.body.appendChild(dom)
    setMounted(true)
    
    // Cleanup
    return () => {
      if (dom.parentNode) {
        dom.parentNode.removeChild(dom)
      }
    }
  }, [])
  
  // Update stats every frame
  useFrame(() => {
    if (statsRef.current) {
      statsRef.current.update()
    }
  })
  
  return null
}

// Alternative lightweight FPS display using React only
export function SimpleFPSCounter() {
  const [fps, setFps] = useState(0)
  const frameCount = useRef(0)
  const lastTime = useRef(performance.now())
  
  useFrame(() => {
    frameCount.current++
    const currentTime = performance.now()
    
    // Update FPS every second
    if (currentTime >= lastTime.current + 1000) {
      setFps(Math.round((frameCount.current * 1000) / (currentTime - lastTime.current)))
      frameCount.current = 0
      lastTime.current = currentTime
    }
  })
  
  return null // The FPS is set in state, parent component can display it
}

// HTML overlay component for FPS display
export function FPSOverlay() {
  const [fps, setFps] = useState(0)
  const frameCount = useRef(0)
  const lastTime = useRef(performance.now())
  
  useEffect(() => {
    let animationId: number
    
    const updateFPS = () => {
      frameCount.current++
      const currentTime = performance.now()
      
      if (currentTime >= lastTime.current + 1000) {
        setFps(Math.round((frameCount.current * 1000) / (currentTime - lastTime.current)))
        frameCount.current = 0
        lastTime.current = currentTime
      }
      
      animationId = requestAnimationFrame(updateFPS)
    }
    
    animationId = requestAnimationFrame(updateFPS)
    
    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [])
  
  return (
    <div
      style={{
        position: 'absolute',
        top: 10,
        left: 10,
        padding: '8px 12px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: fps >= 55 ? '#0f0' : fps >= 30 ? '#ff0' : '#f00',
        fontFamily: 'monospace',
        fontSize: '14px',
        fontWeight: 'bold',
        borderRadius: '4px',
        zIndex: 100,
        pointerEvents: 'none',
        userSelect: 'none'
      }}
    >
      FPS: {fps}
    </div>
  )
}