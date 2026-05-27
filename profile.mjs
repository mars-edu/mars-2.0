import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.text().includes('[PROFILE]')) {
      console.log(msg.text());
    }
  });

  console.log("Navigating to login...");
  await page.goto('http://localhost:5173/login');
  // Need to log in if there's authentication.
  // Wait, if we navigate directly to the journal page, we might be redirected if not logged in.
  // We can just try to see what the console says.
  
  console.log("Navigating to journal...");
  await page.goto('http://localhost:5173/journals/j9770kjey7dqg6ynkhnmxdta2n7z5k57?from=journals');
  
  await page.waitForTimeout(5000);
  
  await browser.close();
})();
