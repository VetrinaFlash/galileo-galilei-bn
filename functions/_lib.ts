// Funzioni condivise per le Cloudflare Pages Functions (i file che iniziano con "_" non diventano rotte)

export interface Env {
  DB: D1Database;
  /** password del pannello gestore (Settings → Environment variables, tipo "Secret") */
  ADMIN_PASSWORD: string;
  /** opzionale: link iCal separati da virgola, in aggiunta a quelli salvati dal pannello */
  ICAL_URLS?: string;
}

export const json = (data: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json", ...extra } });

// ───────── database: le tabelle si creano da sole al primo utilizzo ─────────
const SCHEMA = [
  "CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS requests (id TEXT PRIMARY KEY, created_at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'nuova', data TEXT NOT NULL)",
  "CREATE INDEX IF NOT EXISTS idx_requests_created ON requests (created_at DESC)",
];
let schemaReady: Promise<void> | null = null;
export function ensureSchema(env: Env) {
  if (!schemaReady) {
    schemaReady = env.DB.batch(SCHEMA.map((q) => env.DB.prepare(q))).then(() => undefined);
    schemaReady.catch(() => { schemaReady = null; });
  }
  return schemaReady;
}

/** true se il database è collegato (binding "DB"); altrimenti il sito resta in modalità demo */
export const hasDb = (env: Env) => !!env.DB;
export const noDb = () => json({ error: "database non collegato" }, 503);

// ───────── impostazioni (tabella settings, una riga JSON) ─────────
export async function getSettings(env: Env): Promise<Record<string, unknown>> {
  await ensureSchema(env);
  const row = await env.DB.prepare("SELECT value FROM settings WHERE key = 'site'").first<{ value: string }>();
  return row ? JSON.parse(row.value) : {};
}
export async function putSettings(env: Env, s: unknown) {
  await ensureSchema(env);
  await env.DB.prepare("INSERT INTO settings (key, value) VALUES ('site', ?1) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
    .bind(JSON.stringify(s)).run();
}

// ───────── calendari iCal ─────────
const pad = (n: number) => String(n).padStart(2, "0");
const isoUTC = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const parseIcsDate = (v: string) => { const m = v.match(/(\d{4})(\d{2})(\d{2})/); return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null; };

export function busyNights(ics: string): string[] {
  const out: string[] = [];
  for (const block of ics.replace(/\r?\n[ \t]/g, "").split("BEGIN:VEVENT").slice(1)) {
    const s = parseIcsDate(block.match(/DTSTART[^:]*:([0-9TZ]+)/)?.[1] ?? "");
    if (!s) continue;
    const e = parseIcsDate(block.match(/DTEND[^:]*:([0-9TZ]+)/)?.[1] ?? "") ?? new Date(s.getTime() + 86400000);
    for (let d = s; d < e; d = new Date(d.getTime() + 86400000)) out.push(isoUTC(d));
  }
  return out;
}

export async function portalBusy(env: Env, urlsFromSettings: unknown): Promise<{ busy: string[]; synced: boolean }> {
  const urls = [
    ...(Array.isArray(urlsFromSettings) ? (urlsFromSettings as string[]) : []),
    ...(env.ICAL_URLS || "").split(","),
  ].map((s) => s.trim()).filter((s) => /^https:\/\//.test(s));
  if (!urls.length) return { busy: [], synced: false };
  const set = new Set<string>();
  let ok = 0;
  await Promise.all([...new Set(urls)].map(async (u) => {
    try {
      const r = await fetch(u, { cf: { cacheTtl: 900, cacheEverything: true } } as RequestInit);
      if (!r.ok) return;
      busyNights(await r.text()).forEach((d) => set.add(d));
      ok++;
    } catch { /* un calendario non raggiungibile non blocca gli altri */ }
  }));
  return { busy: [...set].sort(), synced: ok > 0 };
}

// ───────── autenticazione pannello ─────────
async function hmac(key: string, msg: string) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
export const makeToken = (env: Env) => hmac(env.ADMIN_PASSWORD, "gg-admin-v1");

export async function isAdmin(request: Request, env: Env) {
  if (!env.ADMIN_PASSWORD) return false;
  const got = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const want = await makeToken(env);
  if (got.length !== want.length) return false;
  let diff = 0;
  for (let i = 0; i < got.length; i++) diff |= got.charCodeAt(i) ^ want.charCodeAt(i);
  return diff === 0;
}
