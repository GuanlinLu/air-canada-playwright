import { type Page } from '@playwright/test';
import { LoadingGuard } from '../guards/LoadingGuard';

/**
 * OptionsPage: Travel options/add-ons page (before payment).
 *
 * We skip all options and proceed directly to payment.
 */
export class OptionsPage {
  readonly page: Page;
  readonly continueToPaymentButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // Continue button may be "Continue to payment", "Proceed to checkout", etc.
    this.continueToPaymentButton = page
      .getByRole('button', { name: /continue.*payment|proceed.*checkout|continue.*checkout/i })
      .or(page.getByRole('button', { name: /continue|proceed/i }).first())
      .first();
  }

  /**
   * Ensures options page is loaded.
   */
  async ensureLoaded(): Promise<void> {
    await LoadingGuard.waitForOptionsReady(this.page);
  }

  /**
   * Continues to payment page (skips all options).
   */
  async continueToPayment(): Promise<void> {
    await this.continueToPaymentButton.click({ timeout: 15_000 });
  }
}
