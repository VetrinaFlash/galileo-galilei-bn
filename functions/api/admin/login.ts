// POST /api/admin/login { password } → { token }
import { json, makeToken, type Env } from "../../_lib";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const { password } = (await request.json().catch(() => ({}))) as { password?: string };
  if (!env.ADMIN_PASSWORD) return json({ error: "ADMIN_PASSWORD non impostata" }, 503);
  if (password !== env.ADMIN_PASSWORD) {
    await new Promise((r) => setTimeout(r, 800)); // rallenta i tentativi
    return json({ error: "unauthorized" }, 401);
  }
  return json({ token: await makeToken(env) });
};
