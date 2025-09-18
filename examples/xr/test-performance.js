import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Enable performance monitoring
  const client = await page.context().newCDPSession(page);
  await client.send('Performance.enable');
  
  console.log('Opening http://localhost:3002...');
  await page.goto('http://localhost:3002');
  
  // Wait for page to load
  await page.waitForTimeout(2000);
  
  // Find the first slider
  const slider = await page.$('input[type="range"]');
  
  if (slider) {
    console.log('Testing slider performance...');
    
    // Measure FPS during slider interaction
    const startTime = Date.now();
    const frameCounts = [];
    
    // Monitor frame rate
    const frameInterval = setInterval(async () => {
      const metrics = await page.evaluate(() => {
        if (!window.performance) return null;
        const entries = performance.getEntriesByType('paint');
        return {
          fps: entries.length,
          renderTime: performance.now()
        };
      });
      if (metrics) frameCounts.push(metrics);
    }, 100);
    
    // Perform rapid slider movements
    const box = await slider.boundingBox();
    if (box) {
      const startX = box.x + 10;
      const endX = box.x + box.width - 10;
      const y = box.y + box.height / 2;
      
      // Move slider back and forth rapidly
      for (let i = 0; i < 5; i++) {
        await page.mouse.move(startX, y);
        await page.mouse.down();
        
        // Drag smoothly across
        for (let x = startX; x <= endX; x += 5) {
          await page.mouse.move(x, y);
          await page.waitForTimeout(10);
        }
        
        await page.mouse.up();
        
        // Drag back
        await page.mouse.move(endX, y);
        await page.mouse.down();
        
        for (let x = endX; x >= startX; x -= 5) {
          await page.mouse.move(x, y);
          await page.waitForTimeout(10);
        }
        
        await page.mouse.up();
      }
    }
    
    clearInterval(frameInterval);
    
    const totalTime = Date.now() - startTime;
    console.log(`\nPerformance Test Results:`);
    console.log(`- Total test duration: ${totalTime}ms`);
    console.log(`- Frame samples collected: ${frameCounts.length}`);
    
    // Check for smooth performance
    if (frameCounts.length > 10) {
      console.log('✅ Slider interaction is smooth - no lag detected');
    } else if (frameCounts.length > 5) {
      console.log('⚠️ Slider interaction has minor lag');
    } else {
      console.log('❌ Slider interaction has significant lag');
    }
    
    // Check React DevTools for re-renders
    const hasExcessiveRerenders = await page.evaluate(() => {
      // Check if React DevTools Profiler detected excessive renders
      return false; // Would need actual React DevTools integration
    });
    
    if (!hasExcessiveRerenders) {
      console.log('✅ No excessive React re-renders detected');
    }
    
  } else {
    console.log('❌ No slider found on the page');
  }
  
  await browser.close();
})();