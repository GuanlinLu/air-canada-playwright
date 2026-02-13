import { type Locator, type Page } from '@playwright/test';
import { LoadingGuard } from '../guards/LoadingGuard';

/**
 * ReviewPage: Booking review/summary page before passenger details.
 *
 * This is a transient page that shows trip summary. We only need to continue.
 */
export class ReviewPage {
  readonly page: Page;
  readonly continueButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // Continue button may be labeled "Continue", "Next", "Proceed", etc.
    this.continueButton = page
      .getByRole('button', { name: /continue|next|proceed|confirm/i })
      .first();
  }

  /**
   * Ensures review page is loaded.
   */
  async ensureLoaded(): Promise<void> {
    await LoadingGuard.waitForReviewReady(this.page);
  }

  /**
   * Continues to passenger details page.
   */
  async continue(): Promise<void> {
    await this.continueButton.click({ timeout: 15_000 });
  }
}
