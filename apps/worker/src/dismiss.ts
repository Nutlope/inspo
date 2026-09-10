/**
 * Banner / overlay dismissal, four layers applied in order:
 *
 *  Layer 1 (network):  block known consent + chat-widget CDNs entirely
 *                       so their scripts never load.
 *  Layer 2 (cookies):  pre-seed common consent-cookie names BEFORE
 *                       navigation so banners that gate on existing
 *                       cookies skip rendering.
 *  Layer 3 (DOM):      after page loads, answer consent notices (declining
 *                       non-essential cookies where offered), get past
 *                       intro gates, dismiss newsletter / promo modals,
 *                       then hide chat widgets via injected CSS.
 *  Layer 4 (phantom):  detect any leftover popup, consent card, floating
 *                       toast or chat bubble and force-hide it.
 *
 * Each layer is cheap; they compose. The phantom check is the last line
 * of defence: when a site uses a banner we have no selector for, geometry
 * plus what the element says catches it. It only touches layers that are
 * fixed (or live inside a fixed layer) and read like a popup, because
 * design-led sites paint their heroes with fixed canvases, videos and
 * gradient layers and pin whole sections with position:sticky. Hiding
 * those blanks the very page being captured.
 */

import type { BrowserContext, Page } from "playwright";

const CONSENT_SELECTORS = [
  // Decline non-essential first where the CMP offers it.
  "#onetrust-reject-all-handler",
  "#CybotCookiebotDialogBodyButtonDecline",
  ".osano-cm-denyAll",
  "#didomi-notice-disagree-button",
  "button[data-testid='uc-deny-all-button']",
  ".cky-btn-reject",
  // Accept, for notices that offer nothing else.
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
  // Generic newsletter / promo modals
  "[id*='newsletter' i][class*='modal' i]",
  "[class*='newsletter' i][class*='popup' i]",
  "[id*='subscribe' i][class*='modal' i]",
  "[class*='promo' i][class*='modal' i]",
  "[class*='promo' i][class*='popup' i]",
  // Klaviyo
  "[class*='klaviyo' i][class*='form' i]",
  ".needsclick.kl-private-reset-css-Xuajs1",
  // Privy
  "#privy-modal",
  ".privy-style-overlay",
  // OptinMonster
  ".om-element",
  ".om-iframe-wrapper",
  // Sumo / Wisepops
  ".sumome-react-wysiwyg-modal",
  ".wisepops-popup",
  // Mailchimp embedded modal
  "#mc_embed_signup",
  // Generic role-based dialogs (centered modals)
  "[role='dialog'][aria-modal='true']",
  "[role='alertdialog']",
];

/** Newsletter / promo / region modal dismissals, intro gates, plus a
 *  fallback for consent notices the consent pass could not place. A
 *  button qualifies if its full text (trim + lowercase) CONTAINS one of
 *  these. Never "preferences" / "settings" / "manage": those open deeper
 *  modals that look worse than the original banner. */
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
  "no thanks",
  "no, thanks",
  "not now",
  "maybe later",
  "dismiss",
  "skip",
  "close",
  "continue shopping",
  "continue browsing",
  "x close",
  // Intro gates (an Acknowledgement of Country splash, a "click to enter")
  "continue to website",
  "continue to the website",
  "continue to site",
  "enter site",
  "enter website",
  "enter the site",
  "skip intro",
];

/** Phrases that suggest a deeper-modal opener, explicitly skipped. */
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

/**
 * Finds the one button that answers a consent notice and marks it with
 * data-inspo-consent. Only buttons inside a container that is about
 * cookies or consent count, so a stray "Decline" or "OK" elsewhere on
 * the page is never touched. Preference: decline non-essential, then the
 * notice's own accept / "Okay", then its close control. Kept as a string
 * because tsx's __name helper does not exist inside the page.
 */
