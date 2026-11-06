# B&B Galileo Galilei – sito di prenotazione diretta

Sito per il B&B Galileo Galilei (Via Galileo Galilei 12, Caserta), con pannello per il gestore. Realizzato da VetrinaFlash.

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

**Modalità demo**: senza server (es. anteprima statica) tutto funziona salvando i dati nel browser. Password demo del pannello: `galileo`.

## Contenuti

- Testi, descrizioni e foto: `src/content.ts`
- Prezzi, CIN, contatti, sconto e date chiuse: dal pannello (in demo valgono i valori di `src/content.ts`)
- **Foto**: le `public/photos/demo-*.svg` sono **illustrazioni di prova**. Metti le foto vere in `public/photos/` (JPG, massimo 1600px di lato) e aggiorna i percorsi in `src/content.ts`.
- **CIN**: quello in `src/content.ts` è **di prova** (`cinIsDemo: true`). Inserisci quello vero dal pannello e togli la spunta "codice di prova".

## Sviluppo

```bash
npm install
npm run dev      # http://localhost:5173  ·  pannello: http://localhost:5173/#admin
npm run build    # output in dist/
```

## Pubblicazione su Cloudflare Pages (con pannello reale)

```bash
npx wrangler d1 create galileo-galilei-bnb          # copia l'id in wrangler.toml
npx wrangler d1 execute galileo-galilei-bnb --remote --file=schema.sql
```

1. Cloudflare → Workers & Pages → Create → Pages → collega questo repository.
   Build command `npm run build`, output `dist`.
2. Settings → Bindings → D1 database: variabile **`DB`** → `galileo-galilei-bnb`.
3. Settings → Variables and Secrets → **`ADMIN_PASSWORD`** (tipo Secret): la password di Livia per il pannello.
4. Collega il dominio, es. `bbgalileogalilei.it`.
5. Livia entra su `/#admin` e incolla i link iCal di Booking e Airbnb in Impostazioni.

API (cartella `functions/`):

| Rotta | Uso |
|---|---|
| `GET /api/config` | impostazioni pubbliche e notti occupate (iCal + chiuse a mano) |
| `POST /api/requests` | salva una richiesta di prenotazione |
| `POST /api/admin/login` | login del pannello |
| `GET /api/admin/data` | impostazioni, richieste e calendari |
| `PUT /api/admin/settings` | salva le impostazioni |
| `PATCH/DELETE /api/admin/requests/:id` | cambia stato o elimina una richiesta |
