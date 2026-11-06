// GET /api/admin/push/key → chiave pubblica VAPID per iscrivere il telefono alle notifiche
import { hasDb, isAdmin, json, noDb, type Env } from "../../../_lib";
import { getVapid } from "../../../_push";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!hasDb(env)) return noDb();
  if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
  return json({ publicKey: (await getVapid(env)).publicKey });
};
