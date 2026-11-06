// POST /api/admin/push/subscribe → salva il dispositivo che riceverà le notifiche
import { hasDb, isAdmin, json, noDb, type Env } from "../../../_lib";
import { saveSubscription } from "../../../_push";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!hasDb(env)) return noDb();
  if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
  const ok = await saveSubscription(env, (await request.json().catch(() => ({}))) as { endpoint?: string });
  return json({ ok }, ok ? 200 : 400);
};
