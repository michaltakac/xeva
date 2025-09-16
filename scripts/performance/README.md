# Performance Auditing Scripts

This folder contains performance auditing and testing scripts for the XReva library.

## Scripts

### `performance-audit.mjs`
Comprehensive performance audit using Playwright and Chrome DevTools Protocol.
- Measures FPS, memory usage, and load times
- Generates performance recommendations
- Creates trace file for Chrome DevTools analysis

**Usage:**
```bash
node scripts/performance/performance-audit.mjs
```

### `check-console.mjs`
Checks for JavaScript console errors in the browser.
- Detects runtime errors
- Validates canvas rendering
- Useful for CI/CD pipelines

**Usage:**
```bash
node scripts/performance/check-console.mjs
```

### `check-xreva-panel.mjs`
Validates XReva panel structure and functionality.
- Checks panel tabs and controls
- Verifies FPS stats toggle
- Inspects UI elements

**Usage:**
```bash
node scripts/performance/check-xreva-panel.mjs
```

## Running Scripts

From project root:
```bash
# Run performance audit
npm run perf:audit

# Check for console errors
npm run perf:check

# Validate XReva panel
npm run perf:panel
```

## Requirements
- Playwright installed (`npm install --save-dev playwright`)
- Chrome/Chromium browser
- Dev server running on port 3006

## Output Files
- `performance-trace.json` - Chrome DevTools trace file
- Console output with performance metrics and recommendations