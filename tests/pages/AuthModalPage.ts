import { Page, Locator, expect } from '@playwright/test';

export interface RegisterUserData {
  name: string;
  email: string;
  password: string;
  phone: string;
}

export class AuthModalPage {
  readonly page: Page;
  readonly authModal: Locator;
  readonly signInHeading: Locator;
  readonly signInEmailInput: Locator;
  readonly signInPasswordInput: Locator;
  readonly signInSubmitButton: Locator;

  readonly registerTab: Locator;
  readonly registerHeading: Locator;
  readonly regNameInput: Locator;
  readonly regEmailInput: Locator;
  readonly regPasswordInput: Locator;
  readonly regConfirmPasswordInput: Locator;
  readonly regPhoneInput: Locator;
  readonly regSubmitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.authModal = page.getByTestId('auth-modal');
    this.signInHeading = page.getByTestId('signin-modal-heading');
    this.signInEmailInput = page.getByTestId('auth-email-input');
    this.signInPasswordInput = page.getByTestId('auth-password-input');
    this.signInSubmitButton = page.getByTestId('auth-submit-button');

    this.registerTab = page.getByTestId('tab-register');
    this.registerHeading = page.getByTestId('register-banner-heading');
    this.regNameInput = page.getByTestId('auth-reg-name-input');
    this.regEmailInput = page.getByTestId('auth-reg-email-input');
    this.regPasswordInput = page.getByTestId('auth-reg-password-input');
    this.regConfirmPasswordInput = page.getByTestId('auth-reg-confirm-password-input');
    this.regPhoneInput = page.getByTestId('auth-reg-phone-input');
    this.regSubmitButton = page.getByTestId('auth-register-submit-button');
  }

  async verifyModalVisible(): Promise<void> {
    await expect(this.authModal).toBeVisible();
  }

  async signIn(email: string, pass: string): Promise<void> {
    await expect(this.signInEmailInput).toBeVisible();
    await this.signInEmailInput.fill(email);
    await expect(this.signInPasswordInput).toBeVisible();
    await this.signInPasswordInput.fill(pass);
    await this.signInSubmitButton.scrollIntoViewIfNeeded();
    await this.signInSubmitButton.click({ force: true });
    await expect(this.authModal).not.toBeVisible({ timeout: 10000 });
  }

  async switchToRegisterTab(): Promise<void> {
    await expect(this.registerTab).toBeVisible();
    await this.registerTab.click();
    await expect(this.registerHeading).toBeVisible();
    await expect(this.registerHeading).toHaveText('Create Your Account');
  }

  async verifyVesselFieldsAbsent(): Promise<void> {
    await expect(this.page.locator('input[placeholder="Westerly Discus 33"]')).toHaveCount(0);
    await expect(this.page.locator('input[placeholder="Haslar Marina, Berth E-14"]')).toHaveCount(0);
  }

  async registerNewBoatOwner(user: RegisterUserData): Promise<void> {
    await expect(this.regNameInput).toBeVisible();
    await this.regNameInput.fill(user.name);
    await this.regEmailInput.fill(user.email);
    await this.regPasswordInput.fill(user.password);
    await this.regConfirmPasswordInput.fill(user.password);
    await this.regPhoneInput.fill(user.phone);

    await this.regSubmitButton.scrollIntoViewIfNeeded();
    await this.regSubmitButton.click({ force: true });
  }
}
