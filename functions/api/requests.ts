// POST /api/requests → salva la richiesta di prenotazione inviata dal sito
import { ensureSchema, hasDb, json, noDb, type Env } from "../_lib";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const clip = (v: unknown, n: number) => String(v ?? "").slice(0, n);

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!hasDb(env)) return noDb();
  await ensureSchema(env);
  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return json({ error: "json" }, 400); }
  if (!DATE.test(String(b.checkIn)) || !DATE.test(String(b.checkOut)) || String(b.checkOut) <= String(b.checkIn)) return json({ error: "date" }, 400);
  const req = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    name: clip(b.name, 80),
    checkIn: String(b.checkIn),
    checkOut: String(b.checkOut),
    roomId: clip(b.roomId, 40),
    guests: Math.max(1, Math.min(10, Number(b.guests) || 1)),
    notes: clip(b.notes, 600),
    total: Math.max(0, Math.min(100000, Number(b.total) || 0)),
    lang: clip(b.lang, 5),
    status: "nuova",
  };
  await env.DB.prepare("INSERT INTO requests (id, created_at, status, data) VALUES (?1, ?2, 'nuova', ?3)")
    .bind(req.id, req.createdAt, JSON.stringify(req)).run();
  return json({ ok: true, id: req.id }, 201);
};
