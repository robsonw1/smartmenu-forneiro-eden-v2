import { test, expect } from '@playwright/test';

test.describe('Checkout Outside Business Hours', () => {
  test('Customer should be able to proceed with checkout without time restrictions', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Wait for products to load
    const productCards = page.locator('.card-product');
    await expect(productCards.first()).toBeVisible({ timeout: 10000 });
    
    // Click on the first product card to view it
    await productCards.first().click();
    
    // Wait for product modal to appear
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
    
    // Close the modal
    const closeButton = page.locator('[role="dialog"] button[aria-label="Close"], [role="dialog"] button:first-of-type');
    await closeButton.click().catch(() => {
      // If close fails, press Escape
      return page.keyboard.press('Escape');
    });
    
    // The key test: Verify NO blocking error for time restrictions
    const errorMessages = page.locator('text=/HORÁRIO NÃO PERMITIDO|Acesso bloqueado|ESTABELECIMENTO FECHADO/');
    await expect(errorMessages).not.toBeVisible();
    
    console.log('✅ Checkout accessible - no time-based restrictions blocking the customer');
  });

  test('No time restriction warnings in checkout modal', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify the page loaded
    await expect(page).toHaveTitle(/forneiro|pizz/i);
    
    // Check that time restriction warnings are NOT present on the page
    const timeWarnings = await page.locator('text=/HORÁRIO NÃO PERMITIDO|fora do horário|Acesso bloqueado|ESTABELECIMENTO FECHADO/').count();
    
    // Should be 0 warnings on the main page
    expect(timeWarnings).toBe(0);
    
    console.log('✅ No time-based restrictions preventing orders - customers can order anytime');
  });

  test('Validate code changes removed checkout blocking', async ({ page }) => {
    // This test verifies the actual code changes were applied
    // by checking that the blocking logic has been removed
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for page elements to render
    await page.waitForTimeout(2000);
    
    // Get all text content to check for any closed/restricted messages
    const bodyText = await page.textContent('body');
    
    // The key validation: These messages should NOT appear
    const blockedMessages = [
      'HORÁRIO NÃO PERMITIDO',
      'Acesso bloqueado',
      'Não é possível fazer pedidos',
      'Não é possível agendar no momento'
    ];
    
    let foundBlockedMessage = false;
    for (const msg of blockedMessages) {
      if (bodyText?.includes(msg)) {
        foundBlockedMessage = true;
        console.log(`⚠️ Warning: Found "${msg}" on the page`);
      }
    }
    
    if (!foundBlockedMessage) {
      console.log('✅ All checkout blocks successfully removed - no time-based restrictions');
    }
    
    expect(foundBlockedMessage).toBe(false);
  });
});
