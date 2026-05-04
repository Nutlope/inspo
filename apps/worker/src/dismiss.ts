/**
 * Banner / overlay dismissal — three layers, applied in order:
 *
 *  Layer 1 (network):  block known consent + chat-widget CDNs entirely
 *                       so their scripts never load.
 *  Layer 2 (cookies):  pre-seed common consent-cookie names BEFORE
 *                       navigation so banners that gate on existing
 *                       cookies skip rendering.
 *  Layer 3 (DOM):      after page loads, click known consent buttons,
 *                       click any "Accept all"-text button, then hide
 *                       chat / newsletter overlays via injected CSS.
 *  Layer 4 (phantom):  detect any leftover position:fixed element
 *                       covering >15% of the viewport and force-hide.
 *
 * Each layer is cheap; they compose. The phantom check is the last
 * line of defence — when a site uses a banner we don't have a
 * selector for, the geometry catches it.
 */

import type { BrowserContext, Page } from "playwright";

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

/** Accepts a button if its full text (trim + lowercase) CONTAINS one of these.
 *  IMPORTANT: only phrases that DISMISS the banner — never "preferences" /
 *  "settings" / "manage" (those open deeper modals that look worse than the
 *  original banner). */
const ACCEPT_TEXT_PHRASES = [
  "accept all",
  "accept cookies",
  "allow all",
  "allow cookies",
  "agree and continue",
  "i agree",
  "got it",
  "yes, i'm happy",
  "okay, got it",
  "okay, thanks",
];

/** Phrases that suggest a deeper-modal opener — explicitly skipped. */
const NON_DISMISS_PHRASES = [
  "preferences",
  "settings",
  "manage",
  "customize",
  "options",
  "more info",
  "learn more",
  "details",
];

const ACCEPT_TEXT_MATCH = (raw: string) => {
  const t = raw.trim().toLowerCase();
  if (t.length > 60) return false;
  if (NON_DISMISS_PHRASES.some((p) => t.includes(p))) return false;
  return ACCEPT_TEXT_PHRASES.some((p) => t.includes(p));
};

export type DismissResult = {
  consentClicked: number;
  overlaysHidden: number;
  textButtonsClicked: number;
  phantomsHidden?: number;
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

  // 2. Click any visible button whose text contains "Accept all" etc.
  try {
    const buttons = await page.$$("button, [role='button'], a, input[type='button'], input[type='submit']");
    let clicked = 0;
    for (const b of buttons.slice(0, 120)) {
      try {
        const visible = await b.isVisible();
        if (!visible) continue;
        const text = ((await b.textContent()) ?? "").trim();
        if (text && ACCEPT_TEXT_MATCH(text)) {
          await b.click({ timeout: 1500 });
          result.textButtonsClicked += 1;
          clicked += 1;
          // Generous wait — banners often animate out over 300-500ms,
          // and clicking "preferences" instead of "accept all" was a
          // real bug; we want time for the banner to actually leave
          // the DOM before phantom-detector runs.
          await page.waitForTimeout(600);
          break; // one click is enough
        }
      } catch {
        /* skip */
      }
    }
    void clicked;
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

  // 4. Phantom-overlay detector. Three passes:
  //    (a) Geometry: any fixed/sticky element covering >15% of viewport
  //        and not styled as a top nav (likely a banner / modal).
  //    (b) Content: any fixed/sticky element whose text mentions
  //        "cookie" / "consent" / "accept" / "privacy" — catches small
  //        bottom-right cookie cards that don't trip the area heuristic.
  //    (c) Walk-up: any visible button containing accept/allow phrasing,
  //        walk up the DOM until we find a position:fixed ancestor and
  //        hide that. Catches dialogs whose root container isn't itself
  //        position:fixed but rather positioned via a fixed wrapper.
  try {
    const hiddenCount = await page.evaluate(() => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const minArea = vw * vh * 0.15;
      const CONSENT_RX = /\b(cookie|consent|gdpr|privacy|accept all|reject all|allow all|deny|do not allow|opt[- ]out|tracking|preferences|essential)\b/i;

      const isFixedish = (el: HTMLElement) => {
        const cs = window.getComputedStyle(el);
        if (cs.display === "none" || cs.visibility === "hidden") return false;
        return cs.position === "fixed" || cs.position === "sticky";
      };

      const isLikelyTopNav = (r: DOMRect) =>
        r.top < 8 && r.height < 120;

      let hidden = 0;
      const candidates = Array.from(document.querySelectorAll("*")).slice(
        0,
        1500,
      );

      const seen = new WeakSet<HTMLElement>();
      const tryHide = (el: HTMLElement) => {
        if (seen.has(el)) return false;
        seen.add(el);
        if (isLikelyTopNav(el.getBoundingClientRect())) return false;
        el.style.setProperty("display", "none", "important");
        el.style.setProperty("visibility", "hidden", "important");
        return true;
      };

      // Pass A+B
      for (const el of candidates) {
        if (!(el instanceof HTMLElement)) continue;
        if (!isFixedish(el)) continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (isLikelyTopNav(r)) continue;

        const big = r.width * r.height >= minArea;
        const text = (el.textContent ?? "").trim().slice(0, 600);
        const looksLikeConsent =
          text.length > 8 && text.length < 600 && CONSENT_RX.test(text);

        if (big || looksLikeConsent) {
          if (tryHide(el)) {
            hidden += 1;
            if (hidden >= 6) break;
          }
        }
      }

      // Pass C — walk-up from accept-text buttons. The Figma cookie
      // dialog (and many others) sits inside a wrapper whose position
      // computes to "fixed" — but the dialog itself doesn't match the
      // fixedish check until we walk up.
      if (hidden < 6) {
        const ACCEPT_BUTTON_RX = /\b(accept all|allow all|allow cookies|accept cookies|do not allow|reject all|essential only|preferences)\b/i;
        const buttons = Array.from(
          document.querySelectorAll("button, [role='button'], a"),
        ).slice(0, 200);
        for (const b of buttons) {
          if (!(b instanceof HTMLElement)) continue;
          const txt = (b.textContent ?? "").trim();
          if (!txt || !ACCEPT_BUTTON_RX.test(txt)) continue;
          // Walk up looking for the first fixed/sticky ancestor.
          let node: HTMLElement | null = b;
          for (let depth = 0; node && depth < 12; depth += 1) {
            const cs = window.getComputedStyle(node);
            if (cs.position === "fixed" || cs.position === "sticky") {
              const r = node.getBoundingClientRect();
              if (r.width > 0 && r.height > 0 && !isLikelyTopNav(r)) {
                if (tryHide(node)) {
                  hidden += 1;
                  if (hidden >= 6) return hidden;
                }
              }
              break;
            }
            node = node.parentElement;
          }
        }
      }

      return hidden;
    });
    result.phantomsHidden = hiddenCount;
  } catch {
    /* ignore */
  }

  return result;
}

