import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false, devtools: false });
  const page = await browser.newPage();
  
  console.log('🔍 Navigating to http://localhost:3006...');
  
  await page.goto('http://localhost:3006', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('canvas', { timeout: 10000 });
  
  console.log('✅ Page loaded\n');
  
  // Wait a bit for everything to render
  await page.waitForTimeout(2000);
  
  // Check for XrevaPanel elements
  console.log('🎛️  Checking XrevaPanel structure...\n');
  
  // Check for tabs
  const tabs = await page.$$eval('[role="tab"], button', buttons => 
    buttons.map(b => b.textContent).filter(t => t && t.length > 0)
  );
  
  if (tabs.length > 0) {
    console.log('📑 Found tabs:', tabs);
  } else {
    console.log('⚠️  No tabs found');
  }
  
  // Try to find Scene tab and click it
  const sceneTab = await page.$('button:has-text("Scene"), [role="tab"]:has-text("Scene")');
  if (sceneTab) {
    console.log('\n🔍 Clicking on Scene tab...');
    await sceneTab.click();
    await page.waitForTimeout(500);
  }
  
  // Look for controls
  const controls = await page.evaluate(() => {
    const elements = document.querySelectorAll('input, button, select');
    const controlInfo = [];
    
    elements.forEach(el => {
      const label = el.previousSibling?.textContent || 
                   el.parentElement?.textContent || 
                   el.getAttribute('aria-label') || '';
      
      if (label) {
        controlInfo.push({
          type: el.tagName.toLowerCase(),
          inputType: el.type || '',
          label: label.trim(),
          checked: el.checked,
          value: el.value
        });
      }
    });
    
    return controlInfo;
  });
  
  console.log('\n📊 Controls found:');
  controls.forEach(control => {
    if (control.label.toLowerCase().includes('fps') || 
        control.label.toLowerCase().includes('stats')) {
      console.log(`  ✅ FPS/Stats control: ${control.label} (type: ${control.inputType || control.type})`);
    }
  });
  
  // Specifically look for showStats toggle
  const statsToggle = controls.find(c => 
    c.label.toLowerCase().includes('stats') || 
    c.label.toLowerCase().includes('fps')
  );
  
  if (statsToggle) {
    console.log(`\n✅ Found Stats toggle: "${statsToggle.label}"`);
    console.log(`   Type: ${statsToggle.inputType}`);
    console.log(`   Current state: ${statsToggle.checked ? 'ON' : 'OFF'}`);
  } else {
    console.log('\n⚠️  Could not find Stats/FPS toggle in controls');
    console.log('\nAll control labels found:');
    controls.slice(0, 10).forEach(c => console.log(`  - ${c.label}`));
  }
  
  // Check if FPS stats are visible
  const fpsElement = await page.$('div:has-text("FPS"), canvas + div');
  if (fpsElement) {
    console.log('\n✅ FPS display is visible on screen');
  } else {
    console.log('\n⚠️  FPS display not found on screen');
  }
  
  console.log('\n📸 Keeping browser open for manual inspection...');
  console.log('   Close the browser window when done.');
  
  // Keep browser open for inspection
  await page.waitForTimeout(60000);
  
  await browser.close();
})();