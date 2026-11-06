// GET /api/admin/data → impostazioni complete, richieste, notti occupate sui portali
import { ensureSchema, getSettings, hasDb, isAdmin, json, noDb, portalBusy, type Env } from "../../_lib";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!hasDb(env)) return noDb();
  if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
  await ensureSchema(env);
  const settings = await getSettings(env);
  const rows = await env.DB.prepare("SELECT data, status FROM requests ORDER BY created_at DESC LIMIT 500").all<{ data: string; status: string }>();
  const requests = (rows.results || []).map((r) => ({ ...JSON.parse(r.data), status: r.status }));
  const { busy, synced } = await portalBusy(env, settings.icalUrls);
  return json({ settings, requests, portalBusy: busy, synced });
};