const MARK_CONSENT_BUTTON = `(() => {
  const NOTICE = /(cookie|consent|gdpr|ccpa|datenschutz|einwilligung|consentement|consentimiento|consenso|toestemming)/i;
  const REJECT = /^(reject( all)?( cookies)?|decline( all)?( cookies)?|deny( all)?|refuse( all)?|(use )?(only )?(strictly )?(necessary|essential)( cookies)?( only)?|only (necessary|essential)( cookies)?|alle ablehnen|ablehnen|nur (notwendige|erforderliche|essenzielle)( cookies)?|tout refuser|refuser|continuer sans accepter|rechazar( todo| todas)?|rifiuta( tutti)?|alles weigeren|weigeren|recusar( todos)?|avvisa( alla)?|afvis( alle)?)$/i;
  const ACCEPT = /^(ok|okay|ok!|accept( all)?( cookies)?|allow( all)?( cookies)?|agree|i agree|got it|understood|i understand|alle akzeptieren|alles akzeptieren|akzeptieren|zustimmen|einverstanden|alle zulassen|tout accepter|accepter|j'accepte|aceptar( todo| todas)?|accetta( tutti)?|accetto|alles accepteren|accepteren|aceitar( todos)?|godkänn( alla)?|acceptera|accepter alle|tillad alle)$/i;
  const CLOSE = /^(x|×|✕|close|dismiss|schließen|fermer|cerrar|chiudi|sluiten)$/i;
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none";
  };
  const inNotice = (el) => {
    let n = el.parentElement;
    for (let i = 0; n && i < 8; i += 1, n = n.parentElement) {
      const t = (n.innerText || "").trim();
      if (t.length > 3000) return false;
      if (t.length > 20 && NOTICE.test(t)) return true;
    }
    return false;
  };
  const label = (el) => (el.innerText || el.getAttribute("aria-label") || el.value || "").trim().replace(/\\s+/g, " ").toLowerCase();
  const stays = (el) => {
    if (el.tagName !== "A") return true;
    const h = el.getAttribute("href") || "";
    return h === "" || h.startsWith("#") || h.startsWith("javascript:");
  };
  const buttons = [...document.querySelectorAll("button, [role='button'], a, input[type='button'], input[type='submit']")]
    .filter(visible)
    .filter(stays)
    .filter(inNotice);
  const pick =
    buttons.find((b) => REJECT.test(label(b))) ||
    buttons.find((b) => ACCEPT.test(label(b))) ||
    buttons.find((b) => CLOSE.test(label(b)));
  if (!pick) return false;
  pick.setAttribute("data-inspo-consent", "1");
  return true;
})()`;

/**
 * Small floating things the popup passes are too coarse for: a toast or
 * card pinned over the page with its own close control ("This page is
 * also available in English", a "Featured case" promo), and chat or
 * WhatsApp bubbles in a bottom corner. A fixed element that small, with a
 * close control and little text, is a dismissible notice; page content
 * is neither fixed nor closable. A full-width bar at the very top is left
 * alone: that is navigation or an announcement strip, part of the design.
 */
