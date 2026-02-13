import { type Page } from '@playwright/test';
import { LoadingGuard } from '../guards/LoadingGuard';

/**
 * SeatSelectionPage: Seat selection step (we skip seats).
 *
 * Business rule: Always skip seat selection and proceed to options.
 * Handles variations in button text and multi-step skip flows.
 */
export class SeatSelectionPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Skips seat selection and continues to travel options.
   *
   * Flow:
   * 1. If "Next flight" button exists (for return trips), click it
   * 2. Click "Continue to travel options" or equivalent
   *
   * WHY robust locators: Button text may vary ("Skip", "Continue", "Next flight",
   * "Continue to options", etc.). We use multiple fallbacks.
   */
  async skipSeatsAndContinueToOptions(): Promise<void> {
    // Check if we're on seat selection page
    const seatHeading = this.page.getByRole('heading', { name: /seat|seating/i });
    const isSeatPage = await seatHeading.first().isVisible().catch(() => false);

    if (!isSeatPage) {
      // Already past seat selection, proceed
      return;
    }

    // Step 1: Look for "Next flight" button (for return trips with multiple segments)
    const nextFlightButton = this.page
      .getByRole('button', { name: /next flight|skip.*next|continue.*next/i })
      .first();

    const hasNextFlight = await nextFlightButton.isVisible().catch(() => false);
    if (hasNextFlight) {
      await nextFlightButton.click({ timeout: 10_000 });
      // Wait a bit for the next segment to load
      await this.page.waitForTimeout(2_000);
    }

    // Step 2: Continue to travel options
    const continueToOptionsButton = this.page
      .getByRole('button', {
        name: /continue.*options|continue.*travel|skip.*options|proceed.*options|next.*options/i,
      })
      .or(this.page.getByRole('button', { name: /continue|skip|next/i }).first())
      .first();

    await continueToOptionsButton.click({ timeout: 15_000 });

    // Wait for options page to be ready
    await LoadingGuard.waitForOptionsReady(this.page);
  }
}
