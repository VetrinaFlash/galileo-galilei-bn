// GET /api/admin/data → impostazioni complete, richieste, notti occupate sui portali
import { getSettings, isAdmin, json, portalBusy, type Env } from "../../_lib";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
  const settings = await getSettings(env);
  const rows = await env.DB.prepare("SELECT data, status FROM requests ORDER BY created_at DESC LIMIT 500").all<{ data: string; status: string }>();
  const requests = (rows.results || []).map((r) => ({ ...JSON.parse(r.data), status: r.status }));
  const { busy, synced } = await portalBusy(env, settings.icalUrls);
  return json({ settings, requests, portalBusy: busy, synced });
};
