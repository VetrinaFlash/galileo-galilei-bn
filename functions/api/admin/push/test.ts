// POST /api/admin/push/test → manda una notifica di prova a tutti i dispositivi
import { hasDb, isAdmin, json, noDb, type Env } from "../../../_lib";
import { pushAll } from "../../../_push";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!hasDb(env)) return noDb();
  if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
  return json({ sent: await pushAll(env) });
};
