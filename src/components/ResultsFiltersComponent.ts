import { type Locator, type Page } from '@playwright/test';

/**
 * ResultsFiltersComponent: Handles filter interactions on the results page.
 *
 * Flow:
 * 1) Click filter button → Stops options list shows in sidebar (#filtersDetailsDialogBody).
 * 2) Choose "Max. 1 stop" (abc-radio-button:nth-child(2) in Stops radio group).
 * 3) Click Done (#filtersDetailsDialogButton0) to close and apply, then continue on result page.
 */
export class ResultsFiltersComponent {
  readonly page: Page;
  /** Filter button that opens the sidebar (first action on results page). */
  readonly filtersButton: Locator;
  /** Stops options list container in the sidebar (wait for this after opening filter). */
  readonly stopsOptionsContainer: Locator;
  /** "Max. 1 stop" = second radio in Stops group (abc-radio-button:nth-child(2)). */
  readonly maxOneStopRadio: Locator;
  /** Done button to finish filter process and return to results. */
  readonly doneButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.filtersButton = page.getByRole('button', { name: /^Filters/i });
    this.stopsOptionsContainer = page.locator(
      '#filtersDetailsDialogBody > ac-ui-avail-filter-drawer-modal-pres > div > div > div:nth-child(2) > div > form > abc-radio-group > div > div'
    );
    this.maxOneStopRadio = page.locator(
      '#filtersDetailsDialogBody > ac-ui-avail-filter-drawer-modal-pres > div > div > div:nth-child(2) > div > form > abc-radio-group > div > div > abc-radio-button:nth-child(2)'
    );
    this.doneButton = page.locator('#filtersDetailsDialogButton0');
  }

  /**
   * Opens the filters sidebar by clicking the filter button.
   * Waits until the Stops options list is visible in the sidebar.
   */
  async open(): Promise<void> {
    await this.filtersButton.click({ timeout: 10_000 });
    await this.stopsOptionsContainer.waitFor({ state: 'visible', timeout: 10_000 });
  }

  /**
   * Sets max stops when the sidebar is already open.
   * For maxStops === 1: clicks "Max. 1 stop" radio, then Done.
   */
  async setMaxStopsOnly(maxStops: number): Promise<void> {
    if (maxStops === 1) {
      await this.maxOneStopRadio.click({ timeout: 10_000 });
    } else {
      const stopOption = this.page.locator(
        `#filtersDetailsDialogBody abc-radio-button:nth-child(${maxStops + 1})`
      ).first();
      await stopOption.click({ timeout: 10_000 });
    }
    await this.doneButton.click({ timeout: 10_000 });
  }

  /**
   * Full flow: open sidebar, set max stops, click Done.
   */
  async setMaxStops(maxStops: number): Promise<void> {
    await this.open();
    await this.setMaxStopsOnly(maxStops);
  }
}
