const { chromium } = require('playwright');

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
      consoleWarnings.push(text);
      console.log('⚠️  WARNING:', text);
    } else if (type === 'log') {
      consoleLogs.push(text);
      console.log('📝 LOG:', text);
    }
  });
  
  // Also catch page errors
  page.on('pageerror', error => {
    consoleErrors.push(error.message);
    console.log('❌ PAGE ERROR:', error.message);
  });
  
  console.log('🔍 Navigating to http://localhost:3006...');
  
  try {
    await page.goto('http://localhost:3006', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait a bit for any async errors to appear
    await page.waitForTimeout(3000);
    
    // Check if the canvas is rendered
    const canvas = await page.$('canvas');
    if (canvas) {
      console.log('✅ Canvas element found');
    } else {
      console.log('❌ Canvas element NOT found');
    }
    
    // Check if XrevaPanel is rendered
    const xrevaPanel = await page.$('[class*="uikit"]');
    if (xrevaPanel) {
      console.log('✅ XrevaPanel UI elements found');
    } else {
      console.log('⚠️  XrevaPanel UI elements NOT found');
    }
    
    console.log('\n📊 Summary:');
    console.log(`   Errors: ${consoleErrors.length}`);
    console.log(`   Warnings: ${consoleWarnings.length}`);
    console.log(`   Logs: ${consoleLogs.length}`);
    
    if (consoleErrors.length > 0) {
      console.log('\n❌ Console errors detected:');
      consoleErrors.forEach((err, i) => {
        console.log(`   ${i + 1}. ${err}`);
      });
      process.exit(1);
    } else {
      console.log('\n✅ No console errors detected!');
    }
    
  } catch (error) {
    console.error('❌ Failed to load page:', error.message);
    process.exit(1);
  }
  
  await browser.close();
})();