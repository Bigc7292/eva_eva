const { chromium } = require('playwright');

async function checkAppStatus() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // List of ports to try
  const ports = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009];
  let isRunning = false;
  
  try {
    console.log('Checking if application is running on any port...');
    
    for (const port of ports) {
      try {
        console.log(`Trying port ${port}...`);
        await page.goto(`http://localhost:${port}`, { timeout: 5000 });
        
        // Wait for some content to appear
        await page.waitForSelector('body', { timeout: 3000 });
        
        const title = await page.title();
        console.log(`Found application running on port ${port}!`);
        console.log(`Page title: ${title}`);
        
        // Take a screenshot
        await page.screenshot({ path: `app-running-port-${port}.png` });
        
        isRunning = true;
        break;
      } catch (error) {
        console.log(`Application not running on port ${port}`);
      }
    }
    
    return isRunning;
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
