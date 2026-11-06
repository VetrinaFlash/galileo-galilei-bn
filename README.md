# B&B Galileo Galilei – sito di prenotazione diretta

Sito per il B&B Galileo Galilei (Via Galileo Galilei 12, Caserta), con pannello per il gestore. Realizzato da Daniele Zobel.

## Cosa c'è

**Sito pubblico**
- Camere con prezzi, servizi, galleria, posizione, FAQ, recensioni. Italiano e inglese.
- **Calendario disponibilità**: l'ospite sceglie le date, vede il totale con lo sconto per chi prenota diretto e **invia la richiesta su WhatsApp** già compilata. Nessun pagamento online.
- **CIN** nel footer, come richiede la legge.
- Barra fissa su mobile con WhatsApp e Prenota.

**Pannello gestore** (`/#admin`)
- **Richieste**: tutte le richieste arrivate dal sito. *Conferma* chiude da sola le date sul calendario.
- **Calendario**: tocca un giorno per chiuderlo o riaprirlo. Mostra le notti prese su Booking/Airbnb e il tasso di occupazione dei prossimi 30 giorni.
- **Camere e prezzi**: prezzo a notte, ospiti massimi, camera visibile o nascosta.
- **Impostazioni**: CIN, telefono, WhatsApp, email, sconto prenotazione diretta, link iCal di Booking/Airbnb.

**Email (Resend)**
- All'ospite: "richiesta ricevuta", poi "soggiorno confermato" o "date non disponibili". In italiano o in inglese, secondo la lingua usata sul sito.
- A Livia: un'email per ogni nuova richiesta, con il pulsante per aprire il pannello. Va all'email inserita in Impostazioni.

**Notifiche push e app sul telefono**
- Il pannello si installa come app ("Aggiungi a schermata Home"). Da Impostazioni → *Attiva notifiche* il telefono riceve un avviso a ogni nuova richiesta.
- Su iPhone le notifiche funzionano solo dopo aver aggiunto il pannello alla schermata Home (iOS 16.4 o successivo).
- Le chiavi per le notifiche si creano da sole nel database: non c'è niente da configurare.

**Modalità demo**: senza server (es. anteprima statica) tutto funziona salvando i dati nel browser. Password demo del pannello: `galileo`.

## Sicurezza

- **Pannello**: password solo in Cloudflare (`ADMIN_PASSWORD`, Secret, **minimo 10 caratteri**). Il login permette al massimo 8 tentativi ogni 15 minuti per IP e confronta la password a tempo costante. L'accesso dura 30 giorni: **cambiando la password, tutti i dispositivi vengono disconnessi**.
- **Modulo prenotazione**: campo trappola anti-bot, massimo 6 richieste all'ora per IP, massimo 3 email al giorno verso lo stesso indirizzo (il modulo non può essere usato per mandare spam), date e camere controllate dal server.
- **Impostazioni**: il server salva solo i campi previsti, con valori controllati. I link iCal non vengono mai mostrati al pubblico.
- **Intestazioni di sicurezza** (`public/_headers`): CSP restrittiva, HSTS, niente iframe, nosniff. Le API private non vengono mai salvate in cache.
- **Privacy**: consenso obbligatorio nel modulo, informativa in `src/Privacy.tsx` (**completare il nome del titolare**), richieste cancellate da sole dopo 24 mesi.
- **Mai** mettere password o chiavi nel codice: vanno solo nelle variabili di Cloudflare.

## Contenuti

- **Foto e logo**: trascina i file in `src/photos/` con i nomi indicati in [`src/photos/LEGGIMI.md`](src/photos/LEGGIMI.md) (`facciata.jpg`, `matrimoniale.jpg`, …, `logo.png`) e fai push. Le foto mancanti restano come illustrazioni di prova.
- Testi e descrizioni: `src/content.ts`
- Prezzi, CIN, contatti, sconto e date chiuse: **dal pannello** `/#admin`
- **CIN**: quello iniziale è **di prova**. Inserisci quello vero dal pannello e togli la spunta "codice di prova".

## Sviluppo

```bash
npm install
npm run dev      # http://localhost:5173  ·  pannello: http://localhost:5173/#admin
npm run build    # output in dist/
```

## Pubblicazione su Cloudflare Pages

1. Workers & Pages → Create → Pages → collega questo repository, **production branch `main`**.
   Build command `npm run build`, output `dist`.
2. Workers & Pages → D1 → Create database `galileo-galilei-bnb`. **Le tabelle si creano da sole** alla prima visita, non serve eseguire `schema.sql`.
3. Progetto Pages → Settings → Bindings → D1 database: variabile **`DB`** → `galileo-galilei-bnb`.
4. Settings → Variables and Secrets → **`ADMIN_PASSWORD`** (tipo Secret): la password di Livia per il pannello.
5. Per le email (resend.com, gratis fino a 3.000 email al mese):
   - **`RESEND_API_KEY`** (Secret): la chiave API di Resend
   - **`EMAIL_FROM`**: il mittente, es. `B&B Galileo Galilei <prenotazioni@bbgalileogalilei.it>`. Il dominio va verificato su Resend (Domains → Add domain, poi i record DNS su Cloudflare).
   - Finché il dominio non è verificato, Resend consegna solo all'email del proprio account: va bene per i test.
   - Opzionale **`OWNER_EMAIL`**: dove ricevere gli avvisi (altrimenti si usa l'email delle Impostazioni del pannello).
6. Deployments → Retry deployment, perché le impostazioni valgono dal deploy successivo.
7. Collega il dominio, es. `bbgalileogalilei.it`.

Senza binding `DB` il sito funziona lo stesso, in modalità demo.

API (cartella `functions/`):

| Rotta | Uso |
|---|---|
| `GET /api/config` | impostazioni pubbliche e notti occupate (iCal + chiuse a mano) |
| `POST /api/requests` | salva una richiesta di prenotazione |
| `POST /api/admin/login` | login del pannello |
| `GET /api/admin/data` | impostazioni, richieste e calendari |
| `PUT /api/admin/settings` | salva le impostazioni |
| `PATCH/DELETE /api/admin/requests/:id` | cambia stato (e manda l'email all'ospite) o elimina |
| `GET /api/admin/push/key` · `POST /api/admin/push/subscribe` · `POST /api/admin/push/test` | notifiche push |
| `POST /api/admin/email-test` | email di prova a Livia |
