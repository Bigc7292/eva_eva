const playwright = require('playwright');

async function testFullLoginFlow() {
  console.log('🔍 Testing complete login flow with mock authentication...');
  
  const browser = await playwright.chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const errors = [];
  const logs = [];
  
  // Capture console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Console Error:', msg.text());
      errors.push(msg.text());
    } else if (msg.text().includes('Login successful') || msg.text().includes('mock auth') || msg.text().includes('Development Admin')) {
      console.log('✅ Success Log:', msg.text());
      logs.push(msg.text());
    }
  });
  
  try {
    // Step 1: Navigate to login page
    console.log('📋 Step 1: Navigating to login page...');
    await page.goto('http://localhost:3004/login');
    await page.waitForLoadState('networkidle');
    
    // Check for development banner
    const devBanner = await page.$('text=DEVELOPMENT MODE');
    console.log('🔧 Development banner visible:', !!devBanner);
    
    // Step 2: Fill and submit login form
    console.log('✏️  Step 2: Filling login form with admin credentials...');
    await page.fill('input[type="email"]', 'dev@eva.com');
    await page.fill('input[type="password"]', 'dev123456');
    
    await page.screenshot({ path: 'login-before-submit.png' });
    console.log('📸 Screenshot taken before submit');
    
    // Submit the form
    console.log('🔘 Step 3: Submitting login form...');
    await page.click('button[type="submit"]');
    
    // Wait for navigation or state change
    console.log('⏳ Step 4: Waiting for authentication...');
    await page.waitForTimeout(3000);
    
    // Check current URL
    const currentUrl = page.url();
    console.log('📍 Current URL after login:', currentUrl);
    
    // Take screenshot of current state
    await page.screenshot({ path: 'login-after-submit.png' });
    console.log('📸 Screenshot taken after login attempt');
    
    // Step 5: Check for success indicators
    console.log('🔍 Step 5: Checking for authentication success...');
    
    // Look for dashboard elements or user info
    const dashboardElements = await page.$$('[data-testid="dashboard"], h1, .dashboard');
    const userNavigation = await page.$('text=Development Admin, text=Test User, [aria-label*="user"]');
    
    console.log('📊 Dashboard elements found:', dashboardElements.length);
    console.log('👤 User navigation found:', !!userNavigation);
    
    // Check localStorage for mock session
    const mockSession = await page.evaluate(() => {
      return localStorage.getItem('mock-session');
    });
    
    console.log('💾 Mock session in localStorage:', !!mockSession);
    if (mockSession) {
      const sessionData = JSON.parse(mockSession);
      console.log('👤 Logged in as:', sessionData.user?.user_metadata?.full_name || sessionData.user?.email);
    }
    
    // Step 6: Try navigating to dashboard
    if (!currentUrl.includes('/dashboard')) {
      console.log('🚀 Step 6: Manually navigating to dashboard...');
      await page.goto('http://localhost:3004/dashboard');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'dashboard-page.png' });
      console.log('📸 Dashboard screenshot saved');
    }
    
    // Final URL check
    const finalUrl = page.url();
    console.log('🏁 Final URL:', finalUrl);
    
    // Success criteria
    const isLoggedIn = mockSession && (finalUrl.includes('/dashboard') || logs.some(log => log.includes('successful')));
    
    console.log('\n🎉 LOGIN TEST RESULTS:');
    console.log('✅ Authentication successful:', isLoggedIn);
    console.log('📧 Test email: dev@eva.com');
    console.log('🔑 Test password: dev123456');
    console.log('🔧 Mock auth working:', !!mockSession);
    console.log('❌ Console errors:', errors.length);
    
    if (isLoggedIn) {
      console.log('\n🏆 SUCCESS: Login is working with mock authentication!');
      console.log('🎯 You can now use these credentials:');
      console.log('   - Admin: dev@eva.com / dev123456');
      console.log('   - Manager: manager@eva.com / manager123');
      console.log('   - Agent: agent@eva.com / agent123');
    } else {
      console.log('\n⚠️  LOGIN ISSUE: Authentication might need additional debugging');
    }
    
  } catch (error) {
    console.log('💥 Test failed:', error.message);
  }
  
  await browser.close();
}

testFullLoginFlow().catch(console.error);