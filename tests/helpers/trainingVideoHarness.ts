import { Page, Locator } from '@playwright/test';

/**
 * Training Video Production Harness
 * Provides virtual mouse cursor injection, animated lower-third HUD banners,
 * and humanized pacing for recording user manual training videos.
 */

export interface HUDStepOptions {
  stepNumber: number;
  totalSteps?: number;
  title: string;
  detail?: string;
  roleBadge?: string;
}

/**
 * Injects a high-visibility SVG virtual cursor with click ripple animations
 * into the browser DOM via page.addInitScript().
 */
export async function injectVirtualCursor(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // Avoid double injection
    if (document.getElementById('ajwmes-virtual-cursor')) return;

    // Create cursor DOM element
    const cursor = document.createElement('div');
    cursor.id = 'ajwmes-virtual-cursor';
    cursor.style.position = 'fixed';
    cursor.style.top = '0';
    cursor.style.left = '0';
    cursor.style.width = '24px';
    cursor.style.height = '24px';
    cursor.style.pointerEvents = 'none';
    cursor.style.zIndex = '999999';
    cursor.style.transform = 'translate(-2px, -2px)';
    cursor.style.transition = 'transform 0.08s ease-out';
    cursor.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 3L19 12L12 14L9 21L4 3Z" fill="#F59E0B" stroke="#0F172A" stroke-width="2" stroke-linejoin="round"/>
        <circle cx="4" cy="3" r="3" fill="#38BDF8" opacity="0.8"/>
      </svg>
    `;
    document.body.appendChild(cursor);

    // Track mouse position
    window.addEventListener('mousemove', (e) => {
      cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    }, { passive: true });

    // Click ripple effect
    window.addEventListener('mousedown', (e) => {
      const ripple = document.createElement('div');
      ripple.style.position = 'fixed';
      ripple.style.left = `${e.clientX - 16}px`;
      ripple.style.top = `${e.clientY - 16}px`;
      ripple.style.width = '32px';
      ripple.style.height = '32px';
      ripple.style.borderRadius = '50%';
      ripple.style.border = '2px solid #F59E0B';
      ripple.style.backgroundColor = 'rgba(245, 158, 11, 0.3)';
      ripple.style.pointerEvents = 'none';
      ripple.style.zIndex = '999998';
      ripple.style.animation = 'ajwRipple 0.5s ease-out forwards';
      document.body.appendChild(ripple);

      setTimeout(() => ripple.remove(), 550);
    }, { passive: true });

    // Inject CSS keyframes
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes ajwRipple {
        0% { transform: scale(0.6); opacity: 1; }
        100% { transform: scale(2.2); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  });
}

/**
 * Animated Lower-Third HUD Training Banner
 */
export const trainingHUD = {
  async show(page: Page, options: HUDStepOptions): Promise<void> {
    await page.evaluate((opts) => {
      let hud = document.getElementById('ajwmes-training-hud');
      if (!hud) {
        hud = document.createElement('div');
        hud.id = 'ajwmes-training-hud';
        hud.style.position = 'fixed';
        hud.style.bottom = '28px';
        hud.style.left = '50%';
        hud.style.transform = 'translateX(-50%)';
        hud.style.zIndex = '999990';
        hud.style.pointerEvents = 'none';
        hud.style.fontFamily = 'system-ui, -apple-system, sans-serif';
        document.body.appendChild(hud);
      }

      hud.innerHTML = `
        <div style="
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 18px;
          background: rgba(10, 25, 47, 0.94);
          border: 1px solid rgba(245, 158, 11, 0.6);
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.7), 0 0 15px rgba(245, 158, 11, 0.2);
          backdrop-filter: blur(12px);
          color: white;
          min-width: 380px;
          max-width: 720px;
          animation: slideUp 0.3s ease-out;
        ">
          <div style="
            background: #F59E0B;
            color: #0A192F;
            font-weight: 900;
            font-size: 11px;
            padding: 4px 8px;
            border-radius: 8px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            white-space: nowrap;
          ">
            Step ${opts.stepNumber}${opts.totalSteps ? ` / ${opts.totalSteps}` : ''}
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 13px; font-weight: 700; color: #FFFFFF; line-height: 1.2;">
              ${opts.title}
            </div>
            ${opts.detail ? `
              <div style="font-size: 11px; color: #94A3B8; margin-top: 2px;">
                ${opts.detail}
              </div>
            ` : ''}
          </div>
          ${opts.roleBadge ? `
            <div style="
              font-size: 10px;
              font-family: monospace;
              padding: 3px 8px;
              border-radius: 9999px;
              background: #1E293B;
              color: #38BDF8;
              border: 1px solid #334155;
            ">
              ${opts.roleBadge}
            </div>
          ` : ''}
        </div>
      `;
    }, options);
  },

  async hide(page: Page): Promise<void> {
    await page.evaluate(() => {
      const hud = document.getElementById('ajwmes-training-hud');
      if (hud) hud.remove();
    });
  }
};

/**
 * Pacing & Action Helpers for Human-Readable Recording
 */
export async function scenePause(page: Page, ms: number = 800): Promise<void> {
  await page.waitForTimeout(ms);
}

export async function smoothClick(locator: Locator, preDelayMs: number = 400, postDelayMs: number = 600): Promise<void> {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (box) {
    await locator.page().mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 8 });
  }
  if (preDelayMs > 0) await locator.page().waitForTimeout(preDelayMs);
  await locator.click();
  if (postDelayMs > 0) await locator.page().waitForTimeout(postDelayMs);
}

export async function humanType(locator: Locator, text: string, delayBetweenCharsMs: number = 60): Promise<void> {
  await smoothClick(locator, 200, 200);
  await locator.fill('');
  await locator.pressSequentially(text, { delay: delayBetweenCharsMs });
  await locator.page().waitForTimeout(300);
}
