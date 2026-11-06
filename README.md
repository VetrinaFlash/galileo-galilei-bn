# B&B Galileo Galilei – sito di prenotazione diretta

Sito per il B&B Galileo Galilei (Via Galileo Galilei 12, Caserta). Realizzato da VetrinaFlash.

- **Vite + React + TypeScript**, sito statico veloce
- **Richiesta di prenotazione su WhatsApp**: l'ospite sceglie date, camera e ospiti, e il messaggio arriva già compilato a Livia. Nessun pagamento online.
- **Calendario sincronizzato** con Booking e Airbnb tramite iCal (Cloudflare Pages Function in `functions/api/availability.ts`)
- **Italiano / inglese**
- **CIN** nel footer, come richiede la legge
- Sconto per chi prenota direttamente (configurabile)

## Personalizzare

Tutti i testi, i prezzi e le foto stanno in **`src/content.ts`**. Le voci da verificare con la struttura sono segnate `DA CONFERMARE`.

### Foto
1. Copia le foto in `public/photos/` (es. `camera-matrimoniale.jpg`). JPG da massimo 1600px di lato, meglio sotto i 400 KB.
2. In `src/content.ts` imposta `src: "photos/camera-matrimoniale.jpg"` nella foto giusta (hero, camere, galleria).
3. Senza `src` il sito mostra un segnaposto elegante.

### Logo
Il monogramma "GG" è in `src/icons.tsx` (`Logo`). Per usare il logo vero, mettilo in `public/logo.svg` (o `.png`) e sostituisci il componente.

## Sviluppo

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # output in dist/
```

## Pubblicazione su Cloudflare Pages

1. Cloudflare → Workers & Pages → Create → Pages → collega questo repository
2. Build command: `npm run build` · Output directory: `dist`
3. Settings → Environment variables → `ICAL_URLS` = link iCal di Booking e Airbnb separati da virgola
   - Booking: Extranet → Tariffe e disponibilità → Sincronizza calendari → Esporta
   - Airbnb: Calendario → Disponibilità → Collega calendari → Esporta
4. Collega il dominio (es. `bbgalileogalilei.it`)

Senza `ICAL_URLS` il calendario mostra date dimostrative.
