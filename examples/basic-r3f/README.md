# XEVA Basic R3F Example

This example demonstrates XEVA controls in a basic React Three Fiber scene.

## Running the Example

### Option 1: Using Bun Server (Recommended)
```bash
bun install
bun dev
# Open http://localhost:3003
```

### Option 2: Install older Vite
If you prefer Vite, install an older version compatible with Node 20.10:
```bash
npm install vite@5.0.0 @vitejs/plugin-react@4.2.0
npm run dev:vite
```

### Option 3: Use a static server
```bash
# Build the example
bun build src/main.tsx --outdir dist

# Serve with any static server
npx serve dist
# or
python -m http.server 8000 -d dist
```

## Features Demonstrated

- **Material Controls**: Color, roughness, metalness, wireframe
- **Animation Controls**: Speed, rotation axes toggles
- **Transform Controls**: Position (Vector3), scale
- **Lighting Controls**: Intensity, ambient intensity, light position
- **Folders**: Organized controls in collapsible groups
- **Button**: Reset action

## How It Works

The example uses `useXRControls` hook to create reactive controls:

```tsx
const { color, roughness, speed } = useXRControls('Material', {
  color: '#ff6030',
  roughness: { value: 0.5, min: 0, max: 1, step: 0.01 },
  speed: { value: 1, min: 0, max: 5 }
})
```

The `XRPanel` component renders the controls in 3D space:

```tsx
<XRPanel 
  position={[-3, 2, -2]}
  width={400}
  height={500}
  billboard={false}
/>
```

## Live Development

The Bun server (server.tsx) provides:
- TypeScript/TSX transpilation on the fly
- No build step required
- Hot reload support
- Instant updates

## Notes

- The panel is positioned in world space at `[-3, 2, -2]`
- Controls are fully interactive with mouse/touch
- All changes are reflected in real-time
- The example works in both desktop and mobile browsers