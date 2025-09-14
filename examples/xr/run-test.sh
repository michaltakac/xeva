#!/bin/bash

echo "🚀 Starting XR Demo"
echo "================================"

# Clear vite cache
echo "🧹 Clearing cache..."
rm -rf .vite

# Get IP address
IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)

echo ""
echo "📱 Starting server..."
echo ""
echo "🌐 Access from Quest 3 at:"
echo "   http://$IP:3000"
echo ""
echo "💡 Instructions:"
echo "   1. Enter VR mode"
echo "   2. LEFT GRIP = Grab panel"
echo "   3. RIGHT TRIGGER = Interact with controls"
echo ""

# Start dev server
npm run dev