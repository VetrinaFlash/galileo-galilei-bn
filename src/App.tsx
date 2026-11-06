import { useEffect, useMemo, useState } from "react";
import { faq, gallery, hero, highlights, nearby, rooms as baseRooms, services, site, whyDirect, type Lang, type Photo, type Room } from "./content";
import { t } from "./i18n";
import { Booking, defaultBooking, type BookingState } from "./Booking";
import { addDays, iso, parseIso, today } from "./dates";
import { loadPublic, submitRequest, defaultSettings, type PublicData } from "./store";
import Admin from "./Admin";
import { Logo, PhoneIcon, PinIcon, ServiceSvg, WhatsAppIcon } from "./icons";

function Pic({ photo, lang, className = "", onClick }: { photo: Photo; lang: Lang; className?: string; onClick?: () => void }) {
  if (photo.src) {
    return <img className={`pic ${className}`} src={photo.src} alt={photo.alt[lang]} loading="lazy" onClick={onClick} />;
  }
  return (
    <div className={`pic ph ${className}`} role="img" aria-label={photo.alt[lang]} onClick={onClick}>
      <span className="ph-inner">
        <Logo size={34} />
        <span className="ph-label">{photo.alt[lang]}</span>
        <span className="ph-sub">{t("photo_soon", lang)}</span>
      </span>
    </div>
  );
}

function useHash() {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const on = () => setHash(window.location.hash);
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return hash;
}

export default function App() {
  const hash = useHash();
  if (hash === "#admin") return <Admin />;
  return <Site />;
}

