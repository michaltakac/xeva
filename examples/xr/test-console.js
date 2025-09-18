import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture console messages
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    console.log(`Browser console: ${msg.type()} - ${text}`);
    consoleLogs.push({ type: msg.type(), text });
    
    // Check for infinite loop error
    if (text.includes('Maximum update depth exceeded') || 
        text.includes('too many re-renders')) {
      console.error('❌ INFINITE LOOP DETECTED!');
      console.error(text);
    }
  });
  
  page.on('pageerror', error => {
    console.error('Page error:', error);
  });

  console.log('Opening http://localhost:3002...');
  await page.goto('http://localhost:3002');
  
  // Wait for the page to load
  await page.waitForTimeout(3000);
  
  // Try interacting with a slider
  console.log('Testing slider interaction...');
  const slider = await page.$('input[type="range"]');
  if (slider) {
    await slider.hover();
    await page.mouse.down();
    await page.mouse.move(200, 0);
    await page.mouse.up();
    console.log('✓ Slider interaction completed');
  }
  
  // Check for errors after interaction
  await page.waitForTimeout(2000);
  
  const hasInfiniteLoop = consoleLogs.some(log => 
    log.text.includes('Maximum update depth exceeded') ||
    log.text.includes('too many re-renders')
  );
  
  if (hasInfiniteLoop) {
    console.error('\n❌ Test failed: Infinite loop detected');
  } else {
    console.log('\n✅ Test passed: No infinite loops detected');
  }
  
  await browser.close();
})();