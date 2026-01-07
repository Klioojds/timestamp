import { expect, type Locator, type Page } from '@playwright/test';
import { waitForLandingPage } from '../test-utils';

export class LandingFormPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/timestamp/');
    await waitForLandingPage(this.page);
  }

  async setViewportSize(viewport: { width: number; height: number }): Promise<void> {
    await this.page.setViewportSize(viewport);
  }

  get landingPage(): Locator {
    return this.page.getByTestId('landing-page');
  }

  get wrapper(): Locator {
    return this.page.getByTestId('landing-wrapper');
  }

  get card(): Locator {
    return this.page.getByTestId('landing-card');
  }

  get header(): Locator {
    return this.page.getByTestId('landing-header');
  }

  get footer(): Locator {
    return this.page.getByTestId('landing-footer');
  }

  get startButton(): Locator {
    return this.page.getByTestId('landing-start-button');
  }

  get timezoneTrigger(): Locator {
    return this.page.getByTestId('timezone-selector-trigger');
  }

  get dateInput(): Locator {
    return this.page.getByTestId('landing-date-picker');
  }

  get durationHours(): Locator {
    return this.page.getByTestId('landing-duration-hours');
  }

  get durationMinutes(): Locator {
    return this.page.getByTestId('landing-duration-minutes');
  }

  get durationSeconds(): Locator {
    return this.page.getByTestId('landing-duration-seconds');
  }

  get durationPreview(): Locator {
    return this.page.getByTestId('landing-duration-preview');
  }

  get durationError(): Locator {
    return this.page.locator('#landing-duration-error');
  }

  get messageSection(): Locator {
    return this.page.getByTestId('landing-message-section');
  }

  async switchToTimerMode(): Promise<void> {
    await this.page.getByTestId('landing-mode-timer').check();
  }

  async switchToWallClockMode(): Promise<void> {
    await this.page.getByTestId('landing-mode-wall-clock').check();
  }

  async fillDurationMinutes(value: string): Promise<void> {
    await this.durationMinutes.fill(value);
  }

  async fillDurationHours(value: string): Promise<void> {
    await this.durationHours.fill(value);
  }

  async fillDurationSeconds(value: string): Promise<void> {
    await this.durationSeconds.fill(value);
  }

  async expectPreviewText(text: string | RegExp): Promise<void> {
    await expect(this.durationPreview).toContainText(text);
  }

  async startCountdown(): Promise<void> {
    await this.startButton.click();
  }
}
