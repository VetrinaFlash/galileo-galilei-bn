/**
 * Cloudflare Pages Function: GET /api/availability
 *
 * Legge i calendari iCal di Booking / Airbnb (variabile d'ambiente ICAL_URLS,
 * più link separati da virgola) e restituisce le notti occupate.
 * Se ICAL_URLS non è impostata risponde { synced: false } e il sito usa il calendario dimostrativo.
 *
 * Dove trovare i link:
 *  - Booking: Extranet → Tariffe e disponibilità → Sincronizza calendari → Esporta
 *  - Airbnb:  Calendario → Disponibilità → Collega calendari → Esporta calendario
 */

interface Env { ICAL_URLS?: string }

const pad = (n: number) => String(n).padStart(2, "0");
const isoUTC = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

function parseIcsDate(v: string): Date | null {
  const m = v.match(/(\d{4})(\d{2})(\d{2})/);
  return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null;
}

function busyNights(ics: string): string[] {
  const out: string[] = [];
  const unfolded = ics.replace(/\r?\n[ \t]/g, "");
  for (const block of unfolded.split("BEGIN:VEVENT").slice(1)) {
    const start = block.match(/DTSTART[^:]*:([0-9TZ]+)/)?.[1];
    const end = block.match(/DTEND[^:]*:([0-9TZ]+)/)?.[1];
    const s = start && parseIcsDate(start);
    const e = end && parseIcsDate(end);
    if (!s) continue;
    const last = e ?? new Date(s.getTime() + 86400000);
    for (let d = s; d < last; d = new Date(d.getTime() + 86400000)) out.push(isoUTC(d));
  }
  return out;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const urls = (env.ICAL_URLS || "").split(",").map((s) => s.trim()).filter(Boolean);
  const headers = { "content-type": "application/json", "cache-control": "public, max-age=900" };
  if (!urls.length) return new Response(JSON.stringify({ synced: false, busy: [] }), { headers });

  const set = new Set<string>();
  let ok = 0;
  await Promise.all(urls.map(async (u) => {
    try {
      const r = await fetch(u, { cf: { cacheTtl: 900 } } as RequestInit);
      if (!r.ok) return;
      busyNights(await r.text()).forEach((d) => set.add(d));
      ok++;
    } catch { /* un calendario non raggiungibile non blocca gli altri */ }
  }));
  return new Response(JSON.stringify({ synced: ok > 0, busy: [...set].sort() }), { headers });
};
