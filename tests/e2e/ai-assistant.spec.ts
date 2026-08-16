import { test, expect } from '@playwright/test';
import { loginAsTeacher, waitForPageLoad } from '../utils/helpers';

test.describe('AI Assistant Suite', () => {
  test.setTimeout(120000);

  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto('/home');
    await waitForPageLoad(page);
  });

  test('should display AI Assistant FAB button on pages', async ({ page }) => {
    const fabButton = page.locator('.ai-assistant-fab, .fab.ai-assistant-fab');
    await expect(fabButton).toBeVisible();
  });

  test('should toggle AI Assistant panel and display header controls', async ({ page }) => {
    const fabButton = page.locator('.ai-assistant-fab, .fab.ai-assistant-fab');
    await fabButton.click();
    await page.waitForTimeout(600);

    // Verify popup appears
    const popup = page.locator('#ai-assistant-popup, .popup.modal-in, .ai-panel-root');
    await expect(popup.first()).toBeVisible();

    // Verify title inside panel
    const assistantTitle = page.locator('text=MARS Ассистент');
    await expect(assistantTitle.first()).toBeVisible();

    // Verify Voice and Chat tab buttons
    const voiceTabBtn = page.locator('button').filter({ hasText: /^Голос$/i }).first();
    const chatTabBtn = page.locator('button').filter({ hasText: /^Чат$/i }).first();

    await expect(voiceTabBtn).toBeVisible();
    await expect(chatTabBtn).toBeVisible();

    // Close panel
    const closeBtn = page.locator('#ai-assistant-popup button').filter({ hasText: '' }).last();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }
  });

  test('should display voice tab with visualizer and control buttons', async ({ page }) => {
    const fabButton = page.locator('.ai-assistant-fab, .fab.ai-assistant-fab');
    await fabButton.click();
    await page.waitForTimeout(600);

    // Switch to Voice tab if not already active
    const voiceTabBtn = page.locator('button').filter({ hasText: /^Голос$/i }).first();
    await voiceTabBtn.click();
    await page.waitForTimeout(300);

    // Verify visualizer svg or start conversation button
    const startConvoBtn = page.locator('button').filter({ hasText: /Начать разговор|Подключение/i }).first();
    await expect(startConvoBtn).toBeVisible();

    // Close panel
    await page.keyboard.press('Escape');
  });

  test('should switch to chat tab and interact with message input box', async ({ page }) => {
    const fabButton = page.locator('.ai-assistant-fab, .fab.ai-assistant-fab');
    await fabButton.click();
    await page.waitForTimeout(600);

    // Click Chat tab
    const chatTabBtn = page.locator('button').filter({ hasText: /^Чат$/i }).first();
    await chatTabBtn.click();
    await page.waitForTimeout(300);

    // Verify empty state message or prompt
    const emptyPrompt = page.locator('text=Чем могу помочь?');
    if ((await emptyPrompt.count()) > 0) {
      await expect(emptyPrompt.first()).toBeVisible();
    }

    // Input box
    const chatInput = page.locator('input[placeholder*="Напиши сообщение"]').first();
    await expect(chatInput).toBeVisible();

    // Type a message
    await chatInput.fill('Привет, расскажи о расписании');
    expect(await chatInput.inputValue()).toBe('Привет, расскажи о расписании');

    // Verify send button is enabled
    const sendBtn = page.locator('#ai-assistant-popup button[type="submit"]').first();
    await expect(sendBtn).toBeEnabled();

    // Clear input
    await chatInput.fill('');

    // Close panel
    await page.keyboard.press('Escape');
  });
});
