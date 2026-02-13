import { type Page } from '@playwright/test';

/**
 * LoadingGuard: Waits for stable page states using unique locators/URL patterns.
 *
 * WHY this is a Guard: Loading states, redirects, and spinners are transient.
 * We don't wait for spinners to disappear; we wait for stable page signals
 * (unique locators or URL patterns) that indicate the page is ready.
 *
 * Strategy: Each method waits for a specific stable signal that uniquely
 * identifies the target page is loaded and ready for interaction.
 */
export class LoadingGuard {
  /**
   * Waits for results page to be ready.
   * Stable signals (tried in order): results region/testid, URL pattern, or any flight row / Select.
   */
  static async waitForResultsReady(page: Page): Promise<void> {
    const resultsContainer = page
      .getByRole('region', { name: /results|flights|offers/i })
      .or(page.locator('[data-testid*="result"], [data-testid*="flight-list"]').first());

    try {
      await resultsContainer.waitFor({ state: 'visible', timeout: 45_000 });
      return;
    } catch {
      // Fallback 1: URL pattern (e.g. /booking/... or /search)
      try {
        await page.waitForURL(/\/(search|results|booking|bkmg)/, { timeout: 20_000 });
        return;
      } catch {
        // Fallback 2: any flight result row or Select button (Air Canada may use different structure)
        const anyResult = page.locator('[data-testid*="flight"], [class*="flight-result"], [role="listitem"]').first()
          .or(page.getByRole('button', { name: /select|choose fare/i }).first());
        await anyResult.waitFor({ state: 'visible', timeout: 25_000 });
      }
    }
  }

  /**
   * Waits for review page to be ready.
   * Stable signal: review/booking summary heading OR URL contains /review or /booking.
   */
  static async waitForReviewReady(page: Page): Promise<void> {
    const reviewHeading = page.getByRole('heading', {
      name: /review|booking summary|trip summary/i,
    });

    try {
      await reviewHeading.first().waitFor({ state: 'visible', timeout: 30_000 });
    } catch {
      // Fallback: check URL pattern
      await page.waitForURL(/\/review|\/booking/, { timeout: 30_000 });
    }
  }

  /**
   * Waits for passenger page to be ready.
   * Stable signal: passenger/contact heading OR URL contains /passenger or /contact.
   */
  static async waitForPassengerReady(page: Page): Promise<void> {
    const passengerHeading = page.getByRole('heading', {
      name: /passenger|contact|traveler|guest details/i,
    });

    try {
      await passengerHeading.first().waitFor({ state: 'visible', timeout: 30_000 });
    } catch {
      // Fallback: check URL pattern
      await page.waitForURL(/\/passenger|\/contact|\/traveler/, { timeout: 30_000 });
    }
  }

  /**
   * Waits for seat selection page OR options page to be ready.
   * Stable signal: seat selection heading OR options heading OR URL pattern.
   */
  static async waitForSeatSelectionOrOptionsReady(page: Page): Promise<void> {
    const seatHeading = page.getByRole('heading', { name: /seat|seating/i });
    const optionsHeading = page.getByRole('heading', { name: /options|add-ons|extras/i });

    try {
      await Promise.race([
        seatHeading.first().waitFor({ state: 'visible', timeout: 30_000 }),
        optionsHeading.first().waitFor({ state: 'visible', timeout: 30_000 }),
      ]);
    } catch {
      // Fallback: check URL pattern
      await page.waitForURL(/\/seat|\/options|\/add-ons/, { timeout: 30_000 });
    }
  }

  /**
   * Waits for options page to be ready.
   * Stable signal: options/add-ons heading OR URL contains /options or /add-ons.
   */
  static async waitForOptionsReady(page: Page): Promise<void> {
    const optionsHeading = page.getByRole('heading', {
      name: /options|add-ons|extras|travel options/i,
    });

    try {
      await optionsHeading.first().waitFor({ state: 'visible', timeout: 30_000 });
    } catch {
      // Fallback: check URL pattern
      await page.waitForURL(/\/options|\/add-ons/, { timeout: 30_000 });
    }
  }

  /**
   * Waits for payment page to be ready.
   * Stable signal: payment heading OR URL contains /payment or /checkout.
   */
  static async waitForPaymentReady(page: Page): Promise<void> {
    const paymentHeading = page.getByRole('heading', {
      name: /payment|checkout|billing|payment method/i,
    });

    try {
      await paymentHeading.first().waitFor({ state: 'visible', timeout: 30_000 });
    } catch {
      // Fallback: check URL pattern
      await page.waitForURL(/\/payment|\/checkout|\/billing/, { timeout: 30_000 });
    }
  }
}
