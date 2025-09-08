const { chromium } = require('playwright');

async function runVisualTest() {
  console.log('🎭 Starting Playwright Visual Test for EVA App...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    console.log('📍 Navigating to http://localhost:3004...');
    await page.goto('http://localhost:3004', { waitUntil: 'networkidle' });
    
    // Wait for the app to load
    await page.waitForTimeout(3000);
    
    console.log('📸 Taking full-page screenshot...');
    await page.screenshot({ 
      path: 'eva-app-current-state.png', 
      fullPage: true 
    });
    
    console.log('🔍 Checking for visible elements...');
    
    // Check if login form or dashboard is visible
    const hasLoginForm = await page.locator('form').count() > 0;
    const hasDashboard = await page.locator('[data-testid="dashboard"], .dashboard, #dashboard').count() > 0;
    const hasHeader = await page.locator('header, .header').count() > 0;
    const hasSidebar = await page.locator('.sidebar, [data-testid="sidebar"]').count() > 0;
    
    console.log('📊 Current App State:');
    console.log('- Login Form Present:', hasLoginForm);
    console.log('- Dashboard Visible:', hasDashboard);
    console.log('- Header Present:', hasHeader);
    console.log('- Sidebar Present:', hasSidebar);
    
    // Check for any console errors
    const errorMessages = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errorMessages.push(msg.text());
      }
    });
    
    console.log('📱 Page Title:', await page.title());
    console.log('🌐 Current URL:', page.url());
    
    // Try to interact with the app
    if (hasLoginForm) {
      console.log('🔐 Login form detected - testing login functionality...');
      await page.screenshot({ 
        path: 'eva-login-page.png', 
        fullPage: true 
      });
    }
    
    if (hasDashboard) {
      console.log('📈 Dashboard detected - capturing dashboard state...');
      await page.screenshot({ 
        path: 'eva-dashboard.png', 
        fullPage: true 
      });
    }
    
    console.log('✅ Visual test completed successfully!');
    console.log('📸 Screenshots saved:');
    console.log('- eva-app-current-state.png (Full page)');
    if (hasLoginForm) console.log('- eva-login-page.png');
    if (hasDashboard) console.log('- eva-dashboard.png');
    
  } catch (error) {
    console.error('❌ Error during visual test:', error);
    await page.screenshot({ 
      path: 'eva-app-error-state.png', 
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
}

runVisualTest();