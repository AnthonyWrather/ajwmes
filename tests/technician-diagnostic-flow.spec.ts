import { test, expect } from '@playwright/test';
import { NavigationPage } from './pages/NavigationPage';
import { AuthModalPage } from './pages/AuthModalPage';
import { TechnicianWorkspacePage } from './pages/TechnicianWorkspacePage';

test.describe('Solent Marine Field Technician Diagnostic & Sign-Off E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage for a clean test baseline
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  });

  test('should sign in as marine technician, manage pontoon diagnostic job, log labor & parts, and capture customer sign-off', async ({ page }) => {
    const nav = new NavigationPage(page);
    const auth = new AuthModalPage(page);
    const tech = new TechnicianWorkspacePage(page);

    // Mock network auth endpoints if intercepted at network layer
    await page.route('**/api/auth/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          token: 'mock-jwt-token-tech-2026',
          user: {
            id: 'usr-tech-0000-0000-0000-000000000002',
            email: 'jack.tech@ajwmes.co.uk',
            name: 'Jack Henderson',
            role: 'technician'
          }
        })
      });
    });

    await test.step('1. Navigate to landing page and sign in as Solent Marine Technician', async () => {
      await nav.navigateToLanding();
      await nav.openSignInModal();
      await auth.verifyModalVisible();
      await auth.signIn('jack.tech@ajwmes.co.uk', 'ajwmes2026');
    });

    await test.step('2. Verify direct redirect to Solent Field Technician Workstation', async () => {
      await tech.verifyWorkspaceVisible();
      await expect(page.getByText('Solent Field Technician Workstation')).toBeVisible();
      await expect(page.getByText('Field Technician Mode Active')).toBeVisible();
      await nav.expectUserProfile('Jack Henderson');
    });

    await test.step('3. Inspect assigned Solent marina job queue and filter tabs', async () => {
      await expect(tech.filterAllButton).toBeVisible();
      await expect(tech.filterActiveButton).toBeVisible();
      await expect(tech.filterScheduledButton).toBeVisible();

      // Click Active filter and verify active job card is visible
      await tech.filterActiveButton.click({ force: true });
      const jobCard = page.getByTestId('job-card-job-101');
      await expect(jobCard).toBeVisible();

      // Click All filter to restore full queue
      await tech.filterAllButton.click({ force: true });
      await expect(jobCard).toBeVisible();
    });

    await test.step('4. Select job-101 and verify vessel specifications panel', async () => {
      await tech.selectJob('job-101');
      await expect(tech.selectedJobDetails).toBeVisible();
      await expect(tech.selectedJobReference).toBeVisible();
      await expect(tech.selectedJobVessel).toBeVisible();
      await expect(tech.selectedJobBerth).toBeVisible();
    });

    await test.step('5. Update job progress status to In Progress', async () => {
      await tech.setJobStatus('in_progress');
      await expect(tech.statusInProgressButton).toHaveClass(/bg-amber-600/);
    });

    await test.step('6. Launch Diagnostic Stopwatch and log labor hours and additional materials', async () => {
      await tech.openStopwatch();
      await expect(tech.stopwatchDisplay).toBeVisible();

      // Start timer and then pause
      await tech.toggleStopwatch();
      await page.waitForTimeout(1100); // Allow at least 1 elapsed second
      await tech.toggleStopwatch();

      // Add hardware materials used from parts catalog
      await tech.addMaterialFromCatalog(2);
      await expect(tech.timerMaterialsList).toBeVisible();

      // Save job sheet
      await tech.saveJobSheet();
      await expect(tech.laborTotalDisplay).toBeVisible();
      await expect(tech.materialsTotalDisplay).toBeVisible();
    });

    await test.step('7. Open Customer Pontoon Sign-Off modal and inspect work sheet summary', async () => {
      await tech.openCustomerSignOff();
      await expect(page.getByTestId('signoff-summary-card')).toBeVisible();
      await expect(page.getByText('Flat Rate £25.00/hr')).toBeVisible();
      await expect(tech.signOffTotalAmount).toBeVisible();
    });

    await test.step('8. Complete digital customer sign-off with touch canvas signature', async () => {
      await tech.fillSignOffForm({
        name: 'David Mercer',
        role: 'vessel_owner',
        feedback: 'Lithium battery bank upgrade verified running cleanly aboard vessel.'
      });

      // Draw handwritten signature on HTML5 canvas
      await tech.drawHandwrittenSignature();

      // Submit sign-off
      await tech.submitSignOff();
    });

    await test.step('9. Verify Customer Pontoon Sign-Off receipt card appears on workstation', async () => {
      await tech.verifySignOffCard({ signerName: 'David Mercer' });
      await expect(page.getByText('Pontoon Sign-Off Captured')).toBeVisible();
      await expect(page.getByText(/Lithium battery bank upgrade verified/i)).toBeVisible();
    });

    await test.step('10. Mark diagnostic job as Completed', async () => {
      await tech.setJobStatus('completed');
      await expect(tech.statusCompletedButton).toHaveClass(/bg-emerald-600/);
    });
  });
});