const HIDE_FLOATERS = `(() => {
  const vw = innerWidth;
  const vh = innerHeight;
  const NOTICE = /(also available in|available in english|switch to|view (this )?(page|site) in|change (the )?language|(choose|select) (a |your )?(language|region|country|location)|newsletter|subscribe|sign up|join (our|the)|discount|promo|download (the|our) app|get the app|open in app|featured|limited time|cookie|consent)/i;
  const CLOSE_TEXT = /^(x|×|✕|✖|close|dismiss|schließen|fermer|cerrar|chiudi|sluiten)$/i;
  const classOf = (el) => {
    const c = el.className;
    return (c && typeof c === "object" && "baseVal" in c ? c.baseVal : c || "") + "";
  };
  const isClose = (el) => {
    const t = (el.innerText || el.value || "").trim();
    const meta = ((el.getAttribute("aria-label") || "") + " " + (el.getAttribute("title") || "") + " " + classOf(el)).toLowerCase();
    return CLOSE_TEXT.test(t) || /\\b(close|dismiss)\\b/.test(meta);
  };
  const fixedWithin = (el, levels) => {
    let n = el;
    for (let i = 0; n && i <= levels; i += 1, n = n.parentElement) {
      if (getComputedStyle(n).position === "fixed") return true;
    }
    return false;
  };
  const all = [...document.querySelectorAll("body *")].slice(0, 4000);
  let hidden = 0;

  const toasts = [];
  for (const el of all) {
    if (!(el instanceof HTMLElement)) continue;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    const r = el.getBoundingClientRect();
    if (r.width < 120 || r.height < 36) continue;
    if (r.width * r.height > vw * vh * 0.2) continue;
    if (r.top < 8 && r.height < 120 && r.width > vw * 0.8) continue;
    const t = (el.innerText || "").trim();
    if (t.length < 8 || t.length > 500) continue;
    if (t.length > 200 && !NOTICE.test(t)) continue;
    if (!fixedWithin(el, 3)) continue;
    const controls = [...el.querySelectorAll("button, [role='button'], a, span, div, svg")].slice(0, 40);
    if (!controls.some(isClose)) continue;
    toasts.push(el);
  }
  for (const el of toasts.filter((el) => !toasts.some((o) => o !== el && o.contains(el)))) {
    el.style.setProperty("display", "none", "important");
    hidden += 1;
  }

  const CHAT = /(wa\\.me|api\\.whatsapp|whatsapp|m\\.me\\/|t\\.me\\/|messenger|livechat|chat-widget|chatbot|tidio|tawk|freshchat|gorgias|chaport|jivo)/;
  for (const el of all) {
    if (!(el instanceof HTMLElement)) continue;
    const cs = getComputedStyle(el);
    if (cs.position !== "fixed" || cs.display === "none") continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.width > 320 || r.height > 320) continue;
    const corner = vh - r.bottom < 140 && (r.left < 140 || vw - r.right < 140);
    if (!corner) continue;
    if (CHAT.test((el.outerHTML || "").slice(0, 3000).toLowerCase())) {
      el.style.setProperty("display", "none", "important");
      hidden += 1;
    }
  }
  return hidden;
})()`;

export type DismissResult = {
  consentClicked: number;
  overlaysHidden: number;
  textButtonsClicked: number;
  phantomsHidden?: number;
};

export type DismissOptions = {
  /** false = only the CSS and geometry passes, no clicks. Used for the
   *  sweep right before each viewport's screenshots: a second round of
   *  clicking could follow a link away from the page being captured. */
  clicks?: boolean;
};

