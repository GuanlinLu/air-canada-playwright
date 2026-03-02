import { test, type Page } from '@playwright/test';
import { CookieGuard } from '../guards/CookieGuard';
import { HomePage } from '../pages/HomePage';
import { ResultsPage } from '../pages/ResultsPage';
import { ReviewPage } from '../pages/ReviewPage';
import { PassengerPage } from '../pages/PassengerPage';
import { SeatSelectionPage } from '../pages/SeatSelectionPage';
import { OptionsPage } from '../pages/OptionsPage';
import { PaymentPage } from '../pages/PaymentPage';

/**
 * BookingFlow: High-level business workflow for the booking funnel.
 *
 * WHY this is a Flow: Encapsulates the complete booking journey as a reusable
 * business process. Tests should be thin and only call Flow methods.
 *
 * Flow steps:
 * 1. Start search from home
 * 2. Filter and select flights (max 1 stop, cheapest fare)
 * 3. Proceed through review and passenger details
 * 4. Skip seats and reach options
 * 5. Continue to payment and assert
 */
export class BookingFlow {
  readonly page: Page;
  readonly homePage: HomePage;
  readonly resultsPage: ResultsPage;
  readonly reviewPage: ReviewPage;
  readonly passengerPage: PassengerPage;
  readonly seatSelectionPage: SeatSelectionPage;
  readonly optionsPage: OptionsPage;
  readonly paymentPage: PaymentPage;

  constructor(page: Page) {
    this.page = page;
    this.homePage = new HomePage(page);
    this.resultsPage = new ResultsPage(page);
    this.reviewPage = new ReviewPage(page);
    this.passengerPage = new PassengerPage(page);
    this.seatSelectionPage = new SeatSelectionPage(page);
    this.optionsPage = new OptionsPage(page);
    this.paymentPage = new PaymentPage(page);
  }

  /**
   * Step 1: Start search from home page.
   * Handles cookie consent and navigation.
   */
  async startSearchFromHome(params: {
    origin: string;
    destination: string;
    departureDate: { day: number; month: number; year: number };
    returnDate?: { day: number; month: number; year: number };
  }): Promise<void> {
    await test.step('Home: open site and accept cookies', async () => {
      // Business step boundary for reporting
      await this.homePage.goto();
      await CookieGuard.acceptIfPresent(this.page);
    });

    await test.step(
      `Home: search flights ${params.origin} -> ${params.destination}`,
      async () => {
        // Business step boundary for reporting
        await this.homePage.startSearchFromHome(params);
        //await CookieGuard.acceptIfPresent(this.page); // May appear after search
      },
    );
  }

  /**
   * Step 2: Filter results (max 1 stop) and select flights.
   *
   * Business rules:
   * - First move on results page: click filter to open sidebar (then set max 1 stop and apply).
   * - Then select first card -> cheapest fare.
   * - For return trips: select outbound then inbound.
   */
  async filterAndSelectFlightMax1Stop(params: { tripType: 'oneway' | 'return' }): Promise<void> {
    await test.step('Results: ensure loaded', async () => {
      // Business step boundary for reporting
      await this.resultsPage.ensureLoaded();
    });

    await test.step('Results: open filters', async () => {
      // Business step boundary for reporting
      await this.resultsPage.openFilters();
    });

    await test.step('Results: apply max stops = 1', async () => {
      // Business step boundary for reporting
      await this.resultsPage.applyMaxStopsFilter(1);
    });

    await test.step(`Results: select cheapest fare (${params.tripType})`, async () => {
      // Business step boundary for reporting
      if (params.tripType === 'return') {
        await this.resultsPage.selectFirstCardCheapestFareReturnTrip();
      } else {
        await this.resultsPage.selectFirstCardCheapestFareOneWay();
      }
    });
  }

  /**
   * Step 3: Proceed through review and passenger details.
   */
  async proceedThroughReviewPassenger(): Promise<void> {
    await test.step('Review: ensure loaded, accept cookies, continue', async () => {
      // Business step boundary for reporting
      await this.reviewPage.ensureLoaded();
      await CookieGuard.acceptIfPresent(this.page);
      await this.reviewPage.continue();
    });

    await test.step(
      'Passenger: ensure loaded, accept cookies, fill minimal info, continue',
      async () => {
        // Business step boundary for reporting
        await this.passengerPage.ensureLoaded();
        await CookieGuard.acceptIfPresent(this.page);
        await this.passengerPage.fillMinimalPassengerInfo();
        await this.passengerPage.continue();
      },
    );
  }

  /**
   * Step 4: Skip seat selection and reach options page.
   */
  async skipSeatsAndReachOptions(): Promise<void> {
    await test.step('Seats: skip seats and continue to options', async () => {
      // Business step boundary for reporting
      await this.seatSelectionPage.skipSeatsAndContinueToOptions();
    });

    await test.step('Options: accept cookies and ensure loaded', async () => {
      // Business step boundary for reporting
      await CookieGuard.acceptIfPresent(this.page);
      await this.optionsPage.ensureLoaded();
    });
  }

  /**
   * Step 5: Continue to payment and assert we reached payment page.
   * This is the end of the smoke test flow.
   */
  async continueToPaymentAndAssert(): Promise<void> {
    await test.step('Options: continue to payment', async () => {
      // Business step boundary for reporting
      await this.optionsPage.continueToPayment();
    });

    await test.step('Payment: accept cookies and assert loaded', async () => {
      // Business step boundary for reporting
      await CookieGuard.acceptIfPresent(this.page);
      await this.paymentPage.assertLoaded();
    });
  }
}
