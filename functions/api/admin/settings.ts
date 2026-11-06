// PUT /api/admin/settings → salva le impostazioni dal pannello (solo campi noti, valori controllati)
import { hasDb, isAdmin, json, noDb, putSettings, type Env } from "../../_lib";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const str = (v: unknown, n: number) => String(v ?? "").slice(0, n);
const num = (v: unknown, min: number, max: number, def: number) => { const x = Number(v); return Number.isFinite(x) ? Math.min(max, Math.max(min, x)) : def; };

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  if (!hasDb(env)) return noDb();
  if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
  if (Number(request.headers.get("content-length") || 0) > 100_000) return json({ error: "troppo grande" }, 413);
  const b = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b || typeof b !== "object") return json({ error: "json" }, 400);
  const email = str(b.email, 120).trim();
  const clean = {
    cin: str(b.cin, 30).toUpperCase().replace(/[^A-Z0-9]/g, ""),
    cinIsDemo: b.cinIsDemo === true,
    phoneDisplay: str(b.phoneDisplay, 30),
    whatsapp: str(b.whatsapp, 20).replace(/\D/g, ""),
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "",
    directDiscountPercent: num(b.directDiscountPercent, 0, 50, 0),
    rooms: (Array.isArray(b.rooms) ? b.rooms : []).slice(0, 20).map((r: Record<string, unknown>) => ({
      id: str(r?.id, 40), priceFrom: num(r?.priceFrom, 0, 10000, 0), guests: num(r?.guests, 1, 20, 2), visible: r?.visible !== false,
    })),
    blocked: (Array.isArray(b.blocked) ? b.blocked : []).filter((d: unknown) => DATE.test(String(d))).slice(0, 2000),
    icalUrls: (Array.isArray(b.icalUrls) ? b.icalUrls : []).map((u: unknown) => str(u, 500).trim()).filter((u: string) => /^https:\/\//.test(u)).slice(0, 5),
  };
  await putSettings(env, clean);
  return json({ ok: true, settings: clean });
};
