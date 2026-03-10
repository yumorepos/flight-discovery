import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Capture console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });
  
  // Capture network failures
  const networkErrors = [];
  page.on('requestfailed', request => {
    networkErrors.push(`${request.url()} - ${request.failure().errorText}`);
  });
  
  console.log('Opening http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  
  console.log('Filling search form...');
  await page.fill('input[placeholder="e.g., YUL"]', 'YUL');
  await page.selectOption('select', '03');
  
  console.log('Clicking search button...');
  await page.click('button:has-text("Search")');
  
  // Wait for results or error
  await page.waitForTimeout(3000);
  
  // Check what's displayed
  const bodyText = await page.textContent('body');
  
  console.log('\n=== PAGE CONTENT ===');
  if (bodyText.includes('No flights found')) {
    console.log('❌ ERROR: "No flights found" displayed');
  } else if (bodyText.includes('New York')) {
    console.log('✅ SUCCESS: Flight results displayed');
  } else if (bodyText.includes('Searching for flights')) {
    console.log('⏳ Still loading...');
  } else {
    console.log('❓ UNKNOWN STATE');
  }
  
  console.log('\n=== CONSOLE MESSAGES ===');
  consoleMessages.forEach(msg => console.log(msg));
  
  console.log('\n=== NETWORK ERRORS ===');
  if (networkErrors.length === 0) {
    console.log('No network errors');
  } else {
    networkErrors.forEach(err => console.log('❌', err));
  }
  
  await browser.close();
})();
