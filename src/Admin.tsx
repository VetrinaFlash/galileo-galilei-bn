import { useEffect, useMemo, useState } from "react";
import { rooms as baseRooms, site } from "./content";
import { months } from "./i18n";
import { addDays, fmtDate, iso, nightsBetween, parseIso, today } from "./dates";
import { Logo, WhatsAppIcon } from "./icons";
import { adminApi, adminToken, DEMO_PASSWORD, demoStore, loadPublic, type BookingRequest, type Mode, type RequestStatus, type Settings } from "./store";

type Tab = "richieste" | "calendario" | "camere" | "impostazioni";
const roomName = (id: string) => baseRooms.find((r) => r.id === id)?.name.it ?? id;
const nightsOf = (a: string, b: string) => { const out: string[] = []; for (let d = parseIso(a); iso(d) < b; d = addDays(d, 1)) out.push(iso(d)); return out; };

export default function Admin() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [logged, setLogged] = useState(false);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [tab, setTab] = useState<Tab>("richieste");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [portalBusy, setPortalBusy] = useState<string[]>([]);
  const [synced, setSynced] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    document.title = "Pannello · " + site.name;
    setupPwa();
    loadPublic().then((d) => {
      setMode(d.mode);
      if (adminToken.get() && (d.mode === "live" || adminToken.get() === "demo")) setLogged(true);
    });
  }, []);

  useEffect(() => {
    if (!mode || !logged) return;
    adminApi.load(mode)
      .then((d) => { setSettings(d.settings); setRequests(d.requests); setPortalBusy(d.portalBusy); setSynced(d.synced); })
      .catch(() => { adminToken.clear(); setLogged(false); });
  }, [mode, logged]);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 1800); };

  const saveSettings = async (s: Settings, msg = "Salvato") => {
    if (!mode) return;
    setSettings(s);
    try { await adminApi.saveSettings(mode, s); flash(msg); } catch { flash("Errore nel salvataggio"); }
  };

  const updateRequest = async (id: string, status: RequestStatus) => {
    if (!mode || !settings) return;
    const list = requests.map((r) => (r.id === id ? { ...r, status } : r));
    setRequests(list);
    const changed = list.find((r) => r.id === id) ?? null;
    const emailed = await adminApi.saveRequests(mode, list, changed);
    const mail = emailed ? " · email inviata all'ospite" : "";
    if (changed && status === "confermata") {
      const blocked = [...new Set([...settings.blocked, ...nightsOf(changed.checkIn, changed.checkOut)])].sort();
      await saveSettings({ ...settings, blocked }, "Confermata · date chiuse" + mail);
    } else flash((status === "rifiutata" ? "Richiesta rifiutata" : "Aggiornato") + mail);
  };

  const removeRequest = async (id: string) => {
    if (!mode) return;
    const list = requests.filter((r) => r.id !== id);
    setRequests(list);
    await adminApi.saveRequests(mode, list, null, id);
    flash("Eliminata");
  };

  if (!mode) return <div className="adm-loading"><Logo size={48} /></div>;

  if (!logged) {
    return (
      <div className="adm-login">
        <form className="card adm-login-card" onSubmit={async (e) => {
          e.preventDefault(); setErr("");
          try { const e2 = await adminApi.login(mode, pw); if (!e2) setLogged(true); else setErr(e2); } catch { setErr("Server non raggiungibile"); }
        }}>
          <div className="adm-brand"><Logo size={44} /><div><b>{site.name}</b><small>Pannello del gestore</small></div></div>
          <label><span>Password</span><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus autoComplete="current-password" /></label>
          {err && <p className="warn">{err}</p>}
          <button className="btn" type="submit">Entra</button>
          {mode === "demo" && <p className="fine muted">Modalità demo · password: <b>{DEMO_PASSWORD}</b></p>}
          <a className="fine" href="#">← Torna al sito</a>
        </form>
      </div>
    );
  }

  if (!settings) return <div className="adm-loading"><Logo size={48} /></div>;
  const newCount = requests.filter((r) => r.status === "nuova").length;

  return (
    <div className="adm">
      <header className="adm-top">
        <div className="adm-top-in">
          <div className="adm-brand"><Logo size={34} /><div><b>Pannello</b><small>{site.name}</small></div></div>
          <div className="adm-actions">
            {mode === "demo" && <span className="badge-demo">Demo</span>}
            <a className="btn btn-sm btn-ghost" href="#">Vedi il sito</a>
            <button className="link-btn" onClick={() => { adminToken.clear(); setLogged(false); setPw(""); }}>Esci</button>
          </div>
        </div>
        <nav className="adm-tabs">
          {([["richieste", `Richieste${newCount ? ` (${newCount})` : ""}`], ["calendario", "Calendario"], ["camere", "Camere e prezzi"], ["impostazioni", "Impostazioni"]] as [Tab, string][])
            .map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}
        </nav>
      </header>

      <main className="adm-main">
        {tab === "richieste" && <Requests list={requests} onStatus={updateRequest} onRemove={removeRequest} />}
        {tab === "calendario" && <AdminCalendar settings={settings} portalBusy={portalBusy} synced={synced} requests={requests} onSave={saveSettings} />}
        {tab === "camere" && <RoomsEditor settings={settings} onSave={saveSettings} />}
        {tab === "impostazioni" && <SettingsEditor settings={settings} mode={mode} onSave={saveSettings} />}
      </main>
      {toast && <div className="adm-toast">{toast}</div>}
    </div>
  );
}

