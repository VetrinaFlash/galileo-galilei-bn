// Notifiche push (Web Push con VAPID) senza servizi esterni.
// Le chiavi VAPID vengono create da sole alla prima richiesta e salvate nel database.
// Le notifiche partono senza contenuto cifrato: il testo lo mostra il service worker (public/sw.js).
import { ensureSchema, type Env } from "./_lib";

const b64url = (buf: ArrayBuffer | Uint8Array) => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = ""; for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

type Vapid = { publicKey: string; privateJwk: JsonWebKey };

export async function getVapid(env: Env): Promise<Vapid> {
  await ensureSchema(env);
  const row = await env.DB.prepare("SELECT value FROM settings WHERE key = 'vapid'").first<{ value: string }>();
  if (row) return JSON.parse(row.value);
  const kp = (await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"])) as CryptoKeyPair;
  const v: Vapid = {
    publicKey: b64url((await crypto.subtle.exportKey("raw", kp.publicKey)) as ArrayBuffer),
    privateJwk: (await crypto.subtle.exportKey("jwk", kp.privateKey)) as JsonWebKey,
  };
  await env.DB.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('vapid', ?1)").bind(JSON.stringify(v)).run();
  const again = await env.DB.prepare("SELECT value FROM settings WHERE key = 'vapid'").first<{ value: string }>();
  return again ? JSON.parse(again.value) : v;
}

async function vapidHeader(v: Vapid, endpoint: string) {
  const enc = (o: unknown) => b64url(new TextEncoder().encode(JSON.stringify(o)));
  const unsigned = `${enc({ typ: "JWT", alg: "ES256" })}.${enc({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: "mailto:notifiche@example.com" })}`;
  const key = await crypto.subtle.importKey("jwk", v.privateJwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(unsigned));
  return `vapid t=${unsigned}.${b64url(sig)}, k=${v.publicKey}`;
}

export async function saveSubscription(env: Env, sub: { endpoint?: string }) {
  if (!sub?.endpoint || !/^https:\/\//.test(sub.endpoint)) return false;
  await ensureSchema(env);
  await env.DB.prepare("INSERT INTO push_subs (endpoint, data, created_at) VALUES (?1, ?2, ?3) ON CONFLICT(endpoint) DO UPDATE SET data = excluded.data")
    .bind(sub.endpoint, JSON.stringify(sub), new Date().toISOString()).run();
  return true;
}

/** invia una notifica a tutti i dispositivi iscritti; restituisce quanti l'hanno ricevuta */
export async function pushAll(env: Env): Promise<number> {
  await ensureSchema(env);
  const rows = await env.DB.prepare("SELECT endpoint FROM push_subs").all<{ endpoint: string }>();
  const list = rows.results || [];
  if (!list.length) return 0;
  const v = await getVapid(env);
  let ok = 0;
  await Promise.all(list.map(async ({ endpoint }) => {
    try {
      const r = await fetch(endpoint, { method: "POST", headers: { authorization: await vapidHeader(v, endpoint), ttl: "86400", urgency: "high", "content-length": "0" } });
      if (r.status === 404 || r.status === 410) await env.DB.prepare("DELETE FROM push_subs WHERE endpoint = ?1").bind(endpoint).run();
      else if (r.ok) ok++;
    } catch { /* dispositivo non raggiungibile */ }
  }));
  return ok;
}
