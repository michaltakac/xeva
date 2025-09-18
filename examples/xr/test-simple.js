import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`Browser: ${msg.text()}`);
  });
  
  console.log('Opening http://localhost:3002...');
  await page.goto('http://localhost:3002');
  
  // Wait for page to load
  await page.waitForTimeout(3000);
  
  // Check for control elements
  const sliders = await page.$$('input[type="range"]');
  const buttons = await page.$$('button');
  const toggles = await page.$$('input[type="checkbox"]');
  
  console.log(`\nFound UI elements:`);
  console.log(`- Sliders: ${sliders.length}`);
  console.log(`- Buttons: ${buttons.length}`);
  console.log(`- Toggles: ${toggles.length}`);
  
  // Check if Canvas is present
  const canvas = await page.$('canvas');
  if (canvas) {
    console.log('✅ Canvas element found');
  } else {
    console.log('❌ Canvas element not found');
  }
  
  // Leave browser open for manual inspection
  console.log('\nBrowser left open for manual inspection. Close it when done.');
})();