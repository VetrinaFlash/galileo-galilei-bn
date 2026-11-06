// POST /api/requests → salva la richiesta di prenotazione inviata dal sito
import { ensureSchema, getSettings, hasDb, json, noDb, type Env } from "../_lib";
import { guestReceived, ownerNew, sendEmail, type Req } from "../_email";
import { pushAll } from "../_push";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const clip = (v: unknown, n: number) => String(v ?? "").slice(0, n);

export const onRequestPost: PagesFunction<Env> = async ({ request, env, waitUntil }) => {
  if (!hasDb(env)) return noDb();
  await ensureSchema(env);
  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return json({ error: "json" }, 400); }
  if (!DATE.test(String(b.checkIn)) || !DATE.test(String(b.checkOut)) || String(b.checkOut) <= String(b.checkIn)) return json({ error: "date" }, 400);
  const req = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    name: clip(b.name, 80),
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(b.email || "")) ? clip(b.email, 120) : "",
    phone: clip(b.phone, 30),
    checkIn: String(b.checkIn),
    checkOut: String(b.checkOut),
    roomId: clip(b.roomId, 40),
    roomName: clip(b.roomName, 60),
    guests: Math.max(1, Math.min(10, Number(b.guests) || 1)),
    notes: clip(b.notes, 600),
    total: Math.max(0, Math.min(100000, Number(b.total) || 0)),
    lang: clip(b.lang, 5),
    status: "nuova",
  };
  await env.DB.prepare("INSERT INTO requests (id, created_at, status, data) VALUES (?1, ?2, 'nuova', ?3)")
    .bind(req.id, req.createdAt, JSON.stringify(req)).run();
  // avvisi in background: non rallentano la risposta all'ospite
  waitUntil((async () => {
    const s = await getSettings(env);
    const owner = env.OWNER_EMAIL || String(s.email || "");
    const panel = new URL("/#admin", request.url).toString();
    await Promise.allSettled([
      req.email ? sendEmail(env, req.email, guestReceived(req as Req), owner || undefined) : Promise.resolve(false),
      owner ? sendEmail(env, owner, ownerNew(req as Req, panel), req.email || undefined) : Promise.resolve(false),
      pushAll(env),
    ]);
  })());
  return json({ ok: true, id: req.id }, 201);
};
