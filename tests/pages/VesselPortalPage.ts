import { Page, Locator, expect } from '@playwright/test';

export class VesselPortalPage {
  readonly page: Page;
  readonly portalHeading: Locator;
  readonly noVesselCard: Locator;
  readonly noVesselHeading: Locator;
  readonly orderPartsButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.portalHeading = page.getByText('Boat Owner Vessel Portal');
    this.noVesselCard = page.getByTestId('no-vessel-registered-card');
    this.noVesselHeading = page.getByTestId('no-vessel-registered-heading');
    this.orderPartsButton = page.getByTestId('portal-order-parts-button');
  }

  async verifyPortalVisible(): Promise<void> {
    await expect(this.portalHeading).toBeVisible({ timeout: 10000 });
  }

  async verifyNoVesselRegisteredBanner(): Promise<void> {
    await this.verifyPortalVisible();
    await expect(this.noVesselCard).toBeVisible();
    await expect(this.noVesselHeading).toHaveText('No Vessel Registered Yet');
  }

  async clickOrderPartsFromWorkshop(): Promise<void> {
    await expect(this.orderPartsButton).toBeVisible();
    await this.orderPartsButton.scrollIntoViewIfNeeded();
    await this.orderPartsButton.click({ force: true });
  }
}
