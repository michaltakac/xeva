import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Collect all console messages
  const consoleErrors = [];
  const consoleWarnings = [];
  const consoleLogs = [];
  
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    
    if (type === 'error') {
      consoleErrors.push(text);
      console.log('❌ ERROR:', text);
    } else if (type === 'warning') {
      // Skip WebGL performance warnings
      if (!text.includes('GL Driver Message')) {
        consoleWarnings.push(text);
        console.log('⚠️  WARNING:', text);
      }
    } else if (type === 'log') {
      consoleLogs.push(text);
      // Log XR-related messages
      if (text.includes('XR') || text.includes('blend') || text.includes('session')) {
        console.log('📝 LOG:', text);
      }
    }
  });
  
  // Also catch page errors
  page.on('pageerror', error => {
    consoleErrors.push(error.message);
    console.log('❌ PAGE ERROR:', error.message);
  });
  
  console.log('🔍 Navigating to XR demo at http://localhost:3002...');
  
  try {
    await page.goto('http://localhost:3002', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    console.log('📄 Page loaded, waiting for canvas...');
    
    // Wait for canvas to appear
    await page.waitForSelector('canvas', { timeout: 10000 });
    
    // Wait a bit for any async errors to appear
    await page.waitForTimeout(3000);
    
    // Check if the canvas is rendered
    const canvas = await page.$('canvas');
    if (canvas) {
      console.log('✅ Canvas element found');
    } else {
      console.log('❌ Canvas element NOT found');
    }
    
    // Check for XR button
    const xrButton = await page.$('button:has-text("AR")');
    if (xrButton) {
      console.log('✅ XR button found');
    } else {
      console.log('⚠️  XR button NOT found');
    }
    
    // Check if navigator.xr is available
    const xrSupported = await page.evaluate(() => {
      return 'xr' in navigator;
    });
    
    if (xrSupported) {
      console.log('✅ WebXR API is available');
      
      // Check VR session support
      const vrSupported = await page.evaluate(async () => {
        if (navigator.xr) {
          return await navigator.xr.isSessionSupported('immersive-vr');
        }
        return false;
      });
      
      console.log(`📱 VR session support: ${vrSupported ? '✅ YES' : '❌ NO'}`);
    } else {
      console.log('❌ WebXR API is NOT available');
    }
    
    console.log('\n📊 Summary:');
    console.log(`   Errors: ${consoleErrors.length}`);
    console.log(`   Warnings: ${consoleWarnings.length}`);
    
    if (consoleErrors.length > 0) {
      console.log('\n❌ Console errors detected:');
      consoleErrors.forEach((err, i) => {
        console.log(`   ${i + 1}. ${err}`);
      });
      process.exit(1);
    } else {
      console.log('\n✅ No console errors detected!');
      console.log('🎉 The XR demo is loading without errors!');
    }
    
  } catch (error) {
    console.error('❌ Failed to load page:', error.message);
    
    // If there were console errors before the timeout, show them
    if (consoleErrors.length > 0) {
      console.log('\n❌ Console errors detected before timeout:');
      consoleErrors.forEach((err, i) => {
        console.log(`   ${i + 1}. ${err}`);
      });
    }
    
    process.exit(1);
  }
  
  await browser.close();
})();