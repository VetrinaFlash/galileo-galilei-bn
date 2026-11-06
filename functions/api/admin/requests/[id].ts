// PATCH /api/admin/requests/:id { status } · DELETE /api/admin/requests/:id
import { isAdmin, json, type Env } from "../../../_lib";

const STATUSES = ["nuova", "confermata", "rifiutata"];

export const onRequestPatch: PagesFunction<Env> = async ({ request, env, params }) => {
  if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
  const { status } = (await request.json().catch(() => ({}))) as { status?: string };
  if (!status || !STATUSES.includes(status)) return json({ error: "status" }, 400);
  await env.DB.prepare("UPDATE requests SET status = ?1 WHERE id = ?2").bind(status, String(params.id)).run();
  return json({ ok: true });
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
  await env.DB.prepare("DELETE FROM requests WHERE id = ?1").bind(String(params.id)).run();
  return json({ ok: true });
};
