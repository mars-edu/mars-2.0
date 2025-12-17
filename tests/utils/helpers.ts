import { Page } from '@playwright/test';

export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: /login|войти/i }).click();
  await page.waitForLoadState('networkidle');
}

export async function logout(page: Page) {
  await page.goto('/profile');
  const logoutButton = page.getByRole('button', { name: /logout|выход/i });
  if (await logoutButton.count() > 0) {
    await logoutButton.click();
    await page.waitForLoadState('networkidle');
  }
}

export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
}

export async function takeScreenshotOnFailure(page: Page, testInfo: any) {
  if (testInfo.status !== testInfo.expectedStatus) {
    const screenshot = await page.screenshot();
    await testInfo.attach('screenshot', {
      body: screenshot,
      contentType: 'image/png',
    });
  }
}

export async function clearLocalStorage(page: Page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

export async function mockApiResponse(
  page: Page,
  url: string,
  response: any,
  status = 200
) {
  await page.route(url, (route) => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}
