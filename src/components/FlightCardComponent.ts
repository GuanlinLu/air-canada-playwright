import { type Locator, type Page } from '@playwright/test';

/** Cabin options for fare selection. Default is Economy. */
export type CabinOption = 'Economy' | 'Premium Economy' | 'Business Class';

/**
 * Parses a price string (e.g. "CA $8,004", "CAD 1,234.56", "$999") into a number.
 * Handles commas and common currency prefixes. Returns null if no valid number found.
 */
export function parsePrice(text: string): number | null {
  if (!text || typeof text !== 'string') return null;
  // Remove commas and match currency amount: CA $ / CAD / USD / $ followed by digits
  const normalized = text.replace(/,/g, '');
  const match = normalized.match(
    /(?:CA\s*\$|CAD|USD|\$)\s*(\d+(?:\.\d{2})?)|(\d+(?:\.\d{2})?)\s*(?:CAD|USD)/i
  );
  if (!match) return null;
  const value = parseFloat(match[1] || match[2]);
  return Number.isNaN(value) ? null : value;
}

/**
 * FlightCardComponent: Handles selection of flights and fare options.
 *
 * Two modes:
 * 1) Legacy: selectCheapestFare() on a pre-scoped card container.
 * 2) Full flow: first row expand + wait for fare section + cabin + cheapest fare (via ResultsPage).
 */
export class FlightCardComponent {
  readonly page: Page;
  readonly cardContainer: Locator;

  constructor(page: Page, cardContainer: Locator) {
    this.page = page;
    this.cardContainer = cardContainer;
  }

  /**
   * Stable locators for the fare section once expanded.
   * Used to wait for fare cards to be rendered (no hard waits / spinners).
   */
  static getFareSectionSignals(page: Page): Locator {
    return page
      .getByRole('heading', { name: /signature class|economy|premium economy|business class/i })
      .or(page.getByRole('tab', { name: /economy|premium|business/i }))
      .or(page.getByRole('button', { name: /economy|premium economy|business class/i }))
      .or(page.locator('text=/Lowest|Flexible|Standard|Basic/').first());
  }

  /**
   * Waits until the fare section is open: heading, cabin tabs, or fare card labels visible.
   */
  static async waitForFareSectionVisible(page: Page): Promise<void> {
    const signals = FlightCardComponent.getFareSectionSignals(page);
    await signals.first().waitFor({ state: 'visible', timeout: 15_000 });
  }

  /**
   * Clicks the cabin tab/button to restrict fare cards to that cabin.
   * After click, waits for at least one Select button (stable signal) instead of hard wait.
   */
  static async selectCabinTab(page: Page, cabin: CabinOption): Promise<void> {
    const tab = page
      .getByRole('tab', { name: new RegExp(cabin.replace(/\s+/g, '\\s*'), 'i') })
      .or(page.getByRole('button', { name: new RegExp(cabin.replace(/\s+/g, '\\s*'), 'i') }))
      .first();
    await tab.click({ timeout: 10_000 });
    await page.getByRole('button', { name: /^Select$/i }).first().waitFor({ state: 'visible', timeout: 10_000 });
  }

  /**
   * Within the current (possibly cabin-scoped) area, finds all fare cards with a "Select" button,
   * parses price from each card, picks the cheapest, and clicks its "Select" button.
   * Fallback: first "Lowest" card or first visible Select in scope.
   */
  static async selectCheapestFareInVisibleSection(
    page: Page,
    options: { cabin?: CabinOption } = {}
  ): Promise<void> {
    if (options.cabin) {
      await FlightCardComponent.selectCabinTab(page, options.cabin);
    }

    const selectButtons = page.getByRole('button', { name: /^Select$/i });
    const count = await selectButtons.count();
    if (count === 0) {
      // Fallback: any button/link with "Select" in name
      const fallback = page.getByRole('button', { name: /select/i }).first();
      await fallback.click({ timeout: 10_000 });
      return;
    }

    const fareData: Array<{ selectButton: Locator; price: number }> = [];

    for (let i = 0; i < count; i++) {
      const selectButton = selectButtons.nth(i);
      // Card = parent (or grandparent) of Select button; price is usually in same block
      const card = selectButton.locator('..');
      let cardText = await card.textContent().catch(() => '');
      if (!cardText || parsePrice(cardText) === null) {
        cardText = await selectButton.locator('../..').textContent().catch(() => '');
      }
      const price = parsePrice(cardText ?? '');
      if (price !== null) {
        fareData.push({ selectButton, price });
      }
    }

    if (fareData.length === 0) {
      // Fallback: first card labeled "Lowest", or first Select
      const lowestLabel = page.getByText(/Lowest/i).first();
      const hasLowest = await lowestLabel.isVisible().catch(() => false);
      if (hasLowest) {
        const cardWithLowest = lowestLabel.locator('..');
        const selectInLowest = cardWithLowest.getByRole('button', { name: /select/i }).first();
        await selectInLowest.click({ timeout: 10_000 });
        return;
      }
      await selectButtons.first().click({ timeout: 10_000 });
      return;
    }

    fareData.sort((a, b) => a.price - b.price);
    await fareData[0].selectButton.click({ timeout: 10_000 });
  }

  /**
   * Legacy: finds fare options within this card container and selects the cheapest.
   */
  async selectCheapestFare(): Promise<void> {
    const fareOptions = this.cardContainer
      .locator('button, a')
      .filter({ hasText: /\$|CAD|USD|price|fare|basic|standard|flex|select/i });

    const count = await fareOptions.count();
    if (count === 0) {
      throw new Error('No fare options found in flight card');
    }

    const fareData: Array<{ locator: Locator; price: number }> = [];

    for (let i = 0; i < count; i++) {
      const option = fareOptions.nth(i);
      const text = await option.textContent();
      if (!text) continue;
      const price = parsePrice(text);
      if (price !== null) {
        fareData.push({ locator: option, price });
      }
    }

    if (fareData.length === 0) {
      await fareOptions.first().click({ timeout: 10_000 });
      return;
    }

    fareData.sort((a, b) => a.price - b.price);
    await fareData[0].locator.click({ timeout: 10_000 });
  }

  /**
   * Static helper: first flight result row on the page (top of list).
   */
  static firstCard(page: Page): FlightCardComponent {
    const firstCard = page
      .locator('[data-testid*="flight-card"], [data-testid*="result-card"], [class*="flight-card"]')
      .first()
      .or(page.getByRole('article').first())
      .or(page.locator('[role="listitem"]').first());
    return new FlightCardComponent(page, firstCard);
  }
}