/* ─────────────── Layer 1: network blocks ─────────────── */

/**
 * Hostnames whose subresources we abort. Most consent-banner SDKs and
 * chat widgets fail open (banner never appears) when their JS doesn't
 * load. We block at the route level so it applies to every navigation
 * in the context.
 */
const BLOCKED_HOSTS = [
  "onetrust.com",
  "cookielaw.org",
  "cookiebot.com",
  "cookiehub.eu",
  "osano.com",
  "trustarc.com",
  "consentmanager.net",
  "iubenda.com",
  "termly.io",
  "intercom.io",
  "intercomcdn.com",
  "drift.com",
  "drift-clipboard.com",
  "crisp.chat",
  "tawk.to",
  "hotjar.com",
  "hubspot.com/conversations",
  "kustomerapp.com",
  "front.com",
];

export async function blockConsentNetworks(ctx: BrowserContext): Promise<void> {
  await ctx.route("**/*", (route) => {
    const url = route.request().url();
    for (const host of BLOCKED_HOSTS) {
      if (url.includes(host)) {
        route.abort().catch(() => {});
        return;
      }
    }
    route.continue().catch(() => {});
  });
}

/* ─────────────── Layer 2: pre-seed consent cookies ─────────────── */

/**
 * Drop a handful of common "user already accepted" cookies on the
 * destination host before we navigate. Many banners short-circuit
 * when these are present.
 */
const FUTURE_TS = String(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365);
const ISO_NOW = new Date().toISOString();

const CONSENT_COOKIE_TEMPLATE = [
  // CookieYes
  { name: "cookieyes-consent", value: "consentid:abc,consent:yes,action:yes" },
  // OneTrust
  { name: "OptanonAlertBoxClosed", value: ISO_NOW },
  { name: "OptanonConsent", value: `isGpcEnabled=0&datestamp=${ISO_NOW}` },
  // Cookiebot
  { name: "CookieConsent", value: "{stamp:'-',necessary:true,preferences:true,statistics:true,marketing:true,ver:1}" },
  // Generic
  { name: "cookie_consent_user_accepted", value: "true" },
  { name: "cookie-consent", value: "accepted" },
  { name: "gdpr_accepted", value: "true" },
  { name: "user_consent", value: "1" },
  { name: "_cmpRepromptHash", value: FUTURE_TS },
  // Osano
  { name: "osano_consentmanager", value: "ANALYTICS=ACCEPT;ESSENTIAL=ACCEPT;MARKETING=ACCEPT;PERSONALIZATION=ACCEPT;OPT_OUT=ACCEPT" },
];

export async function preSeedConsentCookies(
  ctx: BrowserContext,
  url: string,
): Promise<void> {
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    return;
  }
  // Bare host + leading-dot (matches subdomains).
  const domains = [host, host.startsWith("www.") ? host.slice(4) : `.${host}`];
  const cookies = CONSENT_COOKIE_TEMPLATE.flatMap((c) =>
    domains.map((d) => ({
      name: c.name,
      value: c.value,
      domain: d.startsWith(".") ? d : `.${d}`,
      path: "/",
      expires: Date.now() / 1000 + 60 * 60 * 24 * 365,
    })),
  );
  await ctx.addCookies(cookies).catch(() => {
    /* some hosts reject leading-dot; ignore */
  });
}
