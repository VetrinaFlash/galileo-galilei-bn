import { useMemo, useState } from "react";
import { rooms, site, type Lang } from "./content";
import { months, t, weekdays } from "./i18n";
import { addDays, fmtDate, iso, nightsBetween, rangeHasBusy, today } from "./dates";
import { PhoneIcon, WhatsAppIcon } from "./icons";

export type BookingState = { checkIn: string; checkOut: string; guests: number; roomId: string };

type Props = {
  lang: Lang;
  value: BookingState;
  onChange: (v: BookingState) => void;
  busy: Set<string>;
  synced: boolean;
};

function Month({ year, month, lang, value, busy, onPick }: {
  year: number; month: number; lang: Lang; value: BookingState; busy: Set<string>; onPick: (d: string) => void;
}) {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7; // lunedì = 0
  const days = new Date(year, month + 1, 0).getDate();
  const t0 = iso(today());
  const cells: (string | null)[] = [...Array(lead).fill(null)];
  for (let d = 1; d <= days; d++) cells.push(iso(new Date(year, month, d)));
  return (
    <div className="cal-month">
      <div className="cal-title">{months[lang][month]} {year}</div>
      <div className="cal-grid">
        {weekdays[lang].map((w, i) => <div key={i} className="cal-wd">{w}</div>)}
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const past = d < t0;
          const isBusy = busy.has(d);
          const { checkIn: a, checkOut: b } = value;
          const isStart = d === a, isEnd = d === b;
          const inRange = a && b && d > a && d < b;
          const disabled = past || (isBusy && !(a && !b && d > a));
          const cls = ["cal-day", past && "past", isBusy && "busy", (isStart || isEnd) && "sel", inRange && "range", isStart && b && "start", isEnd && "end"]
            .filter(Boolean).join(" ");
          return (
            <button key={i} type="button" className={cls} disabled={disabled} onClick={() => onPick(d)} aria-pressed={isStart || isEnd}>
              {Number(d.slice(8))}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Booking({ lang, value, onChange, busy, synced }: Props) {
  const [offset, setOffset] = useState(0);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const base = today();
  const m1 = new Date(base.getFullYear(), base.getMonth() + offset, 1);
  const m2 = new Date(base.getFullYear(), base.getMonth() + offset + 1, 1);

  const room = rooms.find((r) => r.id === value.roomId) ?? rooms[0];
  const { checkIn, checkOut } = value;
  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
  const conflict = checkIn && checkOut ? rangeHasBusy(checkIn, checkOut, busy) : false;
  const subtotal = nights * room.priceFrom;
  const discount = Math.round((subtotal * site.directDiscountPercent) / 100);
  const total = subtotal - discount;

  const pick = (d: string) => {
    if (!checkIn || (checkIn && checkOut) || d <= checkIn) {
      onChange({ ...value, checkIn: d, checkOut: "" });
    } else {
      onChange({ ...value, checkOut: d });
    }
  };

  const message = useMemo(() => {
    const L = lang === "it";
    const lines = [
      L ? `Ciao ${site.host}! Vorrei prenotare dal sito:` : `Hi ${site.host}! I'd like to book via your website:`,
      `• ${L ? "Camera" : "Room"}: ${room.name[lang]}`,
      `• ${L ? "Arrivo" : "Check-in"}: ${checkIn ? fmtDate(checkIn, lang) : "-"}`,
      `• ${L ? "Partenza" : "Check-out"}: ${checkOut ? fmtDate(checkOut, lang) : "-"} (${nights} ${nights === 1 ? t("night", lang) : t("nights", lang)})`,
      `• ${L ? "Ospiti" : "Guests"}: ${value.guests}`,
      name ? `• ${L ? "Nome" : "Name"}: ${name}` : "",
      notes ? `• ${L ? "Note" : "Notes"}: ${notes}` : "",
      nights ? `• ${L ? "Totale indicativo dal sito" : "Estimated total from website"}: € ${total}` : "",
      L ? "È disponibile?" : "Is it available?",
    ];
    return lines.filter(Boolean).join("\n");
  }, [lang, room, checkIn, checkOut, nights, value.guests, name, notes, total]);

  const ready = !!checkIn && !!checkOut && nights > 0 && !conflict;
  const waHref = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;

  return (
    <section id="prenota" className="section booking">
      <div className="wrap">
        <p className="eyebrow">{t("nav_book", lang)}</p>
        <h2>{t("book_title", lang)}</h2>
        <p className="lead">{t("book_sub", lang)}</p>

        <div className="booking-grid">
          <div className="card cal">
            <div className="cal-head">
              <button type="button" className="icon-btn" onClick={() => setOffset((o) => Math.max(0, o - 1))} disabled={offset === 0} aria-label={t("prev_month", lang)}>‹</button>
              <span className="cal-hint">{!checkIn || checkOut ? t("pick_checkin", lang) : t("pick_checkout", lang)}</span>
              <button type="button" className="icon-btn" onClick={() => setOffset((o) => Math.min(11, o + 1))} aria-label={t("next_month", lang)}>›</button>
            </div>
            <div className="cal-months">
              <Month year={m1.getFullYear()} month={m1.getMonth()} lang={lang} value={value} busy={busy} onPick={pick} />
              <Month year={m2.getFullYear()} month={m2.getMonth()} lang={lang} value={value} busy={busy} onPick={pick} />
            </div>
            <div className="cal-foot">
              <span className={`sync ${synced ? "on" : ""}`}>{synced ? t("synced", lang) : t("demo_calendar", lang)}</span>
              {checkIn && <button type="button" className="link-btn" onClick={() => onChange({ ...value, checkIn: "", checkOut: "" })}>{t("clear_dates", lang)}</button>}
            </div>
          </div>

          <form className="card form" onSubmit={(e) => e.preventDefault()}>
            <label>
              <span>{t("room", lang)}</span>
              <select value={room.id} onChange={(e) => onChange({ ...value, roomId: e.target.value })}>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.name[lang]} · {t("up_to", lang)} {r.guests} · € {r.priceFrom}</option>
                ))}
              </select>
            </label>
            <div className="row2">
              <label>
                <span>{t("guests", lang)}</span>
                <select value={value.guests} onChange={(e) => onChange({ ...value, guests: Number(e.target.value) })}>
                  {Array.from({ length: room.guests }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <label>
                <span>{t("your_name", lang)}</span>
                <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              </label>
            </div>
            <label>
              <span>{t("notes", lang)}</span>
              <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>

            <div className="summary">
              <div className="sum-dates">
                <div><small>{t("checkin", lang)}</small><b>{checkIn ? fmtDate(checkIn, lang) : "—"}</b></div>
                <div className="arrow">→</div>
                <div><small>{t("checkout", lang)}</small><b>{checkOut ? fmtDate(checkOut, lang) : "—"}</b></div>
              </div>
              {conflict && <p className="warn">{t("range_busy", lang)}</p>}
              {nights > 0 && !conflict && (
                <dl>
                  <div><dt>{nights} {nights === 1 ? t("night", lang) : t("nights", lang)} × € {room.priceFrom}</dt><dd>€ {subtotal}</dd></div>
                  {site.directDiscountPercent > 0 && <div className="disc"><dt>{t("direct_discount", lang)} −{site.directDiscountPercent}%</dt><dd>− € {discount}</dd></div>}
                  <div className="tot"><dt>{t("total", lang)}</dt><dd>€ {total}</dd></div>
                </dl>
              )}
            </div>

            <a className={`btn btn-wa ${ready ? "" : "disabled"}`} href={ready ? waHref : undefined} target="_blank" rel="noopener" aria-disabled={!ready}
               onClick={(e) => { if (!ready) e.preventDefault(); }}>
              <WhatsAppIcon /> {t("send_whatsapp", lang)}
            </a>
            <p className="fine">
              {t("or_call", lang)} <a href={`tel:${site.phoneTel}`}><PhoneIcon /> {site.phoneDisplay}</a>
            </p>
            <p className="fine muted">{t("no_payment", lang)}</p>
          </form>
        </div>
      </div>
    </section>
  );
}

export const defaultBooking = (): BookingState => ({ checkIn: "", checkOut: "", guests: 2, roomId: rooms[0].id });
export const tomorrow = () => iso(addDays(today(), 1));
