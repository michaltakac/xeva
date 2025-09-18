import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  let hasErrors = false;
  
  // Enhanced console monitoring
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') {
      console.log(`Error: ${text}`);
      hasErrors = true;
    } else if (text.includes('[xreva]') || text.includes('Control') || text.includes('useControls')) {
      console.log(`Debug: ${text}`);
    }
  });
  
  page.on('pageerror', error => {
    console.log(`Page error: ${error.message}`);
    console.log(`Stack: ${error.stack?.slice(0, 500) || 'No stack'}`);
    hasErrors = true;
  });
  
  console.log('Opening http://localhost:3002...');
  await page.goto('http://localhost:3002');
  
  // Wait for page to load and React to render
  await page.waitForTimeout(3000);
  
  // Check if the store has any controls using the Zustand store
  const storeInfo = await page.evaluate(() => {
    // Try to access the Zustand store through window
    const stores = Object.keys(window).filter(key => key.includes('xreva') || key.includes('XREVA'));
    
    // Check if useXrevaStore is available
    if (window.useXrevaStore) {
      const state = window.useXrevaStore.getState();
      return {
        hasStore: true,
        controlsCount: state.controls?.size || 0,
        valuesCount: Object.keys(state.values || {}).length,
        controls: Array.from(state.controls?.keys() || [])
      };
    }
    
    return {
      hasStore: false,
      windowKeys: stores,
      message: 'Store not found in window'
    };
  });
  
  console.log('\nStore info:', JSON.stringify(storeInfo, null, 2));
  
  // Try to manually check for controls in the DOM
  const domControls = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input[type="range"], input[type="checkbox"], button, select');
    return {
      total: inputs.length,
      types: Array.from(inputs).map(el => ({
        type: el.type,
        name: el.name || el.id || 'unnamed'
      }))
    };
  });
  
  console.log(`\nDOM controls found:`, JSON.stringify(domControls, null, 2));
  
  // Check for XReva panel and canvas
  const panelInfo = await page.evaluate(() => {
    const panel = document.querySelector('[data-xreva-panel]');
    const canvas = document.querySelector('canvas');
    const ar = document.querySelector('[aria-label*="AR"]');
    const vr = document.querySelector('[aria-label*="VR"]');
    
    // Check if the panel is visible using window.useXrevaStore
    let panelVisible = false;
    if (window.useXrevaStore) {
      const state = window.useXrevaStore.getState();
      const uiSettings = state.values['UI Settings.ui.showPanel'];
      panelVisible = uiSettings !== false;
    }
    
    return {
      hasPanel: !!panel,
      hasCanvas: !!canvas,
      hasARButton: !!ar,
      hasVRButton: !!vr,
      panelVisible,
      panelClass: panel?.className || 'not found'
    };
  });
  
  console.log('\nPanel info:', panelInfo);
  
  console.log('\nTest completed. Errors found:', hasErrors);
  
  await browser.close();
})();