import { type Page } from '@playwright/test';

/**
 * CookieGuard: Safely handles cookie/consent banners that may appear at any point.
 *
 * WHY this is a Guard: Cookie banners are transient and can appear on homepage
 * or after navigation. We must accept them so they don't block clicks.
 *
 * Strategy:
 * - Primary: OneTrust accept button (#onetrust-accept-btn-handler, "Accept all").
 * - Fallbacks: role/text locators for other consent implementations.
 * - Wait up to 8s for banner; retry once after delay for late-rendering.
 */
export class CookieGuard {
  /** OneTrust accept button (Air Canada). Stable ID; text is "Accept all". */
  private static readonly ONETRUST_ACCEPT_SELECTOR = '#onetrust-accept-btn-handler';

  /**
   * Locators for the "accept" action. Primary = OneTrust ID; fallbacks = role/text.
   */
  private static getAcceptLocators(page: Page) {
    return [
      page.locator(CookieGuard.ONETRUST_ACCEPT_SELECTOR),
      page.getByRole('button', { name: /accept all|accept|agree|allow all|allow|ok|continue|yes/i }),
      page.getByRole('link', { name: /accept all|accept|agree|allow all|allow|ok|continue/i }),
      page.locator('[role="dialog"], [class*="cookie"], [class*="consent"], [id*="cookie"]').locator('button, a').filter({ hasText: /accept|agree|allow all|ok/i }).first(),
    ];
  }

  /**
   * Tries to click an accept control. Returns true if clicked, false if not found in time.
   */
  private static async tryAcceptOnce(page: Page, waitTimeoutMs: number): Promise<boolean> {
    for (const loc of CookieGuard.getAcceptLocators(page)) {
      try {
        await loc.first().waitFor({ state: 'visible', timeout: waitTimeoutMs });
        await loc.first().click({ timeout: 3_000 });
        return true;
      } catch {
        continue;
      }
    }
    return false;
  }

  /**
   * Accepts cookie consent if present. Safe to call multiple times.
   *
   * On homepage: waits up to 8s for the banner, then clicks. Retries once after
   * 1.5s to catch banners that render after initial paint.
   */
  static async acceptIfPresent(page: Page): Promise<void> {
    const waitTimeout = 8_000;

    const accepted = await CookieGuard.tryAcceptOnce(page, waitTimeout);
    if (accepted) return;

    // Retry after short delay (homepage banner sometimes appears after a moment)
    await page.waitForTimeout(1_500);
    await CookieGuard.tryAcceptOnce(page, 3_000);
  }
}
