import { type Page } from '@playwright/test';

/**
 * Safely dismiss cookie/consent banners if present.
 * Uses short timeout so we don't block the test when the banner is absent or already dismissed.
 * Prefer role/accessible name so we're not tied to specific button text or class names.
 */
export async function acceptConsentIfPresent(page: Page): Promise<void> {
  const acceptButton = page
    .getByRole('button', { name: /accept|agree|allow all|ok|continue/i })
    .first();

  try {
    await acceptButton.click({ timeout: 5_000 });
  } catch {
    // Banner not present or already accepted — continue without failing.
  }
}
