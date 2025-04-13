const { chromium } = require('playwright');

async function checkAppStatus() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Checking if application is running...');
    await page.goto('http://localhost:3004', { timeout: 30000 });

    // Wait for some content to appear
    await page.waitForSelector('body', { timeout: 10000 });

    const title = await page.title();
    const content = await page.content();

    console.log(`Page title: ${title}`);
    console.log('Application is running!');

    // Try to navigate to dashboard
    try {
      console.log('Trying to navigate to dashboard...');
      await page.goto('http://localhost:3004/dashboard', { timeout: 10000 });
      await page.waitForSelector('body', { timeout: 5000 });
      console.log('Dashboard page loaded successfully!');
    } catch (dashboardError) {
      console.error('Error loading dashboard:', dashboardError.message);
    }

    // Take a screenshot
    await page.screenshot({ path: 'app-running.png' });

    return true;
  } catch (error) {
    console.error('Error checking application status:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

checkAppStatus()
  .then(isRunning => {
    console.log(`Application running status: ${isRunning}`);
    process.exit(isRunning ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