function Site() {
  const [lang, setLang] = useState<Lang>(() => (navigator.language?.startsWith("it") ? "it" : "en"));
  const [booking, setBooking] = useState<BookingState>(() => defaultBooking(baseRooms[0].id));
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [data, setData] = useState<PublicData>({ mode: "demo", settings: defaultSettings(), busy: [], synced: false });
  useEffect(() => { loadPublic().then(setData); }, []);
  const S = data.settings;
  const busy = useMemo(() => new Set(data.busy), [data.busy]);
  const synced = data.synced;
  const rooms: Room[] = useMemo(() => baseRooms
    .map((r) => { const x = S.rooms.find((y) => y.id === r.id); return x ? { ...r, priceFrom: x.priceFrom, guests: x.guests, _v: x.visible } : { ...r, _v: true }; })
    .filter((r) => r._v), [S.rooms]);
  useEffect(() => { if (rooms.length && !rooms.some((r) => r.id === booking.roomId)) setBooking((b) => ({ ...b, roomId: rooms[0].id })); }, [rooms, booking.roomId]);

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const goBook = (patch?: Partial<BookingState>) => {
    if (patch) setBooking((b) => ({ ...b, ...patch }));
    document.getElementById("prenota")?.scrollIntoView({ behavior: "smooth" });
  };

  const minIn = iso(today());
  const minOut = booking.checkIn ? iso(addDays(parseIso(booking.checkIn), 1)) : iso(addDays(today(), 1));
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.mapsQuery)}`;
  const waHello = `https://wa.me/${S.whatsapp}?text=${encodeURIComponent(lang === "it" ? `Ciao ${site.host}, vorrei informazioni sul B&B.` : `Hi ${site.host}, I'd like some information about the B&B.`)}`;

  return (
    <>
      <header className="top">
        <div className="wrap top-in">
          <a href="#" className="brand" aria-label={site.name}>
            <Logo size={38} />
            <span><b>{site.shortName}</b><small>Bed &amp; Breakfast · Caserta</small></span>
          </a>
          <nav className="nav">
            <a href="#camere">{t("nav_rooms", lang)}</a>
            <a href="#servizi">{t("nav_services", lang)}</a>
            <a href="#foto">{t("nav_gallery", lang)}</a>
            <a href="#dove">{t("nav_location", lang)}</a>
          </nav>
          <div className="top-actions">
            <div className="lang" role="group" aria-label="Lingua / Language">
              <button className={lang === "it" ? "on" : ""} onClick={() => setLang("it")}>IT</button>
              <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</button>
            </div>
            <button className="btn btn-sm" onClick={() => goBook()}>{t("nav_book", lang)}</button>
          </div>
        </div>
      </header>

      <section className="hero">
        <Pic photo={hero.photo} lang={lang} className="hero-pic" />
        <div className="hero-shade" />
        <div className="wrap hero-in">
          <p className="eyebrow light">{hero.eyebrow[lang]}</p>
          <h1>{hero.title[lang]}</h1>
          <p className="hero-sub">{hero.subtitle[lang]}</p>
          <ul className="chips">{highlights.map((h, i) => <li key={i}>{h[lang]}</li>)}</ul>

          <form className="quick" onSubmit={(e) => { e.preventDefault(); goBook(); }}>
            <label><span>{t("checkin", lang)}</span>
              <input type="date" min={minIn} value={booking.checkIn}
                onChange={(e) => setBooking((b) => ({ ...b, checkIn: e.target.value, checkOut: b.checkOut && b.checkOut > e.target.value ? b.checkOut : "" }))} />
            </label>
            <label><span>{t("checkout", lang)}</span>
              <input type="date" min={minOut} value={booking.checkOut} onChange={(e) => setBooking((b) => ({ ...b, checkOut: e.target.value }))} />
            </label>
            <label className="g"><span>{t("guests", lang)}</span>
              <select value={booking.guests} onChange={(e) => setBooking((b) => ({ ...b, guests: Number(e.target.value) }))}>
                {Array.from({ length: Math.max(...rooms.map((r) => r.guests), 2) }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <button className="btn" type="submit">{t("check_availability", lang)}</button>
          </form>
        </div>
      </section>

      <section className="section why">
        <div className="wrap">
          <h2 className="center">{t("why_title", lang)}</h2>
          <div className="why-grid">
            {whyDirect.map((w, i) => (
              <div key={i} className="why-item">
                <span className="num">0{i + 1}</span>
                <h3>{w.title[lang]}</h3>
                <p>{w.text[lang]}</p>
              </div>
            ))}
          </div>
          {S.directDiscountPercent > 0 && (
            <p className="promo">
              {lang === "it"
                ? <>Prenotando dal sito hai <b>−{S.directDiscountPercent}%</b> rispetto ai portali.</>
                : <>Book on our website and save <b>{S.directDiscountPercent}%</b> compared to booking platforms.</>}
            </p>
          )}
        </div>
      </section>

      <section id="camere" className="section">
        <div className="wrap">
          <p className="eyebrow">{t("nav_rooms", lang)}</p>
          <h2>{t("rooms_title", lang)}</h2>
          <p className="lead">{t("rooms_sub", lang)}</p>
          <div className="rooms">
            {rooms.map((r) => (
              <article key={r.id} className="room card">
                <Pic photo={r.photo} lang={lang} className="room-pic" />
                <div className="room-body">
                  <div className="room-head">
                    <h3>{r.name[lang]}</h3>
                    <span className="price"><small>{t("from", lang)}</small> € {r.priceFrom}<small>{t("per_night", lang)}</small></span>
                  </div>
                  <p>{r.description[lang]}</p>
                  <ul className="tags">
                    <li>{t("up_to", lang)} {r.guests} {t("people", lang)}</li>
                    {r.features.map((f, i) => <li key={i}>{f[lang]}</li>)}
                  </ul>
                  <button className="btn btn-ghost" onClick={() => goBook({ roomId: r.id, guests: Math.min(booking.guests, r.guests) })}>{t("request_room", lang)}</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Booking lang={lang} value={booking} onChange={setBooking} busy={busy} synced={synced} rooms={rooms} discount={S.directDiscountPercent}
        whatsapp={S.whatsapp} phoneDisplay={S.phoneDisplay}
        onSend={({ name, notes, total }) => submitRequest(data.mode, { name, notes, total, lang, checkIn: booking.checkIn, checkOut: booking.checkOut, roomId: booking.roomId, guests: booking.guests })} />

      <section id="servizi" className="section">
        <div className="wrap">
          <p className="eyebrow">{t("nav_services", lang)}</p>
          <h2>{t("services_title", lang)}</h2>
          <ul className="services">
            {services.map((s) => <li key={s.icon}><ServiceSvg name={s.icon} /><span>{s.label[lang]}</span></li>)}
          </ul>
        </div>
      </section>

      <section id="foto" className="section alt">
        <div className="wrap">
          <p className="eyebrow">{t("nav_gallery", lang)}</p>
          <h2>{t("gallery_title", lang)}</h2>
          <div className="gallery">
            {gallery.map((p, i) => <Pic key={i} photo={p} lang={lang} className={`g${i}`} onClick={() => setLightbox(i)} />)}
          </div>
        </div>
      </section>

      <section className="section reviews">
        <div className="wrap reviews-in">
          <div className="score"><b>{site.rating.score}</b><span>/10</span></div>
          <div>
            <h2>{t("reviews_title", lang)}</h2>
            <p className="lead">{site.rating.reviews} {t("reviews_count", lang)} · {site.rating.source[lang]}</p>
            <p className="quote">
              {lang === "it"
                ? `Gli ospiti parlano soprattutto della posizione e dell'accoglienza di ${site.host}.`
                : `Guests mostly mention the location and ${site.host}'s hospitality.`}
            </p>
          </div>
        </div>
      </section>

      <section id="dove" className="section">
        <div className="wrap location">
          <div>
            <p className="eyebrow">{t("nav_location", lang)}</p>
            <h2>{t("location_title", lang)}</h2>
            <p className="lead">{t("location_sub", lang)}</p>
            <p className="addr"><PinIcon /> {site.address}</p>
            <ul className="nearby">
              {nearby.map((n, i) => <li key={i}><span>{n.place[lang]}</span><b>{n.distance[lang]}</b></li>)}
            </ul>
            <a className="btn btn-ghost" href={mapsUrl} target="_blank" rel="noopener"><PinIcon /> {t("open_maps", lang)}</a>
          </div>
          <a className="mapart" href={mapsUrl} target="_blank" rel="noopener" aria-label={t("open_maps", lang)}>
            <svg viewBox="0 0 400 320" role="img" aria-hidden="true">
              <rect width="400" height="320" fill="var(--paper2)" />
              <g stroke="var(--line)" strokeWidth="10" fill="none" strokeLinecap="round">
                <path d="M-10 90 L410 120" /><path d="M-10 220 L410 200" /><path d="M120 -10 L150 330" /><path d="M290 -10 L260 330" />
              </g>
              <rect x="170" y="40" width="190" height="120" rx="6" fill="var(--green)" opacity=".16" />
              <text x="265" y="95" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontSize="18" fill="var(--green)">Reggia di Caserta</text>
              <text x="265" y="116" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="11" fill="var(--green)">12 min</text>
              <path d="M110 250 C 150 220, 190 200, 230 165" stroke="var(--accent)" strokeWidth="2.5" strokeDasharray="5 6" fill="none" />
              <circle cx="105" cy="255" r="14" fill="var(--accent)" />
              <circle cx="105" cy="255" r="5" fill="#fff" />
              <text x="105" y="290" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="12" fontWeight="600" fill="var(--ink)">B&amp;B Galileo Galilei</text>
            </svg>
          </a>
        </div>
      </section>

      <section className="section alt">
        <div className="wrap narrow">
          <h2 className="center">{t("faq_title", lang)}</h2>
          <div className="faq">
            {faq.map((f, i) => (
              <details key={i}><summary>{f.q[lang]}</summary><p>{f.a[lang]}</p></details>
            ))}
          </div>
        </div>
      </section>

      <footer className="foot">
        <div className="wrap foot-in">
          <div className="brand light"><Logo size={42} /><span><b>{site.name}</b><small>{site.address}</small></span></div>
          <div className="foot-contacts">
            <a href={waHello} target="_blank" rel="noopener"><WhatsAppIcon /> {t("write_whatsapp", lang)}</a>
            <a href={`tel:+${S.whatsapp}`}><PhoneIcon /> {S.phoneDisplay}</a>
            {S.email && <a href={`mailto:${S.email}`}>{S.email}</a>}
          </div>
          <div className="legal">
            <span>{t("cin_label", lang)}: {S.cin || t("cin_missing", lang)}{S.cin && S.cinIsDemo ? (lang === "it" ? " (di prova)" : " (sample)") : ""}</span>
            <span>Check-in {site.checkIn} · Check-out {site.checkOut}</span>
            <span>© {new Date().getFullYear()} {site.name} · {t("made_by", lang)} <a href="https://vetrinaflash.it" target="_blank" rel="noopener">VetrinaFlash</a></span>
            <a href="#admin" className="admin-link">{lang === "it" ? "Area riservata gestore" : "Owner area"}</a>
          </div>
        </div>
      </footer>

      <div className="mobile-bar">
        <a href={waHello} target="_blank" rel="noopener" className="btn btn-wa"><WhatsAppIcon /> WhatsApp</a>
        <button className="btn" onClick={() => goBook()}>{t("nav_book", lang)}</button>
      </div>

      {lightbox !== null && (
        <div className="lightbox" onClick={() => setLightbox(null)} role="dialog" aria-modal="true">
          <button className="lb-close" aria-label={t("close", lang)}>×</button>
          <Pic photo={gallery[lightbox]} lang={lang} className="lb-pic" />
        </div>
      )}
    </>
  );
}
