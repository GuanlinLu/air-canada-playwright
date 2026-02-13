import { type Page } from '@playwright/test';
import { LoadingGuard } from '../guards/LoadingGuard';
import { ResultsFiltersComponent } from '../components/ResultsFiltersComponent';
import {
  FlightCardComponent,
  type CabinOption,
} from '../components/FlightCardComponent';

/**
 * ResultsPage: Flight search results page.
 *
 * Handles filtering and flight selection:
 * - Apply max 1 stop filter FIRST (opens filter button, sidebar, then "Max. 1 stop" under Stops)
 * - Then select first result ROW to expand fare section and choose cheapest fare in a cabin
 * - For return trips: run selection twice (outbound then inbound)
 */
export class ResultsPage {
  readonly page: Page;
  readonly filtersComponent: ResultsFiltersComponent;

  constructor(page: Page) {
    this.page = page;
    this.filtersComponent = new ResultsFiltersComponent(page);
  }

  /**
   * Ensures results page is loaded and ready.
   */
  async ensureLoaded(): Promise<void> {
    await LoadingGuard.waitForResultsReady(this.page);
  }

  /**
   * First action on results page: open the filter sidebar (click filter button).
   * Call this before selecting any flight row. Then call applyMaxStopsFilter to set and apply.
   */
  async openFilters(): Promise<void> {
    await this.filtersComponent.open();
  }

  /**
   * Locator for the first flight result ROW (top of list). Clicking it expands the fare section.
   */
  private getFirstFlightResultRow() {
    return this.page
      .locator('[data-testid*="flight"], [data-testid*="result"], [class*="flight-result"]')
      .first()
      .or(this.page.getByRole('listitem').first())
      .or(this.page.getByRole('article').first());
  }

  /**
   * Optional expand trigger: "Select a fare below" when fare cards are not yet visible.
   */
  private getSelectFareBelowTrigger() {
    return this.page
      .getByRole('button', { name: /select a fare below|select fare|choose fare/i })
      .or(this.page.getByText(/select a fare below/i).first());
  }

  /**
   * 1) Clicks the first flight result row to open the fare section.
   * 2) Waits until fare cards are visible (stable locators).
   * 3) Optionally clicks "Select a fare below" if it acts as expand trigger.
   * 4) Within the given cabin, selects the CHEAPEST fare card and clicks its "Select" button.
   *
   * @param options.cabin - 'Economy' | 'Premium Economy' | 'Business Class'. Defaults to Economy when omitted.
   *
   * Example:
   *   await resultsPage.selectFirstResultAndCheapestFare({ cabin: 'Business Class' });
   */
  async selectFirstResultAndCheapestFare(options: { cabin?: CabinOption } = {}): Promise<void> {
    const cabin: CabinOption = options.cabin ?? 'Economy';

    const firstRow = this.getFirstFlightResultRow();
    await firstRow.click({ timeout: 15_000 });

    await FlightCardComponent.waitForFareSectionVisible(this.page);

    const selectFareBelow = this.getSelectFareBelowTrigger();
    const isTriggerVisible = await selectFareBelow.isVisible().catch(() => false);
    if (isTriggerVisible) {
      await selectFareBelow.click({ timeout: 5_000 }).catch(() => {});
      await FlightCardComponent.waitForFareSectionVisible(this.page);
    }

    await FlightCardComponent.selectCheapestFareInVisibleSection(this.page, { cabin });
  }

  /**
   * Applies max stops filter (e.g., max 1 stop). Expects filter sidebar already open (after openFilters()).
   * Selects "Max. 1 stop" under Stops and applies. Call openFilters() first.
   */
  async applyMaxStopsFilter(maxStops: number): Promise<void> {
    await this.filtersComponent.setMaxStopsOnly(maxStops);
    await LoadingGuard.waitForResultsReady(this.page);
  }

  /**
   * One-way: select first result row and cheapest fare (default cabin Economy).
   */
  async selectFirstCardCheapestFareOneWay(options: { cabin?: CabinOption } = {}): Promise<void> {
    await this.selectFirstResultAndCheapestFare(options);
  }

  /**
   * Return trip: select outbound (first row + cheapest fare), then inbound (first row + cheapest fare).
   */
  async selectFirstCardCheapestFareReturnTrip(options: { cabin?: CabinOption } = {}): Promise<void> {
    await this.selectFirstResultAndCheapestFare(options);
    await LoadingGuard.waitForResultsReady(this.page);
    await this.selectFirstResultAndCheapestFare(options);
  }
}
