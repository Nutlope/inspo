/**
 * Banner / overlay dismissal heuristics.
 *
 * Order:
 *   1. Common consent-banner selectors (OneTrust, Cookiebot, Osano, etc.)
 *   2. Buttons with accessible names like "Accept all", "Reject all", "Got it"
 *   3. Newsletter / chat overlays (Intercom, Drift, Crisp, etc.)
 *
 * If anything still lingers, the caller can pass a Claude-suggested
 * selector via `extraSelectors` (cached per-domain by `tag.ts`).
 */

import type { Page } from "playwright";

const CONSENT_SELECTORS = [
  // OneTrust
  "#onetrust-accept-btn-handler",
  "button.optanon-allow-all",
  // Cookiebot
  "#CybotCookiebotDialogBodyLevelButtonAccept",
  "#CybotCookiebotDialogBodyButtonAccept",
  // Osano
  ".osano-cm-accept-all",
  ".osano-cm-button--type_accept",
  // Cookie Consent (Insites)
  ".cc-allow",
  ".cc-dismiss",
  // TrustArc
  "#truste-consent-button",
  // Quantcast
  ".qc-cmp2-summary-buttons button[mode='primary']",
  // Generic
  "button[id*='cookie' i][id*='accept' i]",
  "button[class*='cookie' i][class*='accept' i]",
  "button[id*='gdpr' i][id*='accept' i]",
  "[aria-label*='Accept' i][role='button']",
];

const OVERLAY_SELECTORS = [
  // Intercom
  ".intercom-launcher-frame",
  ".intercom-namespace",
  // Drift
  "iframe#drift-frame-chat",
  "#drift-widget-container",
  // Crisp
  ".crisp-client",
  // HubSpot chat
  "#hubspot-messages-iframe-container",
  // Zendesk web widget
  "iframe[title*='Web Widget' i]",
  // Generic newsletter modals
  "[id*='newsletter' i][class*='modal' i]",
  "[class*='newsletter' i][class*='popup' i]",
];

const ACCEPT_TEXT_RX = /^\s*(accept(?: all)?|i agree|got it|ok(?:ay)?|allow all|continue|allow cookies)\s*$/i;

export type DismissResult = {
  consentClicked: number;
  overlaysHidden: number;
  textButtonsClicked: number;
};

export async function dismissBanners(
  page: Page,
  extraSelectors: string[] = [],
): Promise<DismissResult> {
  const result: DismissResult = {
    consentClicked: 0,
    overlaysHidden: 0,
    textButtonsClicked: 0,
  };

  // 1. Click known consent buttons
  for (const sel of [...CONSENT_SELECTORS, ...extraSelectors]) {
    try {
      const el = await page.$(sel);
      if (el && (await el.isVisible())) {
        await el.click({ timeout: 1500 });
        result.consentClicked += 1;
        await page.waitForTimeout(200);
      }
    } catch {
      /* ignore — many selectors won't match */
    }
  }

  // 2. Click any visible button whose accessible name matches "Accept all" etc.
  try {
    const buttons = await page.$$("button, [role='button'], a");
    for (const b of buttons.slice(0, 80)) {
      try {
        const visible = await b.isVisible();
        if (!visible) continue;
        const text = ((await b.textContent()) ?? "").trim();
        if (text && ACCEPT_TEXT_RX.test(text)) {
          await b.click({ timeout: 1500 });
          result.textButtonsClicked += 1;
          await page.waitForTimeout(150);
          break; // one is enough
        }
      } catch {
        /* skip */
      }
    }
  } catch {
    /* skip */
  }

  // 3. Hide chat / newsletter overlays via display:none injection
  await page
    .addStyleTag({
      content: OVERLAY_SELECTORS.map(
        (s) => `${s} { display: none !important; visibility: hidden !important; }`,
      ).join("\n"),
    })
    .catch(() => {
      /* ignore */
    });
  result.overlaysHidden = OVERLAY_SELECTORS.length;

  return result;
}
