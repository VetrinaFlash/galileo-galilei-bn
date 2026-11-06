// Dati modificabili dal pannello del gestore.
// Con Cloudflare (D1) i dati stanno sul server; senza server (anteprima) il sito
// funziona in "modalità demo" e salva tutto nel browser.

import { rooms as baseRooms, site } from "./content";
import { addDays, demoBusy, iso, today } from "./dates";

export type RoomSettings = { id: string; priceFrom: number; guests: number; visible: boolean };
export type Settings = {
  cin: string;
  cinIsDemo: boolean;
  phoneDisplay: string;
  whatsapp: string;
  email: string;
  directDiscountPercent: number;
  rooms: RoomSettings[];
  /** notti chiuse a mano dal gestore (YYYY-MM-DD) */
  blocked: string[];
  /** link iCal di Booking / Airbnb */
  icalUrls: string[];
};
export type RequestStatus = "nuova" | "confermata" | "rifiutata";
export type BookingRequest = {
  id: string;
  createdAt: string;
  name: string;
  email?: string;
  roomName?: string;
  checkIn: string;
  checkOut: string;
  roomId: string;
  guests: number;
  notes: string;
  total: number;
  lang: string;
  status: RequestStatus;
  sample?: boolean;
};
export type Mode = "live" | "demo";

export const defaultSettings = (): Settings => ({
  cin: site.cin,
  cinIsDemo: site.cinIsDemo,
  phoneDisplay: site.phoneDisplay,
  whatsapp: site.whatsapp,
  email: site.email,
  directDiscountPercent: site.directDiscountPercent,
  rooms: baseRooms.map((r) => ({ id: r.id, priceFrom: r.priceFrom, guests: r.guests, visible: true })),
  blocked: [],
  icalUrls: [],
});

/** unisce impostazioni salvate e valori di base (utile se aggiungi camere nel codice) */
export const mergeSettings = (s: Partial<Settings> | null | undefined): Settings => {
  const d = defaultSettings();
  if (!s) return d;
  const rooms = d.rooms.map((r) => ({ ...r, ...(s.rooms?.find((x) => x.id === r.id) ?? {}) }));
  return { ...d, ...s, rooms, blocked: s.blocked ?? [], icalUrls: s.icalUrls ?? [],
    // i contatti vuoti non devono mai lasciare il sito senza WhatsApp
    whatsapp: s.whatsapp || d.whatsapp, phoneDisplay: s.phoneDisplay || d.phoneDisplay };
};

// ───────────── modalità demo (browser) ─────────────
const LS_S = "gg_demo_settings";
const LS_R = "gg_demo_requests";
const read = <X,>(k: string): X | null => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as X) : null; } catch { return null; } };
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage non disponibile */ } };

const sampleRequests = (): BookingRequest[] => {
  const t = today();
  return [
    { id: "esempio-1", createdAt: new Date(Date.now() - 3600e3 * 5).toISOString(), name: "Marco (esempio)", email: "marco@esempio.it", checkIn: iso(addDays(t, 13)), checkOut: iso(addDays(t, 15)),
      roomId: "matrimoniale", guests: 2, notes: "Arriviamo verso le 18. Possiamo lasciare l'auto nel parcheggio?", total: 117, lang: "it", status: "nuova", sample: true },
    { id: "esempio-2", createdAt: new Date(Date.now() - 3600e3 * 30).toISOString(), name: "Sophie (example)", checkIn: iso(addDays(t, 20)), checkOut: iso(addDays(t, 23)),
      roomId: "terrazza", guests: 2, notes: "Visiting the Royal Palace, travelling with a small dog.", total: 203, lang: "en", status: "confermata", sample: true },
  ];
};

export const demoStore = {
  settings: () => mergeSettings(read<Settings>(LS_S)),
  saveSettings: (s: Settings) => write(LS_S, s),
  requests: (): BookingRequest[] => read<BookingRequest[]>(LS_R) ?? sampleRequests(),
  saveRequests: (r: BookingRequest[]) => write(LS_R, r),
  busyFromPortals: () => demoBusy(),
  reset: () => { try { localStorage.removeItem(LS_S); localStorage.removeItem(LS_R); } catch { /* */ } },
};

// ───────────── API (Cloudflare) ─────────────
export type PublicData = { mode: Mode; settings: Settings; busy: string[]; synced: boolean };

