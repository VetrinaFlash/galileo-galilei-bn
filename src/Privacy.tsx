// Informativa privacy (art. 13 GDPR) per le richieste di prenotazione.
// DA FAR VERIFICARE: inserire il nome del titolare (Livia / ditta) e il codice fiscale o la P.IVA.
import { site, type Lang } from "./content";

const TITOLARE = `${site.name} – ${site.host}`; // DA CONFERMARE: nome completo / ragione sociale e C.F. o P.IVA

export function PrivacyText({ lang }: { lang: Lang }) {
  if (lang === "en") {
    return (
      <div className="privacy-text">
        <h3>Privacy notice</h3>
        <p><b>Data controller:</b> {TITOLARE}, {site.address}.</p>
        <p><b>What we collect:</b> the name, email, dates, number of guests and notes you enter in the booking form.</p>
        <p><b>Why:</b> only to reply to your request and manage your stay (pre-contractual measures, art. 6(1)(b) GDPR). Your data is not sold or used for marketing.</p>
        <p><b>Where:</b> on Cloudflare servers (website and database) and Resend (confirmation emails). Your request also reaches us on WhatsApp if you choose to send it that way.</p>
        <p><b>How long:</b> requests are automatically deleted after 24 months, unless longer retention is required by law (e.g. tax or police guest registration).</p>
        <p><b>Your rights:</b> you can ask to access, correct or delete your data, or object to its processing, by writing to us on WhatsApp ({site.phoneDisplay}). You can also lodge a complaint with the Italian Data Protection Authority (garanteprivacy.it).</p>
      </div>
    );
  }
  return (
    <div className="privacy-text">
      <h3>Informativa privacy</h3>
      <p><b>Titolare del trattamento:</b> {TITOLARE}, {site.address}.</p>
      <p><b>Quali dati:</b> nome, email, date, numero di ospiti e note che inserisci nel modulo di prenotazione.</p>
      <p><b>Perché:</b> solo per rispondere alla tua richiesta e gestire il soggiorno (misure precontrattuali, art. 6.1.b GDPR). I dati non vengono ceduti a terzi né usati per pubblicità.</p>
      <p><b>Dove:</b> sui server di Cloudflare (sito e database) e di Resend (email di conferma). Se scegli WhatsApp, la richiesta ci arriva anche lì.</p>
      <p><b>Per quanto tempo:</b> le richieste vengono cancellate automaticamente dopo 24 mesi, salvo obblighi di legge (es. fiscali o comunicazione degli alloggiati).</p>
      <p><b>I tuoi diritti:</b> puoi chiedere accesso, rettifica o cancellazione dei dati e opporti al trattamento scrivendoci su WhatsApp ({site.phoneDisplay}). Puoi anche presentare reclamo al Garante Privacy (garanteprivacy.it).</p>
    </div>
  );
}
