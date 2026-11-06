// POST /api/admin/email-test → manda un'email di prova all'indirizzo di Livia
import { getSettings, hasDb, isAdmin, json, noDb, type Env } from "../../_lib";
import { ownerNew, sendEmail } from "../../_email";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!hasDb(env)) return noDb();
  if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
  if (!env.RESEND_API_KEY) return json({ ok: false, error: "RESEND_API_KEY non impostata" }, 400);
  const s = await getSettings(env);
  const to = env.OWNER_EMAIL || String(s.email || "");
  if (!to) return json({ ok: false, error: "Inserisci prima la tua email nelle Impostazioni" }, 400);
  const d = new Date(); const iso = (x: Date) => x.toISOString().slice(0, 10);
  const ok = await sendEmail(env, to, ownerNew({
    id: "prova", name: "Ospite di prova", email: "ospite@esempio.it", checkIn: iso(new Date(d.getTime() + 7 * 864e5)), checkOut: iso(new Date(d.getTime() + 9 * 864e5)),
    roomId: "matrimoniale", roomName: "Camera Matrimoniale", guests: 2, notes: "Questa è un'email di prova.", total: 117, lang: "it", status: "nuova",
  }, new URL("/#admin", request.url).toString()));
  return json({ ok, to }, ok ? 200 : 502);
};
