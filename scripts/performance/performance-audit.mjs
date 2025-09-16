import { chromium } from 'playwright';

async function performanceAudit() {
  console.log('🚀 Starting Performance Audit...\n');
  
  // Launch Chrome with DevTools Protocol enabled
  const browser = await chromium.launch({ 
    headless: false, 
    devtools: true,
    args: ['--enable-gpu-rasterization']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Enable Chrome DevTools Protocol
  const cdp = await context.newCDPSession(page);
  
  // Performance metrics collection
  const performanceMetrics = {
    fps: [],
    memory: [],
    renderTime: [],
    scriptTime: [],
    layoutTime: [],
    paintTime: []
  };
  
  // Enable performance monitoring
  await cdp.send('Performance.enable');
  await cdp.send('Runtime.enable');
  
  // Start tracing
  await browser.startTracing(page, { 
    screenshots: true, 
    categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline.frame'] 
  });
  
  console.log('📊 Navigating to http://localhost:3006...');
  
  // Navigate to the page
  await page.goto('http://localhost:3006', { waitUntil: 'domcontentloaded' });
  
  // Wait for canvas
  await page.waitForSelector('canvas', { timeout: 10000 });
  console.log('✅ Canvas loaded\n');
  
  // Collect performance metrics for 10 seconds
  console.log('📈 Collecting performance metrics for 10 seconds...\n');
  
  const startTime = Date.now();
  const metricsInterval = setInterval(async () => {
    try {
      // Get Chrome performance metrics
      const metrics = await cdp.send('Performance.getMetrics');
      const metricsMap = {};
      metrics.metrics.forEach(m => {
        metricsMap[m.name] = m.value;
      });
      
      // Get memory info
      const memoryInfo = await page.evaluate(() => {
        if (performance.memory) {
          return {
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize,
            jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
          };
        }
        return null;
      });
      
      if (memoryInfo) {
        performanceMetrics.memory.push(memoryInfo.usedJSHeapSize / 1048576); // Convert to MB
      }
      
      // Get FPS from requestAnimationFrame
      const fps = await page.evaluate(() => {
        return new Promise(resolve => {
          let lastTime = performance.now();
          let frames = 0;
          const measureFPS = () => {
            frames++;
            const currentTime = performance.now();
            if (currentTime >= lastTime + 1000) {
              resolve(Math.round(frames * 1000 / (currentTime - lastTime)));
            } else {
              requestAnimationFrame(measureFPS);
            }
          };
          requestAnimationFrame(measureFPS);
        });
      });
      performanceMetrics.fps.push(fps);
      
      // Log current metrics
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[${elapsed}s] FPS: ${fps} | Memory: ${(memoryInfo?.usedJSHeapSize / 1048576).toFixed(1)}MB`);
      
    } catch (error) {
      console.error('Error collecting metrics:', error.message);
    }
  }, 1000);
  
  // Wait for 10 seconds
  await page.waitForTimeout(10000);
  clearInterval(metricsInterval);
  
  // Stop tracing
  const trace = await browser.stopTracing();
  
  // Parse trace for additional metrics
  const traceData = JSON.parse(trace.toString());
  const frameEvents = traceData.traceEvents.filter(e => e.name === 'DrawFrame');
  
  console.log('\n📊 PERFORMANCE AUDIT RESULTS\n');
  console.log('═══════════════════════════════════════\n');
  
  // Calculate statistics
  const calculateStats = (arr) => {
    if (arr.length === 0) return { avg: 0, min: 0, max: 0 };
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    return { avg, min, max };
  };
  
  const fpsStats = calculateStats(performanceMetrics.fps);
  const memoryStats = calculateStats(performanceMetrics.memory);
  
  console.log('🎮 FRAME RATE (FPS)');
  console.log(`   Average: ${fpsStats.avg.toFixed(1)} FPS`);
  console.log(`   Min: ${fpsStats.min} FPS`);
  console.log(`   Max: ${fpsStats.max} FPS`);
  console.log(`   ${fpsStats.avg >= 55 ? '✅' : '⚠️'} ${fpsStats.avg >= 55 ? 'Good performance' : 'Performance could be improved'}\n`);
  
  console.log('💾 MEMORY USAGE');
  console.log(`   Average: ${memoryStats.avg.toFixed(1)} MB`);
  console.log(`   Min: ${memoryStats.min.toFixed(1)} MB`);
  console.log(`   Max: ${memoryStats.max.toFixed(1)} MB`);
  console.log(`   ${memoryStats.avg < 100 ? '✅' : '⚠️'} ${memoryStats.avg < 100 ? 'Good memory usage' : 'High memory usage'}\n`);
  
  // Run Lighthouse audit
  console.log('🔍 Running Lighthouse Performance Audit...\n');
  
  // Lighthouse metrics via Performance API
  const performanceData = await page.evaluate(() => {
    const entries = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');
    
    return {
      domContentLoaded: entries.domContentLoadedEventEnd - entries.domContentLoadedEventStart,
      loadComplete: entries.loadEventEnd - entries.loadEventStart,
      firstPaint: paint.find(p => p.name === 'first-paint')?.startTime,
      firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
      domInteractive: entries.domInteractive,
      resources: performance.getEntriesByType('resource').length
    };
  });
  
  console.log('⏱️  LOAD PERFORMANCE');
  console.log(`   First Paint: ${performanceData.firstPaint?.toFixed(0) || 'N/A'} ms`);
  console.log(`   First Contentful Paint: ${performanceData.firstContentfulPaint?.toFixed(0) || 'N/A'} ms`);
  console.log(`   DOM Content Loaded: ${performanceData.domContentLoaded.toFixed(0)} ms`);
  console.log(`   Page Load Complete: ${performanceData.loadComplete.toFixed(0)} ms`);
  console.log(`   Resources Loaded: ${performanceData.resources}\n`);
  
  // Check for performance issues
  console.log('🔍 PERFORMANCE RECOMMENDATIONS\n');
  
  const recommendations = [];
  
  if (fpsStats.avg < 55) {
    recommendations.push('⚠️  Frame rate below 60 FPS - Consider:');
    recommendations.push('    • Reducing polygon count in 3D models');
    recommendations.push('    • Optimizing shaders and materials');
    recommendations.push('    • Using LOD (Level of Detail) for distant objects');
    recommendations.push('    • Implementing frustum culling');
  }
  
  if (memoryStats.avg > 100) {
    recommendations.push('⚠️  High memory usage detected - Consider:');
    recommendations.push('    • Disposing of unused geometries and materials');
    recommendations.push('    • Using instanced rendering for repeated objects');
    recommendations.push('    • Optimizing texture sizes');
    recommendations.push('    • Implementing object pooling');
  }
  
  if (performanceData.firstContentfulPaint > 2000) {
    recommendations.push('⚠️  Slow initial load - Consider:');
    recommendations.push('    • Code splitting and lazy loading');
    recommendations.push('    • Optimizing bundle size');
    recommendations.push('    • Using CDN for static assets');
    recommendations.push('    • Implementing progressive rendering');
  }
  
  // Check for specific Three.js optimizations
  const threeJsChecks = await page.evaluate(() => {
    const renderer = window.__r3f?.gl;
    const scene = window.__r3f?.scene;
    
    if (!renderer || !scene) return null;
    
    return {
      drawCalls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      geometries: renderer.info.memory.geometries,
      textures: renderer.info.memory.textures,
      programs: renderer.info.programs?.length || 0
    };
  });
  
  if (threeJsChecks) {
    console.log('🎨 THREE.JS METRICS');
    console.log(`   Draw Calls: ${threeJsChecks.drawCalls}`);
    console.log(`   Triangles: ${threeJsChecks.triangles.toLocaleString()}`);
    console.log(`   Geometries in Memory: ${threeJsChecks.geometries}`);
    console.log(`   Textures in Memory: ${threeJsChecks.textures}`);
    console.log(`   Shader Programs: ${threeJsChecks.programs}\n`);
    
    if (threeJsChecks.drawCalls > 100) {
      recommendations.push('⚠️  High number of draw calls - Consider:');
      recommendations.push('    • Merging geometries');
      recommendations.push('    • Using instanced rendering');
      recommendations.push('    • Batching similar objects');
    }
  }
  
  if (recommendations.length > 0) {
    recommendations.forEach(r => console.log(r));
  } else {
    console.log('✅ Performance is good! No major issues detected.');
  }
  
  console.log('\n═══════════════════════════════════════\n');
  
  // Save trace file
  const fs = await import('fs');
  fs.writeFileSync('performance-trace.json', trace);
  console.log('📁 Trace saved to performance-trace.json');
  console.log('   You can load this in Chrome DevTools > Performance tab\n');
  
  await browser.close();
  console.log('✅ Performance audit complete!\n');
}

performanceAudit().catch(console.error);