export async function loadPublic(): Promise<PublicData> {
  try {
    const r = await fetch("./api/config", { headers: { accept: "application/json" } });
    if (!r.ok || !r.headers.get("content-type")?.includes("json")) throw new Error();
    const d = (await r.json()) as { settings: Partial<Settings>; busy: string[]; synced: boolean };
    return { mode: "live", settings: mergeSettings(d.settings), busy: d.busy, synced: d.synced };
  } catch {
    const s = demoStore.settings();
    const confirmed = demoStore.requests().filter((r) => r.status === "confermata").flatMap((r) => {
      const out: string[] = [];
      for (let d = new Date(r.checkIn + "T00:00"); iso(d) < r.checkOut; d = addDays(d, 1)) out.push(iso(d));
      return out;
    });
    return { mode: "demo", settings: s, busy: [...new Set([...demoStore.busyFromPortals(), ...s.blocked, ...confirmed])], synced: false };
  }
}

export async function submitRequest(mode: Mode, req: Omit<BookingRequest, "id" | "createdAt" | "status"> & { privacy: boolean; website?: string }) {
  const full: BookingRequest = { ...req, id: crypto.randomUUID?.() ?? String(Date.now()), createdAt: new Date().toISOString(), status: "nuova" };
  if (mode === "demo") {
    demoStore.saveRequests([full, ...demoStore.requests()]);
    return;
  }
  try {
    await fetch("./api/requests", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(full), keepalive: true });
  } catch { /* la richiesta arriva comunque su WhatsApp */ }
}

// ───────────── API pannello ─────────────
const TOKEN = "gg_admin_token";
export const adminToken = {
  get: () => { try { return localStorage.getItem(TOKEN) || ""; } catch { return ""; } },
  set: (t: string) => { try { localStorage.setItem(TOKEN, t); } catch { /* */ } },
  clear: () => { try { localStorage.removeItem(TOKEN); } catch { /* */ } },
};
export const DEMO_PASSWORD = "galileo";

const authed = (init: RequestInit = {}): RequestInit => ({
  ...init,
  headers: { "content-type": "application/json", authorization: `Bearer ${adminToken.get()}`, ...(init.headers || {}) },
});

export const adminApi = {
  /** restituisce "" se l'accesso è riuscito, altrimenti il messaggio di errore */
  async login(mode: Mode, password: string): Promise<string> {
    if (mode === "demo") { if (password.trim() === DEMO_PASSWORD) { adminToken.set("demo"); return ""; } return "Password non corretta"; }
    const r = await fetch("./api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password }) });
    const d = (await r.json().catch(() => ({}))) as { token?: string; error?: string };
    if (!r.ok || !d.token) return d.error || "Accesso non riuscito";
    adminToken.set(d.token);
    return "";
  },
  async load(mode: Mode): Promise<{ settings: Settings; requests: BookingRequest[]; portalBusy: string[]; synced: boolean }> {
    if (mode === "demo") return { settings: demoStore.settings(), requests: demoStore.requests(), portalBusy: demoStore.busyFromPortals(), synced: false };
    const r = await fetch("./api/admin/data", authed());
    if (r.status === 401) throw new Error("401");
    const d = await r.json();
    return { settings: mergeSettings(d.settings), requests: d.requests, portalBusy: d.portalBusy, synced: d.synced };
  },
  async saveSettings(mode: Mode, s: Settings) {
    if (mode === "demo") return demoStore.saveSettings(s);
    const r = await fetch("./api/admin/settings", authed({ method: "PUT", body: JSON.stringify(s) }));
    if (!r.ok) throw new Error("save");
  },
  /** restituisce true se è partita un'email all'ospite */
  async saveRequests(mode: Mode, list: BookingRequest[], changed: BookingRequest | null, removedId?: string): Promise<boolean> {
    if (mode === "demo") { demoStore.saveRequests(list); return false; }
    let emailed = false;
    if (changed) {
      const r = await fetch(`./api/admin/requests/${encodeURIComponent(changed.id)}`, authed({ method: "PATCH", body: JSON.stringify({ status: changed.status }) }));
      emailed = !!(await r.json().catch(() => ({})))?.emailed;
    }
    if (removedId) await fetch(`./api/admin/requests/${encodeURIComponent(removedId)}`, authed({ method: "DELETE" }));
    return emailed;
  },
  async pushKey(): Promise<string> {
    const r = await fetch("./api/admin/push/key", authed());
    if (!r.ok) throw new Error("key");
    return ((await r.json()) as { publicKey: string }).publicKey;
  },
  async pushSubscribe(sub: PushSubscriptionJSON) {
    const r = await fetch("./api/admin/push/subscribe", authed({ method: "POST", body: JSON.stringify(sub) }));
    if (!r.ok) throw new Error("subscribe");
  },
  async pushTest(): Promise<number> {
    const r = await fetch("./api/admin/push/test", authed({ method: "POST" }));
    return ((await r.json()) as { sent: number }).sent ?? 0;
  },
  async emailTest(): Promise<{ ok: boolean; to?: string; error?: string }> {
    const r = await fetch("./api/admin/email-test", authed({ method: "POST" }));
    return r.json();
  },
};
