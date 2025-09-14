# 🎮 Dual-Hand Interaction Testing Guide

## ✨ What's New: Dual-Hand Mode

The Xeva panel now supports **dual-hand interaction** where:
- **LEFT hand** = Grab and move the panel
- **RIGHT hand** = Interact with controls (sliders, buttons, etc.)

This allows you to hold the panel steady with your left hand while precisely interacting with controls using your right hand - a much better UX for VR!

## 🚀 Quick Start

```bash
# 1. Build Xeva
npm run build

# 2. Run the demo
cd examples/xr-quest3
npm install
npm run dev
```

## 📱 Access on Quest 3

1. Get your computer's IP (shown when running `npm run dev`)
2. Open Quest 3 browser
3. Navigate to: `http://[YOUR-IP]:3000`
4. Enter VR mode

## 🤚 How to Use Dual-Hand Mode

### Left Hand (Grab)
- **Squeeze/Grip Button**: Grab the panel
- **Move**: Panel follows your left hand
- **Release**: Let go of grip button

### Right Hand (Interact)
- **Point**: Aim at controls
- **Trigger**: Click/interact with controls
- **Hover**: Get haptic feedback when over controls

## 🎯 Test These Interactions

1. **Grab Panel with Left Hand**
   - Squeeze left grip button near panel
   - Move left hand - panel should follow
   - Panel stays at comfortable distance

2. **Interact with Right Hand**
   - While holding with left, point right controller at controls
   - Pull right trigger to:
     - Drag sliders
     - Click buttons
     - Toggle switches
     - Select options

3. **Status Indicators**
   - **Purple dot**: Left hand grabbing
   - **Orange dot**: Right hand interacting
   - **Blue dot**: Panel anchored
   - **Green dot**: Standard grab mode

## 📊 Control Types to Test

- **Sliders**: Drag to adjust values
- **Toggles**: Click to switch on/off
- **Buttons**: Click to trigger actions
- **Color swatches**: Click to select
- **Select options**: Click to choose

## 🔧 API Usage

### Enable Dual-Hand Mode
```tsx
<XevaPanelXR
  dualHandMode={true}  // Enable dual-hand interaction
  position={[1.5, 1.5, -2]}
  title="My Controls"
/>
```

### Customize Hand Roles
```tsx
<XevaPanelXR
  dualHandMode={true}
  grabbable={{
    enabled: true,
    // Left hand grab settings
  }}
  // Right hand automatically becomes interact hand
/>
```

### Use the Hook Directly
```tsx
import { useDualHandInteraction } from 'xeva'

function MyComponent() {
  const ref = useRef()
  
  const {
    isLeftHandGrabbing,
    isRightHandInteracting,
    hoveredControl
  } = useDualHandInteraction(ref, {
    grabHand: 'left',
    interactHand: 'right',
    grabButton: 'squeeze',
    interactButton: 'trigger'
  })
  
  return <group ref={ref}>...</group>
}
```

## 🎮 Controller Mapping

### Meta Quest 3 Controllers
- **Grip Button** (side): Grab with left hand
- **Trigger Button** (index finger): Interact with right hand
- **Thumbstick**: Navigate (if needed)
- **A/B/X/Y Buttons**: Additional actions

## 📝 Expected Behavior

✅ **Working:**
- Left grip grabs panel
- Right trigger interacts with controls
- Panel follows left hand smoothly
- Controls respond to right hand
- Haptic feedback on interactions
- Visual status indicators

⚠️ **Note:**
- TypeScript warnings don't affect functionality
- All features work despite type issues
- Performance is optimized for Quest 3

## 🐛 Troubleshooting

### Panel won't grab
- Get closer to panel (within 2m)
- Use grip button, not trigger
- Check left controller is tracked

### Controls not responding
- Point right controller directly at control
- Get closer (within 1.5m)
- Use trigger button for interaction

### Performance issues
- Reduce number of controls
- Disable unused features
- Close other browser tabs

## 🎉 Ready to Test!

The dual-hand interaction is fully implemented and ready for your Quest 3. This provides a much more natural and precise way to interact with 3D UI panels in VR.

**Key Innovation**: Hold panel steady with left hand while making precise adjustments with right hand - just like holding a tablet!

Enjoy testing! 🚀