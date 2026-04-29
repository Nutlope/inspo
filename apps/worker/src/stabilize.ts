/**
 * Wait for fonts, trigger lazy-load, settle animations.
 * Naive playwright.screenshot({fullPage:true}) misses all of this.
 */

import type { Page } from "playwright";

export async function stabilize(page: Page): Promise<void> {
  // Fonts
  await page
    .evaluate(`document.fonts && document.fonts.ready`)
    .catch(() => {});

  // Slow scroll to bottom — triggers IntersectionObserver + lazy <img>
  await page.evaluate(`(async () => {
    const distance = Math.round(window.innerHeight * 0.8);
    let pos = 0;
    while (pos < document.documentElement.scrollHeight - window.innerHeight) {
      window.scrollTo(0, pos);
      pos += distance;
      await new Promise((r) => setTimeout(r, 100));
    }
    window.scrollTo(0, document.documentElement.scrollHeight);
    await new Promise((r) => setTimeout(r, 300));
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 300));
  })()`);

  // Pause CSS animations / transitions for stable captures
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-play-state: paused !important;
        transition-duration: 0s !important;
        animation-duration: 0s !important;
      }
      html { scroll-behavior: auto !important; }
    `,
  });

  // Final settle
  await page.waitForTimeout(400);
}
