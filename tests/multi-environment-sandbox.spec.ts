import { test, expect } from '@playwright/test';
import { NavigationPage } from './pages/NavigationPage';
import { AuthModalPage } from './pages/AuthModalPage';
import { EnvironmentSettingsModalPage } from './pages/EnvironmentSettingsModalPage';
import { ExportedEnvironmentData } from '../src/lib/envStorage';

test.describe('UJ-19: Multi-Environment Sandbox Manager, JSON Dataset Portability & Seed Reset', () => {
  let nav: NavigationPage;
  let auth: AuthModalPage;
  let envModal: EnvironmentSettingsModalPage;

  test.beforeEach(async ({ page }) => {
    // Clean slate: clear all localStorage and sessionStorage keys
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });

    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});

    nav = new NavigationPage(page);
    auth = new AuthModalPage(page);
    envModal = new EnvironmentSettingsModalPage(page);

    await nav.navigateToLanding();
  });

  test('Scenario 1: Environment Detection, Version Pinning & Namespace Partitioning Audit', async ({ page }) => {
    // 1. Authenticate as Website Administrator (site persona)
    await nav.openSignInModal();
    await auth.verifyModalVisible();
    await auth.signIn('site@ajwmes.co.uk', 'ajwmes2026');
    await nav.expectUserProfile('Anthony Wrather — Website Admin');

    // 2. Open Multi-Environment & Release Manager via header badge
    const headerBadge = page.getByTestId('header-version-badge');
    await expect(headerBadge).toBeVisible();
    await expect(headerBadge).toBeEnabled();
    await headerBadge.click();

    await envModal.expectOpen();

    // 3. Verify Version Tag and Active Environment Badge in Dev Sandbox (localhost)
    await expect(envModal.versionTag).toBeVisible();
    await expect(envModal.envActiveBadge).toHaveText('aistudio-dev');

    // 4. Verify LocalStorage and Firestore Collection Scope
    await expect(envModal.storagePrefix).toHaveText('ajwmes_aistudio_dev');
    await expect(envModal.firestoreScope).toHaveText('ais_dev_');

    // 5. Test Environment Switcher Override: switch to github-preview
    await envModal.switchEnvironment('github-preview');
    await expect(envModal.actionSuccessNotice).toContainText('GitHub');
    await expect(envModal.envActiveBadge).toHaveText('github-preview');
    await expect(envModal.storagePrefix).toHaveText('ajwmes_github_pre');
    await expect(envModal.firestoreScope).toHaveText('gh_pre_');

    // 6. Switch to github-deployed (Production Live Partition)
    await envModal.switchEnvironment('github-deployed');
    await expect(envModal.actionSuccessNotice).toContainText('Production Live');
    await expect(envModal.envActiveBadge).toHaveText('github-deployed');
    await expect(envModal.storagePrefix).toHaveText('ajwmes_github_live');
    await expect(envModal.firestoreScope).toHaveText('root (production)');

    // 7. Reset to Auto-Detection and verify Dev Sandbox is restored
    await envModal.resetToAutoDetection();
    await expect(envModal.envActiveBadge).toHaveText('aistudio-dev');
    await expect(envModal.storagePrefix).toHaveText('ajwmes_aistudio_dev');
    await expect(envModal.firestoreScope).toHaveText('ais_dev_');

    // Close modal cleanly via Done button
    await envModal.clickDone();
  });

  test('Scenario 2: Deterministic Clean Test Data Seeding & State Reset', async ({ page }) => {
    // 1. Authenticate as Website Administrator
    await nav.openSignInModal();
    await auth.verifyModalVisible();
    await auth.signIn('site@ajwmes.co.uk', 'ajwmes2026');
    await nav.expectUserProfile('Anthony Wrather — Website Admin');
    await nav.expectUserProfile('Anthony Wrather — Website Admin');

    // 2. Mutate active partition in LocalStorage with altered/corrupted data
    await page.evaluate(() => {
      const devJobsKey = 'ajwmes_aistudio_dev_jobs';
      const existing = JSON.parse(window.localStorage.getItem(devJobsKey) || '[]');
      const mutatedJobs = [
        {
          id: 'TAMPERED-JOB-001',
          reference: 'AJW-TAMPERED-001',
          vesselName: 'Tampered Test Dinghy',
          vesselType: 'Tender',
          clientName: 'Malicious Injected Draft',
          contactPhone: '000 0000 0000',
          contactEmail: 'tampered@example.com',
          berthLocation: 'Dry Stack Rack 99',
          status: 'pending',
          urgency: 'low',
          description: 'This job should be completely erased on seed reset',
          materials: [],
          stopwatchElapsedSeconds: 0,
          quoteApproved: false,
          depositRequired: false,
          depositPaid: false,
          totalAmount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          systemType: 'diagnostics',
          batterySystem: '12V AGM',
          inverterSpec: 'None',
          photos: [],
          timeline: []
        },
        ...existing
      ];
      window.localStorage.setItem(devJobsKey, JSON.stringify(mutatedJobs));
    });

    // Verify tampered record is in storage
    const tamperedCheck = await page.evaluate(() => {
      const raw = window.localStorage.getItem('ajwmes_aistudio_dev_jobs');
      return raw && raw.includes('AJW-TAMPERED-001');
    });
    expect(tamperedCheck).toBeTruthy();

    // 3. Open Environment Settings Modal and go to Test Data tab
    await page.getByTestId('header-version-badge').click();
    await envModal.expectOpen();
    await envModal.switchTab('testdata');

    // 4. Trigger Seed Clean Test Data (with dialog auto-acceptance)
    await envModal.seedCleanTestData();
    await expect(envModal.actionSuccessNotice).toContainText('Clean test fixtures seeded');

    // 5. Verify local storage is deterministically restored to baseline fixtures
    const restoredJobs = await page.evaluate(() => {
      const raw = window.localStorage.getItem('ajwmes_aistudio_dev_jobs');
      return raw ? JSON.parse(raw) : [];
    });

    // The tampered job should be completely gone
    const hasTampered = restoredJobs.some((j: { reference?: string }) => j.reference === 'AJW-TAMPERED-001');
    expect(hasTampered).toBeFalsy();

    // Baseline Solent marine jobs should be present
    expect(restoredJobs.length).toBeGreaterThanOrEqual(1);
    const hasBaseline = restoredJobs.some((j: { vesselName?: string }) =>
      j.vesselName?.includes('Windbird') || j.vesselName?.includes('Solent') || j.vesselName?.includes('Osprey')
    );
    expect(hasBaseline).toBeTruthy();

    // Also test Reset Storage Cache button
    await envModal.resetStorageCache();
    await expect(envModal.actionSuccessNotice).toContainText('Clean test fixtures seeded');

    await envModal.close();
  });

  test('Scenario 3: Full Environment JSON Snapshot Export, Envelope Validation & Import', async ({ page }) => {
    // 1. Authenticate as Website Administrator
    await nav.openSignInModal();
    await auth.verifyModalVisible();
    await auth.signIn('site@ajwmes.co.uk', 'ajwmes2026');
    await nav.expectUserProfile('Anthony Wrather — Website Admin');

    // 2. Open Environment Settings Modal
    await page.getByTestId('header-version-badge').click();
    await envModal.expectOpen();

    // 3. Export Environment Data as JSON Download and validate schema envelope
    const exportedData: ExportedEnvironmentData = await envModal.downloadExportJson();

    expect(exportedData).toBeDefined();
    expect(exportedData.version).toBe('1.0.0');
    expect(exportedData.environment).toBe('aistudio-dev');
    expect(Array.isArray(exportedData.jobs)).toBeTruthy();
    expect(Array.isArray(exportedData.catalog)).toBeTruthy();
    expect(Array.isArray(exportedData.postalOrders)).toBeTruthy();
    expect(typeof exportedData.vesselSpec).toBe('object');

    // 4. Also verify Copy Dataset JSON button works
    await envModal.copyExportButton.click();
    await expect(envModal.copyExportButton).toContainText(/Copied/i);

    // 5. Inject a custom portable record into a focused portable JSON payload
    const customJobId = `UJ19-PORTABLE-${Date.now()}`;
    const customJobRef = 'AJW-JOB-UJ19-PORTABLE';
    const modifiedDataset: ExportedEnvironmentData = {
      version: exportedData.version,
      exportedAt: new Date().toISOString(),
      environment: exportedData.environment,
      jobs: [
        {
          id: customJobId,
          reference: customJobRef,
          vesselName: 'Solent Voyager UJ-19',
          vesselType: 'Catamaran',
          clientName: 'Port Hamble Marine Test',
          clientPhone: '023 9258 1122',
          clientEmail: 'voyager@hamble-test.co.uk',
          berthLocation: 'Port Hamble Pontoon C12',
          serviceCategory: 'lithium',
          status: 'quote_sent',
          hourlyRate: 25,
          diagnosticHours: 3,
          materialsUsed: [],
          notes: 'Custom portable JSON snapshot verification job',
          totalLabor: 75,
          totalMaterials: 0,
          totalEstimated: 75,
          depositPaid: false,
          depositAmount: 50,
          createdAt: new Date().toISOString(),
          messages: []
        }
      ],
      catalog: exportedData.catalog.slice(0, 5),
      postalOrders: exportedData.postalOrders.slice(0, 2),
      vesselSpec: exportedData.vesselSpec
    };

    // 6. Import modified dataset into active environment partition
    await envModal.importJsonData(modifiedDataset);
    await expect(envModal.importStatusSuccess).toBeVisible();
    await expect(envModal.actionSuccessNotice).toContainText('Test dataset successfully imported!');

    // 7. Verify the custom imported record exists in local storage
    const updatedJobs = await page.evaluate(() => {
      const raw = window.localStorage.getItem('ajwmes_aistudio_dev_jobs');
      return raw ? JSON.parse(raw) : [];
    });
    const importedJob = updatedJobs.find((j: { reference?: string }) => j.reference === customJobRef);
    expect(importedJob).toBeDefined();
    expect(importedJob?.vesselName).toBe('Solent Voyager UJ-19');

    // 8. Test Malformed JSON Validation Resilience
    await envModal.importJsonData('{ bad: json, trailing, }');
    await expect(envModal.importStatusInvalid).toBeVisible();

    await envModal.close();
  });

  test('Scenario 4: Free Hosting Guide Modal Verification, Navigation & CLI Snippets', async ({ page }) => {
    // 1. Authenticate as Website Administrator
    await nav.openSignInModal();
    await auth.verifyModalVisible();
    await auth.signIn('site@ajwmes.co.uk', 'ajwmes2026');
    await nav.expectUserProfile('Anthony Wrather — Website Admin');

    // 2. Open Environment Settings Modal and navigate to Architecture & Disconnect Guide
    await page.getByTestId('header-version-badge').click();
    await envModal.expectOpen();

    // 3. Jump to Free Hosting Guide via the CTA in the Guide tab
    await envModal.openFreeHostingGuideFromModal();
    await expect(envModal.freeHostingGuideModal).toBeVisible();

    // 4. Test Tab 1: Firebase CLI Deploy
    await envModal.hostingTabFirebase.click();
    await expect(envModal.copyCliCommandsButton).toBeVisible();
    await envModal.copyCliCommandsButton.click();
    await expect(envModal.copyCliCommandsButton).toContainText(/Copied/i);

    // 5. Test Tab 2: GitHub Auto-Deploy
    await envModal.hostingTabGitHub.click();
    await expect(envModal.copyGitHubStepsButton).toBeVisible();
    await envModal.copyGitHubStepsButton.click();
    await expect(envModal.copyGitHubStepsButton).toContainText(/Copied/i);

    // 6. Test Tab 3: Custom Domain
    await envModal.hostingTabCustomDomain.click();
    await expect(envModal.copyDomainStepsButton).toBeVisible();
    await envModal.copyDomainStepsButton.click();
    await expect(envModal.copyDomainStepsButton).toContainText(/Copied/i);

    // 7. Test Tab 4: Auth & API Key Troubleshooting
    await envModal.hostingTabAuth.click();
    await expect(envModal.copyAuthStepsButton).toBeVisible();
    await envModal.copyAuthStepsButton.click();
    await expect(envModal.copyAuthStepsButton).toContainText(/Copied/i);

    // 8. Close Free Hosting Guide via bottom button
    await envModal.hostingGuideCloseButton.scrollIntoViewIfNeeded();
    await envModal.hostingGuideCloseButton.click();
    await expect(envModal.freeHostingGuideModal).not.toBeVisible();

    // 9. Also verify Free Hosting Guide opens via footer button for site role
    const footerGuideBtn = page.getByTestId('footer-hosting-guide-button');
    await footerGuideBtn.scrollIntoViewIfNeeded();
    await expect(footerGuideBtn).toBeVisible();
    await footerGuideBtn.click();
    await expect(envModal.freeHostingGuideModal).toBeVisible();

    // Close via header 'X' button
    await envModal.closeHostingGuideButton.click();
    await expect(envModal.freeHostingGuideModal).not.toBeVisible();
  });
});
