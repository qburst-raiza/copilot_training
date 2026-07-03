// Playwright Demo Script
// Purpose: Opens and demonstrates Playwright documentation page

const { chromium } = require('playwright');
const path = require('path');

async function openPlaywrightDocs(options = {}) {
  // Configuration with defaults
  const config = {
    headless: options.headless !== undefined ? options.headless : true,
    timeout: options.timeout || 30000,
    screenshotPath: options.screenshotPath || 'playwright-docs-screenshot.png',
    url: options.url || 'https://playwright.dev/'
  };

  let browser = null;
  
  try {
    // Validate URL
    if (!config.url.startsWith('http')) {
      throw new Error('Invalid URL: URL must start with http or https');
    }

    // Validate screenshotPath to prevent path traversal attacks (OWASP A01)
    const resolvedScreenshotPath = path.resolve(config.screenshotPath);
    const allowedBase = path.resolve('.');
    if (!resolvedScreenshotPath.startsWith(allowedBase + path.sep) && resolvedScreenshotPath !== allowedBase) {
      throw new Error('Invalid screenshot path: Path traversal is not allowed');
    }

    // Launch browser in headless mode
    console.log('Launching browser...');
    browser = await chromium.launch({ 
      headless: config.headless 
    });
    
    // Create a new context with timeout settings
    const context = await browser.newContext();
    
    // Create a new page with timeout
    const page = await context.newPage();
    page.setDefaultTimeout(config.timeout);
    
    console.log(`Navigating to ${config.url}...`);
    
    // Navigate to URL with proper timeout and error handling
    let response;
    try {
      response = await page.goto(config.url, {
        waitUntil: 'networkidle'
      });
    } catch (navError) {
      if (navError.message.includes('net::ERR_NAME_NOT_RESOLVED')) {
        throw new Error('Network error: Unable to resolve hostname. Check your internet connection.');
      }
      throw navError;
    }

    // Assertion: Verify HTTP response status is 200 (OK)
    const httpStatus = response ? response.status() : null;
    if (httpStatus !== 200) {
      throw new Error(`Assertion failed: Expected HTTP response status 200, but got ${httpStatus}`);
    }
    console.log(`\u2713 Assertion passed: HTTP response status is ${httpStatus} (OK)`);
    
    // Get the page title
    const title = await page.title();
    console.log(`\u2713 Page loaded successfully. Title: ${title}`);
    
    // Assertion: Verify page title contains "Playwright"
    if (!title.toLowerCase().includes('playwright')) {
      throw new Error(`Assertion failed: Expected page title to contain "Playwright", but got "${title}"`);
    }
    console.log('\u2713 Assertion passed: Page title contains "Playwright"');
    
    // Take a screenshot for demo
    await page.screenshot({ path: config.screenshotPath });
    console.log(`\u2713 Screenshot saved as ${config.screenshotPath}`);
    
    // Wait for main content to be visible
    console.log('Waiting for main content...');
    await page.waitForLoadState('domcontentloaded');
    
    // Get page content statistics
    const headings = await page.locator('h1').allTextContents();
    const links = await page.locator('a').count();
    
    console.log(`\u2713 Found ${headings.length} h1 heading(s) on the page`);
    console.log(`\u2713 Found ${links} link(s) on the page`);
    
    if (headings.length > 0) {
      console.log(`  Main heading: ${headings[0].substring(0, 60)}`);
    }
    
    // Assertion: Verify at least one h1 heading exists
    if (headings.length === 0) {
      throw new Error('Assertion failed: Expected at least one h1 heading on the page');
    }
    console.log('\u2713 Assertion passed: At least one h1 heading found on the page');
    
    // Assertion: Verify sufficient navigation links are present
    if (links < 5) {
      throw new Error(`Assertion failed: Expected at least 5 links on the page, but found only ${links}`);
    }
    console.log(`\u2713 Assertion passed: Found ${links} links on the page (expected at least 5)`);
    
    // Assertion: Verify we're on the correct domain
    const currentUrl = page.url();
    if (!currentUrl.includes('playwright.dev')) {
      throw new Error(`Assertion failed: Expected URL to contain "playwright.dev", but got "${currentUrl}"`);
    }
    console.log(`\u2713 Assertion passed: Current URL is on correct domain (${currentUrl})`);
    
    console.log('\n\u2713 Playwright demo completed successfully!');
    console.log('\u2713 All assertions passed!');
    return { success: true, pageTitle: title, headingCount: headings.length };
    
  } catch (error) {
    console.error('\u274c Error during demo:', error.message);
    process.exitCode = 1;
    return { success: false, error: error.message };
  } finally {
    // Close the browser safely
    if (browser) {
      await browser.close();
      console.log('\u2713 Browser closed');
    }
  }
}

// Export function for use as module
module.exports = { openPlaywrightDocs };

// Run the demo if executed directly
if (require.main === module) {
  openPlaywrightDocs().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
