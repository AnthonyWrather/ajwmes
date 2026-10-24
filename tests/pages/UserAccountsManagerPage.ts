import { Page, Locator, expect } from '@playwright/test';

export interface NewUserPayload {
  name: string;
  email: string;
  phone?: string;
  role: 'client' | 'technician' | 'postal' | 'admin' | 'guest' | 'site';
  vesselName?: string;
  vesselType?: string;
  marinaBerth?: string;
  systemVoltage?: '12V' | '24V';
}

export class UserAccountsManagerPage {
  readonly page: Page;

  // Root & Header Locators
  readonly managerContainer: Locator;
  readonly searchInput: Locator;
  readonly btnOpenAddUserModal: Locator;
  readonly emptyState: Locator;
  readonly userCards: Locator;
  readonly toast: Locator;

  // Stat Counters
  readonly statClients: Locator;
  readonly statTechnicians: Locator;
  readonly statDispatchers: Locator;
  readonly statAdmin: Locator;
  readonly statSite: Locator;

  // Add User Modal
  readonly addUserModal: Locator;
  readonly inputNewName: Locator;
  readonly inputNewEmail: Locator;
  readonly inputNewPhone: Locator;
  readonly selectNewRole: Locator;
  readonly inputNewVesselName: Locator;
  readonly inputNewVesselType: Locator;
  readonly inputNewMarinaBerth: Locator;
  readonly selectNewSystemVoltage: Locator;
  readonly btnSubmitNewUser: Locator;

  // Edit User Modal
  readonly editUserModal: Locator;
  readonly inputEditName: Locator;
  readonly inputEditEmail: Locator;
  readonly inputEditPhone: Locator;
  readonly selectEditRole: Locator;
  readonly inputEditVesselName: Locator;
  readonly inputEditVesselType: Locator;
  readonly inputEditMarinaBerth: Locator;
  readonly btnSubmitEditUser: Locator;

  constructor(page: Page) {
    this.page = page;

    // Root elements
    this.managerContainer = page.getByTestId('user-accounts-manager');
    this.searchInput = page.getByTestId('user-accounts-search-input');
    this.btnOpenAddUserModal = page.getByTestId('open-add-user-modal-button');
    this.emptyState = page.getByTestId('user-accounts-empty-state');
    this.userCards = page.getByTestId('user-account-card');
    this.toast = page.getByTestId('accounts-toast');

    // Stat counters
    this.statClients = page.getByTestId('stat-count-clients');
    this.statTechnicians = page.getByTestId('stat-count-technicians');
    this.statDispatchers = page.getByTestId('stat-count-dispatchers');
    this.statAdmin = page.getByTestId('stat-count-admin');
    this.statSite = page.getByTestId('stat-count-site');

    // Add User Modal
    this.addUserModal = page.getByTestId('add-user-modal');
    this.inputNewName = page.getByTestId('new-user-name-input');
    this.inputNewEmail = page.getByTestId('new-user-email-input');
    this.inputNewPhone = page.getByTestId('new-user-phone-input');
    this.selectNewRole = page.getByTestId('new-user-role-select');
    this.inputNewVesselName = page.getByTestId('new-user-vessel-name-input');
    this.inputNewVesselType = page.getByTestId('new-user-vessel-type-input');
    this.inputNewMarinaBerth = page.getByTestId('new-user-marina-berth-input');
    this.selectNewSystemVoltage = page.getByTestId('new-user-system-voltage-select');
    this.btnSubmitNewUser = page.getByTestId('create-user-submit-button');

    // Edit User Modal
    this.editUserModal = page.getByTestId('edit-user-modal');
    this.inputEditName = page.getByTestId('edit-user-name-input');
    this.inputEditEmail = page.getByTestId('edit-user-email-input');
    this.inputEditPhone = page.getByTestId('edit-user-phone-input');
    this.selectEditRole = page.getByTestId('edit-user-role-select');
    this.inputEditVesselName = page.getByTestId('edit-user-vessel-name-input');
    this.inputEditVesselType = page.getByTestId('edit-user-vessel-type-input');
    this.inputEditMarinaBerth = page.getByTestId('edit-user-marina-berth-input');
    this.btnSubmitEditUser = page.getByTestId('edit-user-submit-button');
  }

