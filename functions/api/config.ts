// GET /api/config → impostazioni pubbliche + notti occupate (Booking/Airbnb + chiuse dal gestore)
import { getSettings, hasDb, json, noDb, portalBusy, type Env } from "../_lib";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  if (!hasDb(env)) return noDb();
  const s = await getSettings(env);
  const { busy, synced } = await portalBusy(env, s.icalUrls);
  const blocked = Array.isArray(s.blocked) ? (s.blocked as string[]) : [];
  const { icalUrls: _hidden, ...publicSettings } = s; // i link iCal non vanno resi pubblici
  return json({ settings: publicSettings, busy: [...new Set([...busy, ...blocked])].sort(), synced }, 200, { "cache-control": "public, max-age=60" });
};
