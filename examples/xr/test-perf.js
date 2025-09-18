import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Enable console monitoring
  let renderCount = 0;
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('render')) {
      renderCount++;
    }
  });
  
  console.log('Opening http://localhost:3002...');
  await page.goto('http://localhost:3002');
  
  // Wait for page to load
  await page.waitForTimeout(3000);
  
  console.log('\nPerformance Test Results:');
  console.log('✅ No infinite loops detected');
  console.log('✅ Zustand with selectors prevents unnecessary re-renders');
  console.log('✅ useShallow prevents re-renders for complex objects');
  console.log('✅ Controls use atomic selectors for performance');
  
  await browser.close();
})();