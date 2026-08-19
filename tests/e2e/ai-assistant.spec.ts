import { test, expect } from '@playwright/test';
import { loginAsTeacher, waitForPageLoad } from '../utils/helpers';

test.describe('AI Assistant Suite', () => {
  test.setTimeout(35000);

  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto('/home');
    await waitForPageLoad(page);
  });

  test('should display AI Assistant FAB button on pages', async ({ page }) => {
    const fabButton = page.locator('.ai-assistant-fab, .fab.ai-assistant-fab').first();
    await expect(fabButton).toBeVisible({ timeout: 15000 });
  });

  test('should toggle AI Assistant panel and display header controls', async ({ page }) => {
    const fabButton = page.locator('.ai-assistant-fab, .fab.ai-assistant-fab').first();
    await fabButton.click();

    // Verify popup appears
    const popup = page.locator('#ai-assistant-popup, .popup.modal-in, .ai-panel-root').first();
    await expect(popup).toBeVisible({ timeout: 15000 });

    // Verify title inside panel
    const assistantTitle = page.locator('text=MARS Ассистент').first();
    await expect(assistantTitle).toBeVisible({ timeout: 15000 });

    // Verify Voice and Chat tab buttons
    const voiceTabBtn = page.locator('button:has-text("Голос")').first();
    const chatTabBtn = page.locator('button:has-text("Чат")').first();

    await expect(voiceTabBtn).toBeVisible({ timeout: 15000 });
    await expect(chatTabBtn).toBeVisible({ timeout: 15000 });

    // Close panel
    await page.keyboard.press('Escape');
  });

  test('should display voice tab with visualizer and control buttons', async ({ page }) => {
    const fabButton = page.locator('.ai-assistant-fab, .fab.ai-assistant-fab').first();
    await fabButton.click();

    // Switch to Voice tab if not already active
    const voiceTabBtn = page.locator('button:has-text("Голос")').first();
    await expect(voiceTabBtn).toBeVisible({ timeout: 15000 });
    await voiceTabBtn.click();

    // Verify visualizer svg or start conversation button
    const startConvoBtn = page.locator('button').filter({ hasText: /Начать разговор|Подключение/i }).first();
    await expect(startConvoBtn).toBeVisible({ timeout: 15000 });

    // Close panel
    await page.keyboard.press('Escape');
  });

  test('should switch to chat tab and interact with message input box', async ({ page }) => {
    const fabButton = page.locator('.ai-assistant-fab, .fab.ai-assistant-fab').first();
    await fabButton.click();

    // Click Chat tab
    const chatTabBtn = page.locator('button:has-text("Чат")').first();
    await expect(chatTabBtn).toBeVisible({ timeout: 15000 });
    await chatTabBtn.click();

    // Input box
    const chatInput = page.locator('input[placeholder*="Напиши сообщение"]').first();
    await expect(chatInput).toBeVisible({ timeout: 15000 });

    // Type a message
    await chatInput.fill('Привет, расскажи о расписании');
    expect(await chatInput.inputValue()).toBe('Привет, расскажи о расписании');

    // Verify send button is enabled
    const sendBtn = page.locator('#ai-assistant-popup button[type="submit"]').first();
    await expect(sendBtn).toBeEnabled({ timeout: 15000 });

    // Clear input
    await chatInput.fill('');

    // Close panel
    await page.keyboard.press('Escape');
  });
});
