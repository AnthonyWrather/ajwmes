import { test, expect } from '@playwright/test';
import { 
  injectVirtualCursor, 
  trainingHUD, 
  smoothClick, 
  humanType, 
  scenePause 
} from '../helpers/trainingVideoHarness';
import { NavigationPage } from '../pages/NavigationPage';
import { SwitchPanelCADPage } from '../pages/SwitchPanelCADPage';
import { HelpCenterModalPage } from '../pages/HelpCenterModalPage';

test.describe('Role Manual Video Recordings (1080p Training Vignettes)', () => {
  test('Training Vignette 1: Guest — Switch Panel CAD Configurator', async ({ page }) => {
    await injectVirtualCursor(page);
    const nav = new NavigationPage(page);
    const cad = new SwitchPanelCADPage(page);

    // Step 1: Open CAD Designer
    await page.goto('/');
    await trainingHUD.show(page, {
      stepNumber: 1,
      totalSteps: 4,
      title: 'Open Switch Panel CAD Designer',
      detail: 'Navigate from top navigation to the vector layout workbench',
      roleBadge: 'GUEST / PUBLIC'
    });
    await scenePause(page, 1000);
    await smoothClick(nav.desktopDesignerTab);
    await expect(cad.designerContainer).toBeVisible({ timeout: 10000 });

    // Step 2: Configure Dimensions
    await trainingHUD.show(page, {
      stepNumber: 2,
      totalSteps: 4,
      title: 'Configure Marine Acrylic Dimensions',
      detail: 'Set custom width and height for flush helm mounting',
      roleBadge: 'GUEST / PUBLIC'
    });
    await scenePause(page, 800);
    if (await cad.tabLayout.isVisible()) {
      await smoothClick(cad.tabLayout);
    }
    await humanType(cad.inputWidth, '260');
    await scenePause(page, 600);

    // Step 3: Add Digital Voltmeters & Rocker Switches
    await trainingHUD.show(page, {
      stepNumber: 3,
      totalSteps: 4,
      title: 'Select Component Accessories & Voltmeters',
      detail: 'Add IP67 waterproof rocker switches and battery monitor gauges',
      roleBadge: 'GUEST / PUBLIC'
    });
    await scenePause(page, 800);
    if (await cad.tabOptions.isVisible()) {
      await smoothClick(cad.tabOptions);
      if (await cad.toggleVoltmeter.isVisible()) {
        await smoothClick(cad.toggleVoltmeter);
      }
    }
    await scenePause(page, 1200);

    // Step 4: Review Live Pricing & Instant Surcharges
    await trainingHUD.show(page, {
      stepNumber: 4,
      totalSteps: 4,
      title: 'Instant Laser Cutting Cost & Quotation',
      detail: 'Review calculated acrylic and component bill of materials',
      roleBadge: 'GUEST / PUBLIC'
    });
    await scenePause(page, 2000);
  });

  test('Training Vignette 2: Role Manual & Help Center Navigation', async ({ page }) => {
    await injectVirtualCursor(page);
    const nav = new NavigationPage(page);
    const help = new HelpCenterModalPage(page);

    await page.goto('/');

    // Step 1: Open Help Center
    await trainingHUD.show(page, {
      stepNumber: 1,
      totalSteps: 3,
      title: 'Launch Interactive Help Center',
      detail: 'Click the Help & Guides icon in the top navigation bar',
      roleBadge: 'ALL ROLES'
    });
    await scenePause(page, 800);
    await smoothClick(nav.helpButton);
    await help.expectOpen();

    // Step 2: Switch to Technician Manual
    await trainingHUD.show(page, {
      stepNumber: 2,
      totalSteps: 3,
      title: 'Switch Role Documentation & Procedures',
      detail: 'Select Pontoon Technician to review £25/hr stopwatch guidelines',
      roleBadge: 'TECHNICIAN'
    });
    await scenePause(page, 1000);
    await help.selectRole('technician');
    await scenePause(page, 1200);

    // Step 3: Jump to Workspace
    await trainingHUD.show(page, {
      stepNumber: 3,
      totalSteps: 3,
      title: 'Direct Deep Jump into Application Workspaces',
      detail: 'Click "Open Workspace" to jump straight into field tools',
      roleBadge: 'NAVIGATION'
    });
    await scenePause(page, 1500);
  });
});
