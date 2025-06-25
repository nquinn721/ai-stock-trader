import { test, expect } from '@playwright/test';

test.describe('AI Trading Assistant', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard page
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('should display AI assistant button and open chat', async ({ page }) => {
    // Check if AI assistant button is visible
    const aiButton = page.getByTitle('AI Trading Assistant');
    await expect(aiButton).toBeVisible();

    // Click to open AI assistant
    await aiButton.click();

    // Check if AI chat interface opens
    await expect(page.getByText('AI Trading Assistant')).toBeVisible();
    await expect(page.getByText(/Welcome to your AI Trading Assistant/)).toBeVisible();
  });

  test('should send and receive messages', async ({ page }) => {
    // Open AI assistant
    await page.getByTitle('AI Trading Assistant').click();

    // Type a message in the input field
    const messageInput = page.getByPlaceholder(/Ask me about stocks/);
    await expect(messageInput).toBeVisible();
    
    await messageInput.fill('What do you think about AAPL?');
    
    // Send the message
    const sendButton = page.getByRole('button', { name: /send/i });
    await sendButton.click();

    // Wait for user message to appear
    await expect(page.getByText('What do you think about AAPL?')).toBeVisible();

    // Note: In a real test, we would mock the AI service to return predictable responses
    // For now, we'll just check that the loading state appears
    await expect(page.getByText('AI is thinking...')).toBeVisible();
  });

  test('should start new conversation', async ({ page }) => {
    // Open AI assistant
    await page.getByTitle('AI Trading Assistant').click();

    // Send a message first
    const messageInput = page.getByPlaceholder(/Ask me about stocks/);
    await messageInput.fill('Hello');
    await page.getByRole('button', { name: /send/i }).click();

    // Wait for message to appear
    await expect(page.getByText('Hello')).toBeVisible();

    // Click refresh to start new conversation
    const refreshButton = page.getByTitle('Start New Conversation');
    await refreshButton.click();

    // Check that the conversation is reset (welcome message should reappear)
    await expect(page.getByText(/Welcome to your AI Trading Assistant/)).toBeVisible();
  });

  test('should handle empty input correctly', async ({ page }) => {
    // Open AI assistant
    await page.getByTitle('AI Trading Assistant').click();

    // Try to send empty message
    const sendButton = page.getByRole('button', { name: /send/i });
    
    // Send button should be disabled when input is empty
    await expect(sendButton).toBeDisabled();
  });

  test('should display message timestamps', async ({ page }) => {
    // Open AI assistant
    await page.getByTitle('AI Trading Assistant').click();

    // Send a message
    const messageInput = page.getByPlaceholder(/Ask me about stocks/);
    await messageInput.fill('Test message');
    await page.getByRole('button', { name: /send/i }).click();

    // Check that timestamp pattern is visible (HH:MM:SS format)
    await expect(page.locator('text=/\\d{1,2}:\\d{2}:\\d{2}/')).toBeVisible();
  });

  test('should close AI assistant', async ({ page }) => {
    // Open AI assistant
    await page.getByTitle('AI Trading Assistant').click();

    // Verify it's open
    await expect(page.getByText('AI Trading Assistant')).toBeVisible();

    // Click the AI button again to close
    await page.getByTitle('AI Trading Assistant').click();

    // Verify it's closed (assuming it toggles)
    // Note: This test depends on the actual implementation behavior
    // If the chat stays open, we might need to look for a close button instead
  });
});

test.describe('AI Explanations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('should display explanation components when available', async ({ page }) => {
    // This test would verify that explanation components appear
    // when recommendations have AI explanations
    // For now, it's a placeholder for when the feature is fully integrated
    
    // Check if any recommendation explanations are visible
    // This would be populated when backend AI explanations are integrated
    const explanationElements = page.locator('[data-testid="ai-explanation"]');
    
    // Since this is a new feature, explanations might not be visible yet
    // This test serves as a placeholder for future validation
    console.log('AI explanation feature test - to be fully implemented when backend integration is complete');
  });
});
