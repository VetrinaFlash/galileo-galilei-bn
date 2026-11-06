// POST /api/admin/login { password } → { token }  (max 8 tentativi ogni 15 minuti per IP)
import { clientIp, hasDb, json, makeToken, MIN_PASSWORD, noDb, passwordMatches, rateLimit, type Env } from "../../_lib";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!hasDb(env)) return noDb();
  if (!env.ADMIN_PASSWORD) return json({ error: "ADMIN_PASSWORD non impostata" }, 503);
  if (env.ADMIN_PASSWORD.length < MIN_PASSWORD) return json({ error: `ADMIN_PASSWORD troppo corta (minimo ${MIN_PASSWORD} caratteri)` }, 503);
  if (!(await rateLimit(env, `login:${clientIp(request)}`, 8, 15 * 60))) {
    return json({ error: "Troppi tentativi. Riprova tra 15 minuti." }, 429);
  }
  const { password } = (await request.json().catch(() => ({}))) as { password?: unknown };
  if (typeof password !== "string" || !(await passwordMatches(env, password))) {
    await new Promise((r) => setTimeout(r, 600));
    return json({ error: "Password non corretta" }, 401);
  }
  return json({ token: await makeToken(env) });
};
