const playwright = require('playwright');

async function testLogin() {
  console.log('🔍 Testing login with admin credentials...');
  
  const browser = await playwright.chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const errors = [];
  const networkErrors = [];
  const responses = [];
  
  // Capture all console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Console Error:', msg.text());
      errors.push(msg.text());
    } else if (msg.type() === 'warn') {
      console.log('⚠️  Warning:', msg.text());
    }
  });
  
  // Capture network responses
  page.on('response', response => {
    responses.push({
      url: response.url(),
      status: response.status(),
      contentType: response.headers()['content-type']
    });
    
    if (response.status() >= 400) {
      console.log('🌐 Network Error:', response.status(), response.url());
      networkErrors.push({ status: response.status(), url: response.url() });
    }
  });
  
  try {
    // Navigate to login page
    console.log('📋 Navigating to login page...');
    await page.goto('http://localhost:3004/login');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of login page
    await page.screenshot({ path: 'login-page.png' });
    console.log('📸 Login page screenshot saved');
    
    // Check if login form exists
    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    const submitButton = await page.$('button[type="submit"]');
    
    console.log('🔍 Form elements found:');
    console.log('- Email input:', !!emailInput);
    console.log('- Password input:', !!passwordInput);
    console.log('- Submit button:', !!submitButton);
    
    if (!emailInput || !passwordInput || !submitButton) {
      console.log('❌ Login form elements missing!');
      await browser.close();
      return;
    }
    
    // Fill login form
    console.log('✏️  Filling login form...');
    await page.fill('input[type="email"]', 'dev@eva.com');
    await page.fill('input[type="password"]', 'dev123456');
    
    // Take screenshot before submitting
    await page.screenshot({ path: 'login-filled.png' });
    console.log('📸 Filled form screenshot saved');
    
    // Submit the form
    console.log('🔘 Clicking login button...');
    await page.click('button[type="submit"]');
    
    // Wait for response
    console.log('⏳ Waiting for login response...');
    await page.waitForTimeout(5000);
    
    // Check current URL
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);
    
    // Take screenshot after login attempt
    await page.screenshot({ path: 'login-result.png' });
    console.log('📸 Login result screenshot saved');
    
    // Look for error messages on page
    const errorMessages = await page.$$eval('[role="alert"], .alert, .error', 
      elements => elements.map(el => el.textContent)
    );
    
    if (errorMessages.length > 0) {
      console.log('🚨 Error messages found on page:');
      errorMessages.forEach(msg => console.log('  -', msg));
    }
    
  } catch (error) {
    console.log('💥 Test failed:', error.message);
  }
  
  // Summary
  console.log('\n📊 Test Results:');
  console.log('- Console Errors:', errors.length);
  console.log('- Network Errors:', networkErrors.length);
  console.log('- Total Responses:', responses.length);
  
  if (errors.length > 0) {
    console.log('\n❌ Console Errors:');
    errors.forEach((error, i) => console.log(`${i + 1}. ${error.substring(0, 100)}...`));
  }
  
  if (networkErrors.length > 0) {
    console.log('\n🌐 Network Errors:');
    networkErrors.forEach(error => console.log(`${error.status}: ${error.url}`));
  }
  
  await browser.close();
}

testLogin().catch(console.error);