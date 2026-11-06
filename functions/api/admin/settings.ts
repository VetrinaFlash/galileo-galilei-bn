// PUT /api/admin/settings → salva le impostazioni dal pannello
import { hasDb, isAdmin, json, noDb, putSettings, type Env } from "../../_lib";

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  if (!hasDb(env)) return noDb();
  if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return json({ error: "json" }, 400);
  await putSettings(env, body);
  return json({ ok: true });
};
