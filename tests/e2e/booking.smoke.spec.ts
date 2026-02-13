import { test } from '@playwright/test';
import { BookingFlow } from '../../src/flows/BookingFlow';
import { searchData } from '../../fixtures/searchData';

/**
 * Smoke test: Complete booking funnel from search to payment.
 *
 * Tag: @smoke
 * Run with: npx playwright test --grep @smoke
 *
 * WHY thin spec: Test only orchestrates the Flow. All business logic and
 * UI details are encapsulated in Flow, Pages, Components, and Guards.
 */
test.describe('Booking Funnel Smoke', () => {
  test('@smoke complete booking flow to payment page', async ({ page }) => {
    const bookingFlow = new BookingFlow(page);

    // Step 1: Start search
    await bookingFlow.startSearchFromHome({
      origin: searchData.origin,
      destination: searchData.destination,
      departureDate: searchData.departureDate,
      returnDate: searchData.returnDate, // Return trip
    });

    // Step 2: Filter and select flights
    await bookingFlow.filterAndSelectFlightMax1Stop({ tripType: 'return' });

    // Step 3: Review and passenger details
    await bookingFlow.proceedThroughReviewPassenger();

    // Step 4: Skip seats
    await bookingFlow.skipSeatsAndReachOptions();

    // Step 5: Continue to payment and assert
    await bookingFlow.continueToPaymentAndAssert();
  });

  test('@smoke one-way booking flow to payment page', async ({ page }) => {
    const bookingFlow = new BookingFlow(page);

    // Step 1: Start search (one-way)
    await bookingFlow.startSearchFromHome({
      origin: searchData.origin,
      destination: searchData.destination,
      departureDate: searchData.departureDate,
      // No returnDate = one-way
    });

    // Step 2: Filter and select flights
    await bookingFlow.filterAndSelectFlightMax1Stop({ tripType: 'oneway' });

    // Step 3: Review and passenger details
    await bookingFlow.proceedThroughReviewPassenger();

    // Step 4: Skip seats
    await bookingFlow.skipSeatsAndReachOptions();

    // Step 5: Continue to payment and assert
    await bookingFlow.continueToPaymentAndAssert();
  });
});
