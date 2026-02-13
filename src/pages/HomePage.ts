import { type Locator, type Page } from '@playwright/test';

/**
 * HomePage: Flight search entry point.
 *
 * Encapsulates the home page search form. Uses stable IDs and role-based locators
 * for maintainability.
 */
export class HomePage {
  readonly page: Page;
  readonly originInput: Locator;
  readonly destinationInput: Locator;
  readonly departureDateButton: Locator;
  readonly searchButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // Use the large tiles labelled "Departing from" / "Arriving in"
    this.originInput = page.getByRole('button', { name: /departing from/i }).first();
    this.destinationInput = page.getByRole('button', { name: /arriving in/i }).first();
    // Departure date field has a stable ID
    this.departureDateButton = page.locator('#bkmg-desktop_travelDates-formfield-1');
    // Search button has a stable ID
    this.searchButton = page.locator('#bkmg-desktop_findButton');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  /**
   * Origin/destination tiles open a dedicated input bar.
   * We wait for the specific input by ID so we never accidentally target the wrong field.
   */
  private async openPanelAndSelectLocation(trigger: Locator, inputSelector: string, value: string): Promise<void> {
    await trigger.click();
    const searchInput = this.page.locator(inputSelector);
    await searchInput.waitFor({ state: 'visible', timeout: 10_000 });
    await searchInput.fill(value);
    const firstOption = this.page.getByRole('option').first();
    await firstOption.waitFor({ state: 'visible', timeout: 10_000 });
    await firstOption.click();
  }

  async fillOrigin(origin: string): Promise<void> {
    await this.openPanelAndSelectLocation(this.originInput, '#flightsOriginLocation', origin);
  }

  async fillDestination(destination: string): Promise<void> {
    await this.openPanelAndSelectLocation(this.destinationInput, '#flightsOriginDestination', destination);
  }

  /**
   * Utility: build the concrete date-cell selector used by Air Canada calendar.
   */
  private buildDateSelector(year: number, month: number, day: number): string {
    const mm = month.toString().padStart(2, '0');
    const dd = day.toString().padStart(2, '0');
    return `#bkmg-desktop_travelDates-date-${year}-${mm}-${dd} > p`;
  }

  /**
   * Select departure and return dates in the side-by-side calendar.
   */
  async selectDepartureAndReturnDates(
    departure: { day: number; month: number; year: number },
    ret: { day: number; month: number; year: number }
  ): Promise<void> {
    await this.departureDateButton.click();

    const departureSelector = this.buildDateSelector(
      departure.year,
      departure.month,
      departure.day
    );
    const returnSelector = this.buildDateSelector(
      ret.year,
      ret.month,
      ret.day
    );

    await this.page.locator(departureSelector).click({ timeout: 10_000 });
    await this.page.locator(returnSelector).click({ timeout: 10_000 });

    // Confirm the date selection
    await this.page.locator('#bkmg-desktop_travelDates_1_confirmDates').click({ timeout: 10_000 });
  }

  /**
   * Clicks the search button to submit the flight search.
   */
  async search(): Promise<void> {
    await this.searchButton.click({ timeout: 10_000 });
  }

  /**
   * High-level method: Start search from home page.
   * Fills origin, destination, dates, and clicks search.
   */
  async startSearchFromHome(params: {
    origin: string;
    destination: string;
    departureDate: { day: number; month: number; year: number };
    returnDate?: { day: number; month: number; year: number };
  }): Promise<void> {
    await this.fillOrigin(params.origin);
    await this.fillDestination(params.destination);

    if (params.returnDate) {
      await this.selectDepartureAndReturnDates(params.departureDate, params.returnDate);
    } else {
      // One-way: site often requires both dates for confirm to enable. Use same date twice.
      await this.selectDepartureAndReturnDates(params.departureDate, params.departureDate);
    }

    await this.search();
  }
}