  async verifyManagerVisible(): Promise<void> {
    await expect(this.managerContainer).toBeVisible({ timeout: 10000 });
  }

  async filterByRole(role: string): Promise<void> {
    const pill = this.page.getByTestId(`user-role-filter-${role.toLowerCase()}`);
    await expect(pill).toBeVisible();
    await pill.click();
  }

  async searchAccounts(query: string): Promise<void> {
    await expect(this.searchInput).toBeVisible();
    await this.searchInput.fill(query);
  }

  async clearSearch(): Promise<void> {
    await this.searchInput.fill('');
  }

  async openAddUserModal(): Promise<void> {
    await expect(this.btnOpenAddUserModal).toBeVisible();
    await this.btnOpenAddUserModal.click();
    await expect(this.addUserModal).toBeVisible();
  }

  async fillAndSubmitNewUser(data: NewUserPayload): Promise<void> {
    await expect(this.inputNewName).toBeVisible();
    await this.inputNewName.fill(data.name);
    await this.inputNewEmail.fill(data.email);

    if (data.phone) {
      await this.inputNewPhone.fill(data.phone);
    }
    if (data.role) {
      await this.selectNewRole.selectOption(data.role);
    }
    if (data.vesselName) {
      await this.inputNewVesselName.fill(data.vesselName);
    }
    if (data.vesselType) {
      await this.inputNewVesselType.fill(data.vesselType);
    }
    if (data.marinaBerth) {
      await this.inputNewMarinaBerth.fill(data.marinaBerth);
    }
    if (data.systemVoltage) {
      await this.selectNewSystemVoltage.selectOption(data.systemVoltage);
    }

    await this.btnSubmitNewUser.scrollIntoViewIfNeeded();
    await this.btnSubmitNewUser.click();
    await expect(this.addUserModal).toBeHidden({ timeout: 10000 });
  }

  getUserCard(emailOrName: string): Locator {
    return this.userCards.filter({ hasText: emailOrName }).first();
  }

  async elevateUserRole(emailOrName: string, targetRole: string): Promise<void> {
    const card = this.getUserCard(emailOrName);
    await expect(card).toBeVisible();
    const roleSelect = card.getByTestId('user-role-select');
    await expect(roleSelect).toBeVisible();
    await roleSelect.scrollIntoViewIfNeeded();
    await roleSelect.selectOption(targetRole);
  }

  async openEditUserModal(emailOrName: string): Promise<void> {
    const card = this.getUserCard(emailOrName);
    await expect(card).toBeVisible();
    const editBtn = card.getByTestId('edit-user-button');
    await expect(editBtn).toBeVisible();
    await editBtn.scrollIntoViewIfNeeded();
    await editBtn.click();
    await expect(this.editUserModal).toBeVisible();
  }

  async fillAndSubmitEditUser(data: Partial<NewUserPayload>): Promise<void> {
    if (data.name) {
      await this.inputEditName.fill(data.name);
    }
    if (data.email) {
      await this.inputEditEmail.fill(data.email);
    }
    if (data.phone) {
      await this.inputEditPhone.fill(data.phone);
    }
    if (data.role) {
      await this.selectEditRole.selectOption(data.role);
    }
    if (data.vesselName) {
      await this.inputEditVesselName.fill(data.vesselName);
    }
    if (data.vesselType) {
      await this.inputEditVesselType.fill(data.vesselType);
    }
    if (data.marinaBerth) {
      await this.inputEditMarinaBerth.fill(data.marinaBerth);
    }

    await this.btnSubmitEditUser.scrollIntoViewIfNeeded();
    await this.btnSubmitEditUser.click({ force: true });
    await expect(this.editUserModal).toBeHidden({ timeout: 10000 });
  }

  async deleteUser(emailOrName: string): Promise<void> {
    const card = this.getUserCard(emailOrName);
    await expect(card).toBeVisible();
    const deleteBtn = card.getByTestId('delete-user-button');
    await expect(deleteBtn).toBeVisible();

    // Auto-confirm window.confirm dialog before triggering click
    this.page.once('dialog', (dialog) => {
      dialog.accept().catch(() => {});
    });
    await deleteBtn.scrollIntoViewIfNeeded();
    await deleteBtn.click({ force: true });
  }
}
