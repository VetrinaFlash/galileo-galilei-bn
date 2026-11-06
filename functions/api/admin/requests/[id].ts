// PATCH /api/admin/requests/:id { status } · DELETE /api/admin/requests/:id
import { ensureSchema, getSettings, hasDb, isAdmin, json, noDb, type Env } from "../../../_lib";
import { guestConfirmed, guestDeclined, sendEmail, type Req } from "../../../_email";

const STATUSES = ["nuova", "confermata", "rifiutata"];

export const onRequestPatch: PagesFunction<Env> = async ({ request, env, params, waitUntil }) => {
  if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
  if (!hasDb(env)) return noDb();
  await ensureSchema(env);
  const { status } = (await request.json().catch(() => ({}))) as { status?: string };
  if (!status || !STATUSES.includes(status)) return json({ error: "status" }, 400);
  const id = String(params.id);
  const row = await env.DB.prepare("SELECT data, status FROM requests WHERE id = ?1").bind(id).first<{ data: string; status: string }>();
  await env.DB.prepare("UPDATE requests SET status = ?1 WHERE id = ?2").bind(status, id).run();
  // email all'ospite solo quando lo stato cambia davvero
  let emailed = false;
  if (row && row.status !== status && (status === "confermata" || status === "rifiutata")) {
    const r = { ...JSON.parse(row.data), status } as Req;
    if (r.email && env.RESEND_API_KEY) {
      emailed = true;
      waitUntil((async () => {
        const s = await getSettings(env);
        const owner = env.OWNER_EMAIL || String(s.email || "");
        await sendEmail(env, r.email!, status === "confermata" ? guestConfirmed(r) : guestDeclined(r), owner || undefined);
      })());
    }
  }
  return json({ ok: true, emailed });
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
  if (!hasDb(env)) return noDb();
  await ensureSchema(env);
  await env.DB.prepare("DELETE FROM requests WHERE id = ?1").bind(String(params.id)).run();
  return json({ ok: true });
};
