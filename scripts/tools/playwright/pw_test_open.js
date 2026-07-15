const { chromium } = require('@playwright/test');

(async () => {
  console.log("Launching browser in non-headless mode...");
  try {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    console.log("Navigating to google.com...");
    await page.goto('https://google.com');
    
    console.log("Browser is open and will not close. Press Ctrl+C in the terminal or close the window manually.");
    // Hang forever
    await new Promise(() => {});
  } catch (err) {
    console.error("Error occurred:", err.message);
  }
})();
