import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture console for errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`Error: ${msg.text()}`);
    }
  });
  
  page.on('pageerror', error => {
    console.error('Page error:', error.message);
  });
  
  console.log('Opening http://localhost:3002...');
  await page.goto('http://localhost:3002');
  
  // Wait for page to fully load
  await page.waitForTimeout(2000);
  
  // Check for controls
  const sliders = await page.$$('input[type="range"]');
  const buttons = await page.$$('button');
  const selects = await page.$$('select');
  
  console.log(`\nControls found:`);
  console.log(`- Sliders: ${sliders.length}`);
  console.log(`- Buttons: ${buttons.length}`);
  console.log(`- Selects: ${selects.length}`);
  
  if (sliders.length > 0) {
    console.log('\nTesting slider interaction...');
    const slider = sliders[0];
    const initialValue = await slider.evaluate(el => el.value);
    console.log(`Initial slider value: ${initialValue}`);
    
    // Try to change the slider value
    await slider.evaluate(el => {
      el.value = String(parseFloat(el.max) / 2);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    
    await page.waitForTimeout(500);
    
    const newValue = await slider.evaluate(el => el.value);
    console.log(`New slider value: ${newValue}`);
    
    if (newValue !== initialValue) {
      console.log('✅ Slider interaction works!');
    } else {
      console.log('❌ Slider did not respond to interaction');
    }
  }
  
  if (buttons.length > 0) {
    console.log('\nTesting button interaction...');
    const button = buttons[0];
    const buttonText = await button.textContent();
    console.log(`Clicking button: ${buttonText}`);
    
    await button.click();
    await page.waitForTimeout(500);
    console.log('✅ Button clicked successfully');
  }
  
  await browser.close();
})();