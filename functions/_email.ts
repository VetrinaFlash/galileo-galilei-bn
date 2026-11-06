// Email transazionali via Resend (https://resend.com) — gratis fino a 3.000 email/mese.
import type { Env } from "./_lib";

export type Req = {
  id: string; name: string; email?: string; phone?: string; checkIn: string; checkOut: string;
  roomId: string; roomName?: string; guests: number; notes: string; total: number; lang: string; status: string;
};

const SITE = {
  name: "B&B Galileo Galilei",
  host: "Livia",
  address: "Via Galileo Galilei, 12 · 81100 Caserta (CE)",
  maps: "https://www.google.com/maps/search/?api=1&query=B%26B%20Galileo%20Galilei%2C%20Via%20Galileo%20Galilei%2012%2C%20Caserta",
  checkIn: "15:00",
  checkOut: "11:00",
};

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
const nights = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
const fmt = (d: string, en: boolean) =>
  new Date(d + "T12:00:00Z").toLocaleDateString(en ? "en-GB" : "it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Rome" });

function layout(title: string, intro: string, rows: [string, string][], outro: string, cta?: { label: string; href: string }) {
  return `<!doctype html><html><body style="margin:0;background:#f8f4ed;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2420">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f4ed;padding:28px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fffdf9;border:1px solid #e2d9ca;border-radius:16px;overflow:hidden">
<tr><td style="background:#2f3b35;padding:22px 28px;color:#f3ece0;font-family:Georgia,serif;font-size:22px">${SITE.name}</td></tr>
<tr><td style="padding:28px">
<h1 style="font-family:Georgia,serif;font-weight:600;font-size:26px;margin:0 0 12px;color:#2f3b35">${title}</h1>
<p style="font-size:15px;line-height:1.6;margin:0 0 18px">${intro}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f4ed;border-radius:12px;padding:6px 16px;font-size:14px">
${rows.map(([k, v]) => `<tr><td style="padding:9px 0;color:#69706a;border-bottom:1px solid #e2d9ca">${k}</td><td style="padding:9px 0;text-align:right;font-weight:600;border-bottom:1px solid #e2d9ca">${v}</td></tr>`).join("")}
</table>
${cta ? `<p style="margin:22px 0 0"><a href="${cta.href}" style="display:inline-block;background:#b5643c;color:#fff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:999px">${cta.label}</a></p>` : ""}
<p style="font-size:15px;line-height:1.6;margin:20px 0 0">${outro}</p>
</td></tr>
<tr><td style="padding:16px 28px;border-top:1px solid #e2d9ca;font-size:12px;color:#69706a">${SITE.name} · ${SITE.address}</td></tr>
</table></td></tr></table></body></html>`;
}

function rowsFor(r: Req, en: boolean): [string, string][] {
  const n = nights(r.checkIn, r.checkOut);
  return [
    [en ? "Check-in" : "Arrivo", `${esc(fmt(r.checkIn, en))}<br><span style="font-weight:400;color:#69706a">${en ? "from" : "dalle"} ${SITE.checkIn}</span>`],
    [en ? "Check-out" : "Partenza", `${esc(fmt(r.checkOut, en))}<br><span style="font-weight:400;color:#69706a">${en ? "by" : "entro le"} ${SITE.checkOut}</span>`],
    [en ? "Nights" : "Notti", String(n)],
    [en ? "Room" : "Camera", esc(r.roomName || r.roomId)],
    [en ? "Guests" : "Ospiti", String(r.guests)],
    [en ? "Total" : "Totale", `€ ${esc(r.total)}`],
  ];
}

export function guestReceived(r: Req) {
  const en = r.lang === "en";
  return {
    subject: en ? `We received your request · ${SITE.name}` : `Abbiamo ricevuto la tua richiesta · ${SITE.name}`,
    html: layout(
      en ? `Thank you, ${esc(r.name)}!` : `Grazie, ${esc(r.name)}!`,
      en ? `${SITE.host} has received your booking request and will confirm availability shortly.` : `${SITE.host} ha ricevuto la tua richiesta di prenotazione e ti confermerà la disponibilità al più presto.`,
      rowsFor(r, en),
      en ? "No payment has been taken. You'll get another email as soon as your stay is confirmed." : "Non ti è stato addebitato nulla. Riceverai un'altra email appena il soggiorno sarà confermato.",
    ),
  };
}

export function guestConfirmed(r: Req) {
  const en = r.lang === "en";
  return {
    subject: en ? `Your stay is confirmed · ${SITE.name}` : `Soggiorno confermato · ${SITE.name}`,
    html: layout(
      en ? "See you soon!" : "Ti aspettiamo!",
      en ? `Good news, ${esc(r.name)}: your stay at ${SITE.name} is confirmed.` : `Buone notizie, ${esc(r.name)}: il tuo soggiorno al ${SITE.name} è confermato.`,
      [...rowsFor(r, en), [en ? "Address" : "Indirizzo", esc(SITE.address)]],
      en ? `Free private parking is available. If you need anything before arriving, just reply to this email or message ${SITE.host} on WhatsApp.`
         : `Il parcheggio privato è a tua disposizione. Per qualsiasi cosa prima dell'arrivo rispondi a questa email o scrivi a ${SITE.host} su WhatsApp.`,
      { label: en ? "Open in Google Maps" : "Apri in Google Maps", href: SITE.maps },
    ),
  };
}

export function guestDeclined(r: Req) {
  const en = r.lang === "en";
  return {
    subject: en ? `About your request · ${SITE.name}` : `La tua richiesta · ${SITE.name}`,
    html: layout(
      en ? "We're sorry" : "Ci dispiace",
      en ? `Dear ${esc(r.name)}, unfortunately the room is not available for the dates you requested.` : `Gentile ${esc(r.name)}, purtroppo la camera non è disponibile nelle date richieste.`,
      rowsFor(r, en),
      en ? "Feel free to choose other dates on our website: we'd love to host you." : "Se vuoi, scegli altre date sul nostro sito: saremo felici di ospitarti.",
    ),
  };
}

export function ownerNew(r: Req, panelUrl: string) {
  return {
    subject: `Nuova richiesta: ${r.name || "ospite"} · ${fmt(r.checkIn, false)}`,
    html: layout(
      "Nuova richiesta di prenotazione",
      `Hai ricevuto una richiesta dal sito da <b>${esc(r.name || "un ospite")}</b>${r.email ? ` (${esc(r.email)})` : ""}.`,
      [...rowsFor(r, false), ...(r.notes ? [["Note", esc(r.notes)] as [string, string]] : [])],
      "Confermala dal pannello: le date si chiudono sul calendario e l'ospite riceve l'email di conferma.",
      { label: "Apri il pannello", href: panelUrl },
    ),
  };
}

export async function sendEmail(env: Env, to: string, mail: { subject: string; html: string }, replyTo?: string) {
  if (!env.RESEND_API_KEY || !to) return false;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: env.EMAIL_FROM || `${SITE.name} <onboarding@resend.dev>`,
      to: [to],
      subject: mail.subject,
      html: mail.html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });
  return r.ok;
}
