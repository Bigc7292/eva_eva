/**
 * MCP Playwright Visual Test Suite
 * Comprehensive UI testing for EVA App
 */

const playwright = require('playwright');

async function runMCPVisualTest() {
  console.log('🎭 Starting MCP Playwright Visual Test Suite...');
  
  const browser = await playwright.chromium.launch({ 
    headless: false,
    slowMo: 1000  // Slow down for better visual verification
  });
  
  const page = await browser.newPage();
  
  // Set viewport for consistent screenshots
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('Failed to load resource')) {
      console.log('❌ Console Error:', msg.text().substring(0, 100) + '...');
      errors.push(msg.text());
    }
  });
  
  try {
    console.log('🚀 Navigating to EVA App...');
    await page.goto('http://localhost:3004', { 
      waitUntil: 'networkidle',
      timeout: 10000
    });
    
    console.log('✅ Page loaded successfully!');
    console.log('📋 URL:', page.url());
    console.log('📋 Title:', await page.title() || 'No title');
    
    // Wait for app to fully initialize
    await page.waitForTimeout(3000);
    
    console.log('📊 Analyzing UI components...');
    
    // Check for key UI elements
    const sidebar = await page.$('[data-sidebar]');
    const buttons = await page.$$('button');
    const navigation = await page.$$('nav');
    const links = await page.$$('a');
    
    console.log('🔍 Component Analysis:');
    console.log('  - Sidebar:', sidebar ? '✅ Found' : '❌ Missing');
    console.log('  - Buttons:', buttons.length, 'found');
    console.log('  - Navigation:', navigation.length, 'elements');
    console.log('  - Links:', links.length, 'found');
    
    // Take comprehensive screenshots
    console.log('📸 Taking full page screenshot...');
    await page.screenshot({ 
      path: 'eva-app-full-page.png', 
      fullPage: true 
    });
    
    console.log('📸 Taking viewport screenshot...');
    await page.screenshot({ 
      path: 'eva-app-viewport.png',
      fullPage: false
    });
    
    // Test sidebar functionality if it exists
    if (sidebar) {
      console.log('🧭 Testing sidebar functionality...');
      
      // Look for sidebar trigger/toggle
      const sidebarTrigger = await page.$('[data-sidebar="trigger"]');
      if (sidebarTrigger) {
        console.log('  - Sidebar trigger found, testing toggle...');
        await sidebarTrigger.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ 
          path: 'eva-app-sidebar-toggled.png',
          fullPage: false
        });
      }
    }
    
    // Check for React errors
    console.log('🔧 Error Analysis:');
    console.log('  - Console Errors:', errors.length);
    if (errors.length === 0) {
      console.log('  ✅ No React component errors detected!');
    } else {
      console.log('  ❌ Found', errors.length, 'console errors');
    }
    
    console.log('🎉 MCP Visual Test Suite Completed!');
    console.log('📁 Screenshots saved:');
    console.log('  - eva-app-full-page.png (Full page capture)');
    console.log('  - eva-app-viewport.png (Viewport capture)');
    if (sidebar) {
      console.log('  - eva-app-sidebar-toggled.png (Sidebar interaction)');
    }
    
    return {
      success: true,
      errors: errors.length,
      components: {
        sidebar: !!sidebar,
        buttons: buttons.length,
        navigation: navigation.length,
        links: links.length
      }
    };
    
  } catch (error) {
    console.log('❌ MCP Visual Test Failed:', error.message);
    
    // Take error screenshot
    await page.screenshot({ 
      path: 'eva-app-error.png',
      fullPage: true
    });
    
    return {
      success: false,
      error: error.message
    };
  } finally {
    await browser.close();
  }
}

// Run the test
runMCPVisualTest()
  .then(result => {
    console.log('\n📊 Final Test Results:', JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test suite crashed:', error);
    process.exit(1);
  });