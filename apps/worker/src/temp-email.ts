/**
 * Throwaway inbox via mail.tm (free, no signup needed for the API).
 *
 * Two jobs:
 *   1. `createInbox()` — mint a real, working email address + auth
 *      token. A real address (vs a fake @example.com) is what lets a
 *      signup form's validation pass, so the funnel can actually
 *      advance past the email step.
 *   2. `pollForLink()` — watch the inbox for the verification /
 *      confirmation email and extract the link to click, so the flow
 *      can complete the "check your email" wall instead of stopping
 *      there.
 *
 * Everything is best-effort: if mail.tm is unreachable or rate-limited,
 * callers fall back to a synthetic address and simply stop at the
 * verify wall (still a captured, useful flow).
 */

const API = process.env.INSPO_MAILTM_API ?? "https://api.mail.tm";

export interface Inbox {
  address: string;
  password: string;
  token: string;
}

async function jfetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

/** mail.tm has returned both a bare array and a Hydra-wrapped
 *  `{ "hydra:member": [...] }` over time. Normalise to an array. */
function asList<T>(json: unknown): T[] {
  if (Array.isArray(json)) return json as T[];
  const m = (json as { "hydra:member"?: unknown })?.["hydra:member"];
  return Array.isArray(m) ? (m as T[]) : [];
}

/** Create a working throwaway inbox. Returns null on any failure. */
export async function createInbox(): Promise<Inbox | null> {
  try {
    // 1. pick an available domain
    const dRes = await jfetch("/domains?page=1");
    if (!dRes.ok) return null;
    const domains = asList<{ domain: string; isActive?: boolean }>(
      await dRes.json(),
    ).filter((d) => d.isActive !== false);
    const domain = domains[0]?.domain;
    if (!domain) return null;

    // 2. create the account. mail.tm normalises the local part (strips
    //    dots + special chars), so the address we send back for the
    //    token MUST be the one it returns, not the one we sent.
    const local = `inspoflow${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;
    const requested = `${local}@${domain}`;
    const password = `Fl0w${Math.random().toString(36).slice(2, 10)}A1`;
    const aRes = await jfetch("/accounts", {
      method: "POST",
      body: JSON.stringify({ address: requested, password }),
    });
    if (!aRes.ok && aRes.status !== 201) return null;
    const aJson = (await aRes.json()) as { address?: string };
    const address = aJson.address ?? requested;

    // 3. get a token using the canonical (normalised) address
    const tRes = await jfetch("/token", {
      method: "POST",
      body: JSON.stringify({ address, password }),
    });
    if (!tRes.ok) return null;
    const tJson = (await tRes.json()) as { token?: string };
    if (!tJson.token) return null;

    return { address, password, token: tJson.token };
  } catch {
    return null;
  }
}

const LINK_RE =
  /https?:\/\/[^\s"'<>)]+(?:verify|confirm|activate|validate|magic|auth\/|\/welcome|token=|code=)[^\s"'<>)]*/i;

/** Poll the inbox until a verification/confirmation link arrives or we
 *  time out. Returns the first plausible link or null. */
export async function pollForLink(
  inbox: Inbox,
  opts: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<string | null> {
  const timeoutMs = opts.timeoutMs ?? 45_000;
  const intervalMs = opts.intervalMs ?? 4_000;
  const deadline = Date.now() + timeoutMs;
  const auth = { Authorization: `Bearer ${inbox.token}` };

  while (Date.now() < deadline) {
    try {
      const listRes = await jfetch("/messages?page=1", { headers: auth });
      if (listRes.ok) {
        const messages = asList<{ id: string }>(await listRes.json());
        for (const msg of messages) {
          const full = await jfetch(`/messages/${msg.id}`, { headers: auth });
          if (!full.ok) continue;
          const body = (await full.json()) as {
            html?: string[];
            text?: string;
          };
          const haystack = `${(body.html ?? []).join(" ")} ${body.text ?? ""}`;
          const m = haystack.match(LINK_RE);
          if (m) return m[0].replace(/&amp;/g, "&");
        }
      }
    } catch {
      /* keep polling */
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return null;
}