export async function dismissBanners(
  page: Page,
  extraSelectors: string[] = [],
  opts: DismissOptions = {},
): Promise<DismissResult> {
  const result: DismissResult = {
    consentClicked: 0,
    overlaysHidden: 0,
    textButtonsClicked: 0,
  };
  const clicks = opts.clicks !== false;

  // 1. Click known consent-manager buttons
  for (const sel of clicks ? [...CONSENT_SELECTORS, ...extraSelectors] : []) {
    try {
      const el = await page.$(sel);
      if (el && (await el.isVisible())) {
        await el.click({ timeout: 1500 });
        result.consentClicked += 1;
        await page.waitForTimeout(200);
      }
    } catch {
      /* ignore: many selectors won't match */
    }
  }

  // 2. Answer any consent notice by its own buttons, twice at most (some
  //    notices open a second layer after the first answer).
  for (let round = 0; clicks && round < 2; round += 1) {
    try {
      const marked = (await page.evaluate(MARK_CONSENT_BUTTON)) as boolean;
      if (!marked) break;
      await page.click("[data-inspo-consent='1']", { timeout: 1500 });
      result.consentClicked += 1;
      await page.waitForTimeout(600);
      await page
        .evaluate(`document.querySelectorAll("[data-inspo-consent]").forEach((e) => e.removeAttribute("data-inspo-consent"))`)
        .catch(() => {});
    } catch {
      break;
    }
  }

  // 3. Intro gates, newsletter / promo / region modals: click a
  //    dismiss-type button.
  if (clicks) {
    try {
      const buttons = await page.$$("button, [role='button'], a, input[type='button'], input[type='submit']");
      for (const b of buttons.slice(0, 120)) {
        try {
          const visible = await b.isVisible();
          if (!visible) continue;
          const text = ((await b.textContent()) ?? "").trim();
          if (!text || !ACCEPT_TEXT_MATCH(text)) continue;
          // A link that goes somewhere ("Close" in a menu, "Skip" to
          // another page) would navigate away from the page being shot.
          const leaves = await b.evaluate((el) => {
            if (el.tagName !== "A") return false;
            const href = el.getAttribute("href") ?? "";
            return href !== "" && !href.startsWith("#") && !href.startsWith("javascript:");
          });
          if (leaves) continue;
          await b.click({ timeout: 1500 });
          result.textButtonsClicked += 1;
          // Generous wait: banners often animate out over 300-500ms, and
          // the phantom detector should run after the banner has
          // actually left the DOM.
          await page.waitForTimeout(600);
          break; // one click is enough
        } catch {
          /* skip */
        }
      }
    } catch {
      /* skip */
    }
  }

  // 4. Hide chat / newsletter overlays via display:none injection
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

  // 5. Phantom-overlay detector. Passes, in order:
  //    (a) Geometry: a fixed element covering >15% of the viewport that
  //        reads like a popup (dialog role, email or password field, a
  //        close control, or popup vocabulary) and sits above the page.
  //    (b) Consent: the outermost element that holds a cookie / consent
  //        notice and its buttons, when it is fixed or inside a fixed
  //        layer. Framer's banner lives in a full-screen, click-through
  //        fixed wrapper, so the card itself is what gets hidden.
  //    (c) Walk-up: from a visible accept/allow button to its fixed
  //        ancestor, for dialogs positioned by a fixed wrapper.
  //    (d) Dialog roles, plus popup class names when fixed and popup-like.
  //    (e) Backdrops: a fixed, semi-transparent layer over most of the
  //        viewport, plus the dialog inside it.
  //    (f) Body scroll locks left behind by a modal.
  //    (g) Consent strips pinned to an edge, whatever their size.
  try {
    const hiddenCount = await page.evaluate(() => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const minArea = vw * vh * 0.15;
      // Phrases a consent notice uses, in the languages the archive's sites ship in.
      // Specific enough that a bakery's "our cookies" section is left alone.
      const CONSENT_RX = /\b(we use cookies|(this|our) (web)?site uses cookies|uses cookies|use of cookies|cookie (policy|settings|preferences|notice|consent|banner)|accept (all )?cookies|cookies? to (personali[sz]e|improve|analy[sz]e|enhance|provide|ensure|give)|consent|gdpr|ccpa|verwendet cookies|nutzt cookies|setzt cookies|datenschutz|einwilligung|utilise des cookies|consentement|utiliza cookies|consentimiento|utilizza (i )?cookie|consenso|gebruikt cookies|toestemming)\b/i;

      const zOf = (el: HTMLElement) => {
        const z = parseInt(window.getComputedStyle(el).zIndex, 10);
        return Number.isNaN(z) ? 0 : z;
      };

      // Only position:fixed counts as an overlay. Sticky elements are
      // pinned scroll-telling sections and headers, i.e. page content.
      const isFixed = (el: HTMLElement) => {
        const cs = window.getComputedStyle(el);
        if (cs.display === "none" || cs.visibility === "hidden") return false;
        return cs.position === "fixed";
      };
      const fixedWithin = (el: HTMLElement, levels: number) => {
        let n: HTMLElement | null = el;
        for (let i = 0; n && i <= levels; i += 1) {
          if (window.getComputedStyle(n).position === "fixed") return true;
          n = n.parentElement;
        }
        return false;
      };

      const isLikelyTopNav = (r: DOMRect) =>
        r.top < 8 && r.height < 120;

      const isPageRoot = (el: HTMLElement) =>
        el === document.body || el === document.documentElement || el.tagName === "MAIN";

      // Full-screen fixed canvases, videos, gradients and grain layers
      // are how design-led sites paint their backgrounds. Not popups. A
      // click-through (pointer-events:none) layer only counts when
      // nothing in it speaks or can be clicked.
      const isDecorative = (el: HTMLElement) => {
        if (/^(canvas|video|img|picture|svg)$/i.test(el.tagName)) return true;
        if (zOf(el) < 0) return true;
        const txt = (el.innerText ?? "").trim();
        const interactive = el.querySelector("button, input, select, textarea, form, a[href]");
        if (txt.length < 12 && !interactive) {
          if (window.getComputedStyle(el).pointerEvents === "none") return true;
          if (el.querySelector("canvas, video, img, picture, svg")) return true;
        }
        return false;
      };

      // What a blocking popup says or contains. A fixed hero or menu
      // rarely matches; newsletter, consent, region, login and intro
      // gate modals nearly always do.
      const MODAL_RX = /\b(subscribe|newsletter|sign ?up|sign ?in|log ?in|e-?mail|discount|coupon|promo|cookies?|consent|privacy|accept|agree|dismiss|no,? thanks|not now|maybe later|download (the|our) app|get the app|open in app|select (your )?(country|region|language|location)|choose (your )?(country|region|language)|are you (over )?(18|21)|verify your age|age verification|continue to (the )?(web)?site|enter (the )?site|skip intro|acknowledg(e|es|ement) (of )?(the )?(traditional|country)|traditional (custodians|owners)|also available in)\b/i;
      const looksLikeModal = (el: HTMLElement) => {
        if (el.matches("[role='dialog'], [role='alertdialog'], [aria-modal='true']")) return true;
        if (el.querySelector("[role='dialog'], [aria-modal='true'], input[type='email'], input[type='password'], [aria-label*='close' i], [data-dismiss], [data-close]")) return true;
        const txt = (el.innerText ?? "").trim().slice(0, 800);
        return txt.length > 0 && MODAL_RX.test(txt);
      };

      let hidden = 0;
      const candidates = Array.from(document.querySelectorAll("*")).slice(
        0,
        3000,
      );

      const seen = new WeakSet<HTMLElement>();
      const tryHide = (el: HTMLElement) => {
        if (seen.has(el)) return false;
        seen.add(el);
        if (isPageRoot(el)) return false;
        if (isLikelyTopNav(el.getBoundingClientRect())) return false;
        el.style.setProperty("display", "none", "important");
        el.style.setProperty("visibility", "hidden", "important");
        return true;
      };

      // Pass A: big fixed popups.
      for (const el of candidates) {
        if (!(el instanceof HTMLElement)) continue;
        if (!isFixed(el)) continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (isLikelyTopNav(r)) continue;
        if (isPageRoot(el) || isDecorative(el)) continue;
        const big =
          r.width * r.height >= minArea &&
          (zOf(el) >= 2 || el.matches("[role='dialog'], [aria-modal='true']")) &&
          looksLikeModal(el);
        if (big && tryHide(el)) {
          hidden += 1;
          if (hidden >= 6) break;
        }
      }

      // Pass B: consent notices, fixed or inside a fixed layer. Hide the
      // outermost element that holds both the notice and its buttons but
      // is smaller than a whole-screen wrapper.
      {
        const notices: HTMLElement[] = [];
        for (const el of candidates) {
          if (!(el instanceof HTMLElement) || seen.has(el)) continue;
          const t = (el.innerText ?? "").trim();
          if (t.length < 12 || t.length > 3000 || !CONSENT_RX.test(t)) continue;
          if (!el.querySelector("button, [role='button'], a, input[type='checkbox']")) continue;
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          if (r.width * r.height > vw * vh * 0.6) continue;
          if (!fixedWithin(el, 6)) continue;
          notices.push(el);
        }
        const outermost = notices.filter((el) => !notices.some((o) => o !== el && o.contains(el)));
        for (const el of outermost) {
          if (tryHide(el)) {
            hidden += 1;
            if (hidden >= 10) return hidden;
          }
        }
      }

      // Pass C: walk up from accept-text buttons. The Figma cookie
      // dialog (and many others) sits inside a wrapper whose position
      // computes to "fixed", while the dialog itself does not.
      if (hidden < 10) {
        const ACCEPT_BUTTON_RX = /\b(accept all|allow all|allow cookies|accept cookies|do not allow|reject all|essential only|alle akzeptieren|tout accepter|aceptar todo|accetta tutti)\b/i;
        const buttons = Array.from(
          document.querySelectorAll("button, [role='button'], a"),
        ).slice(0, 300);
        for (const b of buttons) {
          if (!(b instanceof HTMLElement)) continue;
          const txt = (b.textContent ?? "").trim();
          if (!txt || !ACCEPT_BUTTON_RX.test(txt)) continue;
          // Walk up looking for the first fixed ancestor.
          let node: HTMLElement | null = b;
          for (let depth = 0; node && depth < 12; depth += 1) {
            const cs = window.getComputedStyle(node);
            if (cs.position === "fixed") {
              const r = node.getBoundingClientRect();
              if (r.width > 0 && r.height > 0 && !isLikelyTopNav(r)) {
                if (tryHide(node)) {
                  hidden += 1;
                  if (hidden >= 10) return hidden;
                }
              }
              break;
            }
            node = node.parentElement;
          }
        }
      }

      // Pass D: explicit dialog roles, plus class-name signatures. The
      // [role='dialog'][aria-modal='true'] pattern is the most reliable
      // signal of "this is a centered modal blocking content". Class
      // names like "hero-overlay" or "video-popup" are page content, so
      // those only count when fixed and popup-like.
      if (hidden < 10) {
        const DIALOG_SELECTORS = [
          "[role='dialog'][aria-modal='true']",
          "[role='alertdialog']",
          "[class*='modal--open' i]",
          "[class*='modal-open' i]",
          "[class*='Modal_' i][class*='open' i]",
          "[id*='popup' i]:not(nav):not(header)",
          "[class*='popup' i]:not(nav):not(header)",
          "[class*='overlay' i]:not(nav):not(header)",
        ];
        for (const sel of DIALOG_SELECTORS) {
          const byRole = sel.startsWith("[role=");
          for (const el of Array.from(document.querySelectorAll(sel))) {
            if (!(el instanceof HTMLElement)) continue;
            if (isPageRoot(el)) continue;
            const r = el.getBoundingClientRect();
            if (r.width < 200 || r.height < 100) continue;
            if (isLikelyTopNav(r)) continue;
            if (!byRole && (!fixedWithin(el, 3) || isDecorative(el) || !looksLikeModal(el))) continue;
            if (tryHide(el)) {
              hidden += 1;
              if (hidden >= 10) return hidden;
            }
          }
        }
      }

      // Pass E: backdrop detector. Centered modals usually sit on a
      // fixed, full-viewport, semi-transparent backdrop above the page.
      // Hide it AND the dialog inside it.
      if (hidden < 10) {
        const wideArea = vw * vh * 0.7;
        for (const el of Array.from(document.querySelectorAll("body *")).slice(0, 1200)) {
          if (!(el instanceof HTMLElement)) continue;
          const cs = window.getComputedStyle(el);
          if (cs.position !== "fixed") continue;
          if (cs.pointerEvents === "none" || zOf(el) < 2) continue;
          if (/^(canvas|video|img|picture|svg)$/i.test(el.tagName)) continue;
          const r = el.getBoundingClientRect();
          if (r.width * r.height < wideArea) continue;
          const bg = cs.backgroundColor;
          // rgba(0,0,0,X) or similar dim layer: alpha strictly between 0 and 1
          const m = bg.match(/rgba?\(([^)]+)\)/);
          if (!m) continue;
          const parts = m[1]!.split(",").map((p) => p.trim());
          const alpha = parts.length === 4 ? Number(parts[3]) : 1;
          if (alpha <= 0 || alpha >= 1) continue;
          if (tryHide(el)) {
            hidden += 1;
            for (const child of Array.from(el.children)) {
              if (child instanceof HTMLElement) tryHide(child);
            }
            if (hidden >= 10) return hidden;
          }
        }
      }

      // Pass F: body lock detector. A modal-open lock (overflow:hidden on
      // the body) outlives the modal we just hid; restore scrolling.
      if (hidden > 0) {
        const bodyCs = window.getComputedStyle(document.body);
        if (bodyCs.overflow === "hidden" || bodyCs.position === "fixed") {
          document.body.style.setProperty("overflow", "auto", "important");
          document.body.style.setProperty("position", "static", "important");
        }
      }

      // Pass G: small consent strip. Any fixed/sticky element pinned to
      // the bottom (or top) edge, or a corner, whose text is about
      // cookies or consent, regardless of size.
      const TEXTUAL_CONSENT_RX = /\b(cookies?|consent|gdpr|ccpa|we use|we and our partners)\b/i;
      for (const el of Array.from(document.querySelectorAll("*")).slice(0, 3000)) {
        if (!(el instanceof HTMLElement)) continue;
        if (seen.has(el)) continue;
        const cs = window.getComputedStyle(el);
        if (cs.position !== "fixed" && cs.position !== "sticky") continue;
        if (cs.display === "none" || cs.visibility === "hidden") continue;
        const r = el.getBoundingClientRect();
        if (r.width < 100 || r.height < 20) continue;
        // Bottom-pinned (cookie strips) or top-pinned (consent bars)
        const pinnedBottom = vh - r.bottom < 24 && r.top > vh * 0.5;
        const pinnedTopBar = r.top < 24 && r.height < 200 && r.width > vw * 0.6;
        const pinnedCorner =
          r.width < vw * 0.6 && r.height < vh * 0.6 &&
          (vh - r.bottom < 60 || r.top < 60);
        if (!pinnedBottom && !pinnedTopBar && !pinnedCorner) continue;
        const text = (el.textContent ?? "").trim().slice(0, 3000);
        if (text.length < 6 || text.length > 3000) continue;
        if (!TEXTUAL_CONSENT_RX.test(text)) continue;
        if (tryHide(el)) {
          hidden += 1;
          if (hidden >= 12) return hidden;
        }
      }

      return hidden;
    });
    result.phantomsHidden = hiddenCount;
  } catch {
    /* ignore */
  }

  // 6. Floating toasts with a close control, and corner chat bubbles.
  try {
    const floaters = (await page.evaluate(HIDE_FLOATERS)) as number;
    result.phantomsHidden = (result.phantomsHidden ?? 0) + floaters;
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
  // Consent management
  "onetrust.com",
  "cookielaw.org",
  "cookiebot.com",
  "cookiehub.eu",
  "cookiehub.net",
  "osano.com",
  "trustarc.com",
  "consentmanager.net",
  "iubenda.com",
  "termly.io",
  "cookie-script.com",
  "usercentrics.eu",
  "usercentrics.com",
  "privacy-mgmt.com",
  "privacy-center.org",
  "didomi.io",
  "cookieyes.com",
  "cdn-cookieyes.com",
  "cookiefirst.com",
  "axept.io",
  "axeptio.eu",
  "trustcommander.net",
  "cookieinformation.com",
  "ketchcdn.com",
  "transcend-cdn.com",
  "evidon.com",
  "civiccomputing.com",
  "consensu.org",
  "cmp.quantcast.com",
  "clickiocmp.com",
  "secureprivacy.ai",
  "cookiepro.com",
  "enzuzo.com",
  "silktide.com",
  // Chat widgets
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
  "tidio.co",
  "tidiochat.com",
  "freshchat.com",
  "gorgias.chat",
  "jivosite.com",
  "livechatinc.com",
  // Email-capture / promo popup systems
  "privy.com",
  "privy-static.com",
  "klaviyo.com/onsite",
  "k.klaviyo.com",
  "static-tracking.klaviyo.com",
  "optinmonster.com",
  "wisepops.com",
  "sumo.com",
  "popupsmart.com",
  "optimonk.com",
  "justuno.com",
  "yieldify.com",
  "exitbee.com",
  "getsitecontrol.com",
  // Region / language detector services
  "wovn.io",
  "weglot.com",
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
 * Drop a handful of common "user already answered" cookies on the
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
