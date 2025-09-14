#!/bin/bash

echo "🚀 Setting up Xreva XR Demo"
echo "======================================"

# Build the main library first
echo "📦 Building Xreva library..."
cd ../..
npm run build

# Return to demo directory
cd examples/xr

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate SSL certificate for HTTPS (required for WebXR)
echo "🔐 Generating SSL certificate..."
npm run generate-cert

# Get local IP address for Quest 3 access
IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)

echo ""
echo "✅ Setup complete!"
echo ""
echo "📱 To test on Meta Quest:"
echo "   1. Run: npm run dev"
echo "   2. On Meta Quest, open browser and go to:"
echo "      https://$IP:3000"
echo "   3. Accept the security warning (self-signed cert)"
echo "   4. Click 'Enter VR' button"
echo ""
echo "💡 Make sure your Quest headset is on the same network!"
echo "💡 Enable hand tracking in Quest settings for full features"