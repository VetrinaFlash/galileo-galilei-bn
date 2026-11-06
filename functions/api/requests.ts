// POST /api/requests → salva la richiesta di prenotazione inviata dal sito
import { clientIp, ensureSchema, getSettings, hasDb, json, noDb, rateLimit, type Env } from "../_lib";
import { guestReceived, ownerNew, sendEmail, type Req } from "../_email";
import { pushAll } from "../_push";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const ROOMS = ["matrimoniale", "tripla", "terrazza"]; // aggiornare se si aggiungono camere in src/content.ts
const MAX_NIGHTS = 60;
const clip = (v: unknown, n: number) => String(v ?? "").slice(0, n);

export const onRequestPost: PagesFunction<Env> = async ({ request, env, waitUntil }) => {
  if (!hasDb(env)) return noDb();
  await ensureSchema(env);
  if (Number(request.headers.get("content-length") || 0) > 10_000) return json({ error: "troppo grande" }, 413);
  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return json({ error: "json" }, 400); }
  // campo trappola: è invisibile alle persone, solo i bot lo compilano
  if (b.website) return json({ ok: true }, 201);
  // massimo 6 richieste all'ora dallo stesso IP
  if (!(await rateLimit(env, `req:${clientIp(request)}`, 6, 3600))) return json({ error: "Troppe richieste, riprova più tardi." }, 429);
  const checkIn = String(b.checkIn), checkOut = String(b.checkOut);
  const today = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (!DATE.test(checkIn) || !DATE.test(checkOut) || checkOut <= checkIn || checkIn < today) return json({ error: "date" }, 400);
  if ((Date.parse(checkOut) - Date.parse(checkIn)) / 86400000 > MAX_NIGHTS) return json({ error: "date" }, 400);
  if (!ROOMS.includes(String(b.roomId))) return json({ error: "camera" }, 400);
  if (b.privacy !== true) return json({ error: "privacy" }, 400);
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
    privacyAcceptedAt: new Date().toISOString(),
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
    // evita che il modulo venga usato per mandare email a indirizzi altrui: massimo 3 al giorno per indirizzo
    const guestOk = req.email ? await rateLimit(env, `mail:${req.email.toLowerCase()}`, 3, 86400) : false;
    const panel = new URL("/#admin", request.url).toString();
    await Promise.allSettled([
      guestOk ? sendEmail(env, req.email, guestReceived(req as Req), owner || undefined) : Promise.resolve(false),
      owner ? sendEmail(env, owner, ownerNew(req as Req, panel), req.email || undefined) : Promise.resolve(false),
      pushAll(env),
      // conservazione dati: le richieste più vecchie di 24 mesi vengono cancellate
      env.DB.prepare("DELETE FROM requests WHERE created_at < ?1").bind(new Date(Date.now() - 730 * 86400000).toISOString()).run(),
      env.DB.prepare("DELETE FROM rate WHERE reset_at < ?1").bind(Math.floor(Date.now() / 1000)).run(),
    ]);
  })());
  return json({ ok: true, id: req.id }, 201);
};