function Requests({ list, onStatus, onRemove }: { list: BookingRequest[]; onStatus: (id: string, s: RequestStatus) => void; onRemove: (id: string) => void }) {
  const [filter, setFilter] = useState<"tutte" | RequestStatus>("tutte");
  const shown = list.filter((r) => filter === "tutte" || r.status === filter).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <section>
      <div className="adm-head">
        <h2>Richieste di prenotazione</h2>
        <p className="muted">Ogni richiesta inviata dal sito ti arriva su WhatsApp e resta salvata qui. Quando confermi, le date si chiudono da sole sul calendario.</p>
      </div>
      <div className="adm-filter">
        {(["tutte", "nuova", "confermata", "rifiutata"] as const).map((f) => (
          <button key={f} className={filter === f ? "on" : ""} onClick={() => setFilter(f)}>{f === "tutte" ? "Tutte" : f[0].toUpperCase() + f.slice(1)}</button>
        ))}
      </div>
      {!shown.length && <div className="card adm-empty">Nessuna richiesta {filter !== "tutte" ? filter : ""}.</div>}
      <div className="adm-list">
        {shown.map((r) => {
          const n = nightsBetween(r.checkIn, r.checkOut);
          return (
            <article key={r.id} className={`card req st-${r.status}`}>
              <div className="req-top">
                <div>
                  <b className="req-name">{r.name || "Ospite senza nome"}</b>
                  <small className="muted"> · ricevuta {new Date(r.createdAt).toLocaleString("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</small>
                </div>
                <span className={`chip st-${r.status}`}>{r.status}</span>
              </div>
              <div className="req-grid">
                <div><small>Date</small><b>{fmtDate(r.checkIn, "it")} → {fmtDate(r.checkOut, "it")}</b><span className="muted"> {n} {n === 1 ? "notte" : "notti"}</span></div>
                <div><small>Camera</small><b>{roomName(r.roomId)}</b></div>
                <div><small>Ospiti</small><b>{r.guests}</b></div>
                <div><small>Totale indicato</small><b>€ {r.total}</b></div>
              </div>
              {r.email && <p className="req-mail"><a href={`mailto:${r.email}`}>{r.email}</a></p>}
              {r.notes && <p className="req-notes">“{r.notes}”</p>}
              {r.lang === "en" && <p className="fine muted" style={{ textAlign: "left" }}>Ospite straniero (sito in inglese)</p>}
              <div className="req-actions">
                {r.status !== "confermata" && <button className="btn btn-sm" onClick={() => onStatus(r.id, "confermata")}>Conferma</button>}
                {r.status === "nuova" && <button className="btn btn-sm btn-ghost" onClick={() => onStatus(r.id, "rifiutata")}>Rifiuta</button>}
                {r.status !== "nuova" && <button className="btn btn-sm btn-ghost" onClick={() => onStatus(r.id, "nuova")}>Rimetti come nuova</button>}
                <button className="link-btn" onClick={() => onRemove(r.id)}>Elimina</button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function AdminCalendar({ settings, portalBusy, synced, requests, onSave }: { settings: Settings; portalBusy: string[]; synced: boolean; requests: BookingRequest[]; onSave: (s: Settings, m?: string) => void }) {
  const [offset, setOffset] = useState(0);
  const blocked = useMemo(() => new Set(settings.blocked), [settings.blocked]);
  const portal = useMemo(() => new Set(portalBusy), [portalBusy]);
  const confirmed = useMemo(() => {
    const m = new Map<string, string>();
    requests.filter((r) => r.status === "confermata").forEach((r) => nightsOf(r.checkIn, r.checkOut).forEach((d) => m.set(d, r.name)));
    return m;
  }, [requests]);
  const t0 = iso(today());
  const base = today();
  const next30 = Array.from({ length: 30 }, (_, i) => iso(addDays(base, i)));
  const occ = next30.filter((d) => blocked.has(d) || portal.has(d)).length;

  const toggle = (d: string) => {
    const s = new Set(settings.blocked);
    if (s.has(d)) s.delete(d); else s.add(d);
    onSave({ ...settings, blocked: [...s].sort() }, s.has(d) ? "Data chiusa" : "Data riaperta");
  };

  const monthsToShow = [0, 1].map((k) => new Date(base.getFullYear(), base.getMonth() + offset + k, 1));
  return (
    <section>
      <div className="adm-head">
        <h2>Calendario</h2>
        <p className="muted">Tocca un giorno per <b>chiuderlo</b> (non prenotabile dal sito) o riaprirlo. Le notti prese su Booking e Airbnb arrivano da sole se colleghi i calendari in Impostazioni.</p>
      </div>
      <div className="adm-stats">
        <div className="card"><b>{occ}/30</b><small>notti occupate nei prossimi 30 giorni</small></div>
        <div className="card"><b>{Math.round((occ / 30) * 100)}%</b><small>tasso di occupazione</small></div>
        <div className="card"><b>{synced ? "Attivo" : "Non collegato"}</b><small>sincronizzazione Booking/Airbnb</small></div>
      </div>
      <div className="card adm-cal">
        <div className="cal-head">
          <button className="icon-btn" onClick={() => setOffset((o) => Math.max(0, o - 1))} disabled={offset === 0}>‹</button>
          <div className="adm-legend">
            <span><i className="lg portal" /> Booking/Airbnb</span>
            <span><i className="lg conf" /> Confermata dal sito</span>
            <span><i className="lg blk" /> Chiusa da te</span>
          </div>
          <button className="icon-btn" onClick={() => setOffset((o) => Math.min(11, o + 1))}>›</button>
        </div>
        <div className="cal-months">
          {monthsToShow.map((m) => {
            const lead = (m.getDay() + 6) % 7;
            const days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
            return (
              <div key={m.toISOString()} className="cal-month">
                <div className="cal-title">{months.it[m.getMonth()]} {m.getFullYear()}</div>
                <div className="cal-grid">
                  {["L", "M", "M", "G", "V", "S", "D"].map((w, i) => <div key={i} className="cal-wd">{w}</div>)}
                  {Array.from({ length: lead }, (_, i) => <div key={"x" + i} />)}
                  {Array.from({ length: days }, (_, i) => {
                    const d = iso(new Date(m.getFullYear(), m.getMonth(), i + 1));
                    const past = d < t0;
                    const cls = ["cal-day", "adm-day", past && "past", portal.has(d) && "portal", confirmed.has(d) && "conf", blocked.has(d) && !confirmed.has(d) && "blk"].filter(Boolean).join(" ");
                    return (
                      <button key={d} className={cls} disabled={past || (portal.has(d) && !blocked.has(d))} title={confirmed.get(d) || ""} onClick={() => toggle(d)}>
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function RoomsEditor({ settings, onSave }: { settings: Settings; onSave: (s: Settings, m?: string) => void }) {
  const [draft, setDraft] = useState(settings.rooms);
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings.rooms);
  const set = (id: string, patch: Partial<Settings["rooms"][number]>) => setDraft((d) => d.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  return (
    <section>
      <div className="adm-head">
        <h2>Camere e prezzi</h2>
        <p className="muted">Il prezzo è quello "da" mostrato sul sito e usato per la stima del totale. Puoi nascondere una camera senza cancellarla.</p>
      </div>
      <div className="adm-list">
        {draft.map((r) => {
          const b = baseRooms.find((x) => x.id === r.id);
          return (
            <div key={r.id} className={`card room-ed ${r.visible ? "" : "off"}`}>
              {b?.photo.src && <img src={b.photo.src} alt="" />}
              <div className="room-ed-body">
                <b>{b?.name.it}</b>
                <div className="room-ed-fields">
                  <label><span>Prezzo a notte (€)</span><input type="number" min={0} step={5} value={r.priceFrom} onChange={(e) => set(r.id, { priceFrom: Number(e.target.value) })} /></label>
                  <label><span>Ospiti max</span><input type="number" min={1} max={8} value={r.guests} onChange={(e) => set(r.id, { guests: Number(e.target.value) })} /></label>
                  <label className="switch"><input type="checkbox" checked={r.visible} onChange={(e) => set(r.id, { visible: e.target.checked })} /><span>Visibile sul sito</span></label>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="adm-save">
        <button className="btn" disabled={!dirty} onClick={() => onSave({ ...settings, rooms: draft }, "Prezzi aggiornati sul sito")}>Salva modifiche</button>
        {dirty && <button className="link-btn" onClick={() => setDraft(settings.rooms)}>Annulla</button>}
      </div>
    </section>
  );
}

function SettingsEditor({ settings, mode, onSave }: { settings: Settings; mode: Mode; onSave: (s: Settings, m?: string) => void }) {
  const [d, setD] = useState(settings);
  const [ical, setIcal] = useState(settings.icalUrls.join("\n"));
  const set = (p: Partial<Settings>) => setD((x) => ({ ...x, ...p }));
  const next = { ...d, icalUrls: ical.split(/\s+/).map((s) => s.trim()).filter(Boolean) };
  const dirty = JSON.stringify(next) !== JSON.stringify(settings);
  const cinOk = /^IT\d{6}[A-Z]\d[A-Z0-9]{5,10}$/.test(d.cin.trim());
  return (
    <section>
      <div className="adm-head">
        <h2>Impostazioni</h2>
        <p className="muted">Contatti, codice CIN, sconto per chi prenota dal sito e collegamento dei calendari.</p>
      </div>
      <Notifications mode={mode} hasOwnerEmail={!!settings.email} />
      <div className="card adm-form">
        <h3>Codice CIN</h3>
        <label><span>CIN (Codice Identificativo Nazionale)</span>
          <input value={d.cin} onChange={(e) => set({ cin: e.target.value.toUpperCase() })} placeholder="IT061022C1XXXXXXXX" />
        </label>
        {!cinOk && d.cin && <p className="warn">Il formato non sembra corretto: controlla il codice sulla Banca Dati Nazionale (BDSR).</p>}
        <label className="switch"><input type="checkbox" checked={d.cinIsDemo} onChange={(e) => set({ cinIsDemo: e.target.checked })} /><span>È un codice di prova (sul sito compare "di prova")</span></label>
        <p className="fine muted" style={{ textAlign: "left" }}>Il CIN deve essere esposto sul sito e negli annunci. Si ottiene dalla Banca Dati Nazionale delle Strutture Ricettive del Ministero del Turismo.</p>

        <h3>Contatti</h3>
        <div className="row2b">
          <label><span>Telefono (come appare)</span><input value={d.phoneDisplay} onChange={(e) => set({ phoneDisplay: e.target.value })} /></label>
          <label><span>Numero WhatsApp (solo cifre, con 39)</span><input inputMode="numeric" value={d.whatsapp} onChange={(e) => set({ whatsapp: e.target.value.replace(/\D/g, "") })} /></label>
        </div>
        <label><span>Email</span><input type="email" value={d.email} onChange={(e) => set({ email: e.target.value })} placeholder="info@..." /></label>

        <h3>Sconto prenotazione diretta</h3>
        <label><span>Percentuale (0 = nessuno sconto)</span>
          <input type="number" min={0} max={30} value={d.directDiscountPercent} onChange={(e) => set({ directDiscountPercent: Number(e.target.value) })} />
        </label>

        <h3>Calendari Booking e Airbnb</h3>
        <label><span>Link iCal (uno per riga)</span>
          <textarea rows={3} value={ical} onChange={(e) => setIcal(e.target.value)} placeholder="https://admin.booking.com/hotel/hoteladmin/ical.html?t=..." />
        </label>
        <p className="fine muted" style={{ textAlign: "left" }}>
          Booking: Extranet → Tariffe e disponibilità → Sincronizza calendari → Esporta.<br />
          Airbnb: Calendario → Disponibilità → Collega calendari → Esporta calendario.
          {mode === "demo" && <><br /><b>In modalità demo la sincronizzazione non è attiva.</b></>}
        </p>
      </div>
      <div className="adm-save">
        <button className="btn" disabled={!dirty} onClick={() => onSave(next, "Impostazioni salvate")}>Salva impostazioni</button>
        {mode === "demo" && <button className="link-btn" onClick={() => { demoStore.reset(); location.reload(); }}>Ripristina dati demo</button>}
      </div>
    </section>
  );
}

// ───────── app sul telefono (PWA) e notifiche ─────────
function setupPwa() {
  const add = (tag: string, attrs: Record<string, string>) => {
    const sel = `${tag}[${Object.entries(attrs).slice(0, 1).map(([k, v]) => `${k}="${v}"`).join("")}]`;
    if (document.head.querySelector(sel)) return;
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    document.head.appendChild(el);
  };
  add("link", { rel: "manifest", href: "./manifest-admin.webmanifest" });
  add("link", { rel: "apple-touch-icon", href: "./icons/apple-touch-icon.png" });
  add("meta", { name: "apple-mobile-web-app-capable", content: "yes" });
  add("meta", { name: "apple-mobile-web-app-title", content: "Pannello B&B" });
  add("meta", { name: "apple-mobile-web-app-status-bar-style", content: "default" });
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});
}

const urlB64ToUint8 = (b64: string) => {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

function Notifications({ mode, hasOwnerEmail }: { mode: Mode; hasOwnerEmail: boolean }) {
  const supported = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = window.matchMedia?.("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
  const [perm, setPerm] = useState<string>(supported ? Notification.permission : "unsupported");
  const [subscribed, setSubscribed] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supported) return;
    navigator.serviceWorker.ready.then((reg) => reg.pushManager.getSubscription()).then((s) => setSubscribed(!!s)).catch(() => {});
  }, [supported]);

  const enable = async () => {
    setBusy(true); setMsg("");
    try {
      const p = await Notification.requestPermission();
      setPerm(p);
      if (p !== "granted") { setMsg("Permesso negato: riattivalo dalle impostazioni del telefono."); return; }
      const reg = await navigator.serviceWorker.register("./sw.js");
      await navigator.serviceWorker.ready;
      if (mode === "demo") { await reg.showNotification("Notifiche attive (demo)", { body: "Online riceverai un avviso a ogni nuova richiesta.", icon: "./icons/icon-192.png" }); setSubscribed(true); return; }
      const key = await adminApi.pushKey();
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8(key) }));
      await adminApi.pushSubscribe(sub.toJSON());
      setSubscribed(true);
      setMsg("Fatto: riceverai una notifica a ogni nuova richiesta.");
    } catch { setMsg("Non è stato possibile attivare le notifiche su questo dispositivo."); }
    finally { setBusy(false); }
  };

  const test = async () => {
    setBusy(true); setMsg("");
    try {
      if (mode === "demo") { const reg = await navigator.serviceWorker.ready; await reg.showNotification("Nuova richiesta di prenotazione", { body: "Marco · 2 notti · Camera Matrimoniale (prova)", icon: "./icons/icon-192.png" }); return; }
      const n = await adminApi.pushTest();
      setMsg(n ? `Notifica inviata a ${n} ${n === 1 ? "dispositivo" : "dispositivi"}.` : "Nessun dispositivo iscritto: attiva prima le notifiche.");
    } catch { setMsg("Invio non riuscito."); } finally { setBusy(false); }
  };

  const testEmail = async () => {
    setBusy(true); setMsg("");
    try {
      const r = await adminApi.emailTest();
      setMsg(r.ok ? `Email di prova inviata a ${r.to}.` : r.error || "Invio non riuscito.");
    } catch { setMsg("Invio non riuscito."); } finally { setBusy(false); }
  };

  return (
    <div className="card adm-form" style={{ marginBottom: 14 }}>
      <h3>Notifiche sul telefono</h3>
      {!supported && !isIos && <p className="muted">Questo browser non supporta le notifiche. Usa Chrome su Android o Safari su iPhone.</p>}
      {isIos && !standalone && (
        <div className="howto">
          <b>Su iPhone, prima aggiungi il pannello alla schermata Home:</b>
          <ol><li>Tocca il tasto <b>Condividi</b> di Safari (il quadrato con la freccia)</li><li>Scegli <b>Aggiungi alla schermata Home</b></li><li>Apri il pannello dalla nuova icona e torna qui</li></ol>
        </div>
      )}
      {supported && (
        <>
          <p className="muted">{subscribed && perm === "granted" ? "Questo dispositivo riceve una notifica a ogni nuova richiesta." : "Attivale su questo telefono per sapere subito quando arriva una richiesta."}</p>
          <div className="req-actions">
            {!(subscribed && perm === "granted") && <button className="btn btn-sm" disabled={busy} onClick={enable}>Attiva notifiche</button>}
            {subscribed && perm === "granted" && <button className="btn btn-sm btn-ghost" disabled={busy} onClick={test}>Invia notifica di prova</button>}
          </div>
        </>
      )}
      {!isIos && !standalone && supported && <p className="fine muted" style={{ textAlign: "left" }}>Consiglio: dal menu del browser scegli "Installa app" o "Aggiungi a schermata Home" per avere il pannello come un'app.</p>}

      <h3>Email</h3>
      <p className="muted">
        Ogni richiesta ti arriva anche via email{hasOwnerEmail ? "" : " (inserisci la tua email qui sotto, in Contatti)"}. L'ospite riceve un'email quando invia la richiesta e quando la confermi o la rifiuti.
      </p>
      {mode === "live" ? <div className="req-actions"><button className="btn btn-sm btn-ghost" disabled={busy} onClick={testEmail}>Invia email di prova a me</button></div>
        : <p className="fine muted" style={{ textAlign: "left" }}>In modalità demo le email non vengono inviate.</p>}
      {msg && <p className="adm-msg">{msg}</p>}
    </div>
  );
}
