import { type Locator, type Page } from '@playwright/test';
import { LoadingGuard } from '../guards/LoadingGuard';

/**
 * PassengerPage: Passenger and contact details form.
 *
 * Fills minimal required information to proceed through booking.
 */
export class PassengerPage {
  readonly page: Page;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly continueButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // Use getByLabel for form fields (most accessible)
    this.firstNameInput = page.getByLabel(/first name|given name/i).first();
    this.lastNameInput = page.getByLabel(/last name|family name|surname/i).first();
    this.emailInput = page.getByLabel(/email|e-mail/i).first();
    this.phoneInput = page.getByLabel(/phone|telephone|mobile/i).first();
    this.continueButton = page
      .getByRole('button', { name: /continue|next|proceed/i })
      .first();
  }

  /**
   * Ensures passenger page is loaded.
   */
  async ensureLoaded(): Promise<void> {
    await LoadingGuard.waitForPassengerReady(this.page);
  }

  /**
   * Fills minimal passenger information required to proceed.
   * Uses test data that's safe for demo purposes.
   */
  async fillMinimalPassengerInfo(): Promise<void> {
    await this.firstNameInput.fill('Test');
    await this.lastNameInput.fill('Passenger');
    await this.emailInput.fill('test.passenger@example.com');
    await this.phoneInput.fill('5551234567');
  }

  /**
   * Continues to seat selection or options page.
   */
  async continue(): Promise<void> {
    await this.continueButton.click({ timeout: 15_000 });
  }
}
