import { type Page } from '@playwright/test';
import { LoadingGuard } from '../guards/LoadingGuard';

/**
 * PaymentPage: Payment/checkout page.
 *
 * IMPORTANT: We STOP here. Do NOT submit payment or fill payment details.
 * This is the end of the smoke test flow.
 */
export class PaymentPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Asserts that payment page is loaded.
   * This is the success criteria for the smoke test.
   */
  async assertLoaded(): Promise<void> {
    await LoadingGuard.waitForPaymentReady(this.page);

    // Additional assertion: verify we're actually on payment page
    const paymentHeading = this.page.getByRole('heading', {
      name: /payment|checkout|billing|payment method/i,
    });

    await paymentHeading.first().waitFor({ state: 'visible', timeout: 30_000 });
  }
}
