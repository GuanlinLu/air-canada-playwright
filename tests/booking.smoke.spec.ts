import { test } from '@playwright/test';
import { BookingFlow } from '../src/flows/BookingFlow';
import { searchData } from '../fixtures/searchData';

/**
 * Smoke test: Complete booking funnel from search to payment.
 *
 * Tag: @smoke
 * Run with: npx playwright test --grep "@smoke"
 *
 * Flow: Home (search) → Results (filter first: open filter, Max. 1 stop, Done → then select first row + cheapest fare)
 *       → Review → Passenger → Skip seats → Options → Payment (assert only).
 */
test.describe('Booking funnel smoke', () => {
  test('@smoke complete booking flow to payment page', async ({ page }) => {
    const bookingFlow = new BookingFlow(page);

    await bookingFlow.startSearchFromHome({
      origin: searchData.origin,
      destination: searchData.destination,
      departureDate: searchData.departureDate,
      returnDate: searchData.returnDate,
    });

    await bookingFlow.filterAndSelectFlightMax1Stop({ tripType: 'return' });
    await bookingFlow.proceedThroughReviewPassenger();
    await bookingFlow.skipSeatsAndReachOptions();
    await bookingFlow.continueToPaymentAndAssert();
  });

  test('@smoke one-way booking flow to payment page', async ({ page }) => {
    const bookingFlow = new BookingFlow(page);

    await bookingFlow.startSearchFromHome({
      origin: searchData.origin,
      destination: searchData.destination,
      departureDate: searchData.departureDate,
    });

    await bookingFlow.filterAndSelectFlightMax1Stop({ tripType: 'oneway' });
    await bookingFlow.proceedThroughReviewPassenger();
    await bookingFlow.skipSeatsAndReachOptions();
    await bookingFlow.continueToPaymentAndAssert();
  });
});
