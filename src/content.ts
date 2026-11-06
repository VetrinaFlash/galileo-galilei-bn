// ─────────────────────────────────────────────────────────────
//  TUTTI I CONTENUTI DEL SITO STANNO QUI.
//  Per personalizzare: cambia testi, prezzi e foto in questo file.
//  Le voci con "DA CONFERMARE" vanno verificate con Livia.
// ─────────────────────────────────────────────────────────────

export type Lang = "it" | "en";
export type T = { it: string; en: string };

export type Photo = {
  /** percorso in /public/photos, es. "photos/camera-1.jpg". Vuoto = segnaposto */
  src?: string;
  alt: T;
};

export type Room = {
  id: string;
  name: T;
  description: T;
  guests: number;
  /** prezzo indicativo a notte in euro (DA CONFERMARE) */
  priceFrom: number;
  features: T[];
  photo: Photo;
};

export const site = {
  name: "B&B Galileo Galilei",
  shortName: "Galileo Galilei",
  host: "Livia",
  phoneDisplay: "+39 339 264 4177",
  phoneTel: "+393392644177",
  whatsapp: "393392644177",
  email: "", // DA CONFERMARE
  address: "Via Galileo Galilei, 12 · 81100 Caserta (CE)",
  mapsQuery: "B&B Galileo Galilei, Via Galileo Galilei 12, Caserta",
  /** Codice Identificativo Nazionale, obbligatorio sul sito.
   *  QUESTO È UN CIN DI PROVA: sostituirlo con quello vero prima di andare online. */
  cin: "IT061022C1A7KX93PQ",
  cinIsDemo: true,
  checkIn: "15:00",
  checkOut: "11:00",
  /** sconto per chi prenota direttamente (0 per nasconderlo). DA CONFERMARE con Livia */
  directDiscountPercent: 10,
  rating: {
    score: "8,9",
    reviews: "400+",
    source: { it: "valutazione media degli ospiti sui portali di prenotazione", en: "average guest rating on booking platforms" },
  },
  /** link del profilo Google per le recensioni (opzionale) */
  googleReviewsUrl: "",
};

export const hero = {
  photo: { src: "photos/demo-facciata.svg", alt: { it: "Il palazzo storico del B&B Galileo Galilei", en: "The historic building of B&B Galileo Galilei" } } as Photo,
  eyebrow: { it: "Bed & Breakfast nel centro di Caserta", en: "Bed & Breakfast in the heart of Caserta" },
  title: { it: "A dodici minuti a piedi dalla Reggia.", en: "A twelve-minute walk from the Royal Palace." },
  subtitle: {
    it: "Camere curate in un palazzo storico, parcheggio privato e l'accoglienza di Livia. Prenota qui, direttamente con noi.",
    en: "Cosy rooms in a historic building, private parking and Livia's warm welcome. Book here, directly with us.",
  },
};

export const highlights: T[] = [
  { it: "12 min a piedi dalla Reggia", en: "12 min walk to the Royal Palace" },
  { it: "Parcheggio privato", en: "Private parking" },
  { it: "Animali benvenuti", en: "Pets welcome" },
];

export const whyDirect: { title: T; text: T }[] = [
  {
    title: { it: "Parli direttamente con Livia", en: "Talk directly to Livia" },
    text: {
      it: "Nessun call center: chiedi tutto quello che ti serve a chi ti accoglierà. Orari, parcheggio, consigli sulla città.",
      en: "No call centre: ask anything to the person who'll welcome you. Arrival times, parking, local tips.",
    },
  },
  {
    title: { it: "La tariffa più conveniente", en: "Our best rate" },
    text: {
      it: "Prenotando dal sito non ci sono intermediari: per questo qui trovi il prezzo migliore.",
      en: "Booking on our website means no middlemen: that's why you'll find our best price here.",
    },
  },
  {
    title: { it: "Risposta veloce, senza pagare online", en: "Quick reply, no online payment" },
    text: {
      it: "Mandi la richiesta in un minuto. Livia ti conferma disponibilità e prezzo su WhatsApp.",
      en: "Send your request in a minute. Livia confirms availability and price on WhatsApp.",
    },
  },
];

// DA CONFERMARE: tipologie, posti letto e prezzi sono di esempio.
export const rooms: Room[] = [
  {
    id: "matrimoniale",
    name: { it: "Camera Matrimoniale", en: "Double Room" },
    description: {
      it: "Luminosa e silenziosa, con letto matrimoniale e bagno privato con doccia.",
      en: "Bright and quiet, with a double bed and private bathroom with shower.",
    },
    guests: 2,
    priceFrom: 65,
    features: [
      { it: "Bagno privato", en: "Private bathroom" },
      { it: "Aria condizionata", en: "Air conditioning" },
      { it: "Smart TV", en: "Flat-screen TV" },
    ],
    photo: { src: "photos/demo-matrimoniale.svg", alt: { it: "Camera matrimoniale", en: "Double room" } },
  },
  {
    id: "tripla",
    name: { it: "Camera Tripla", en: "Triple Room" },
    description: {
      it: "Spaziosa, ideale per famiglie o amici. Letto matrimoniale più letto singolo.",
      en: "Spacious, perfect for families or friends. One double bed plus a single bed.",
    },
    guests: 3,
    priceFrom: 80,
    features: [
      { it: "Bagno privato", en: "Private bathroom" },
      { it: "Aria condizionata", en: "Air conditioning" },
      { it: "Macchina del caffè", en: "Coffee machine" },
    ],
    photo: { src: "photos/demo-tripla.svg", alt: { it: "Camera tripla", en: "Triple room" } },
  },
  {
    id: "terrazza",
    name: { it: "Camera con Terrazza", en: "Room with Terrace" },
    description: {
      it: "Con accesso alla terrazza, per la colazione all'aperto o un bicchiere di vino la sera.",
      en: "With terrace access, for breakfast outdoors or a glass of wine in the evening.",
    },
    guests: 2,
    priceFrom: 75,
    features: [
      { it: "Terrazza", en: "Terrace" },
      { it: "Bagno privato", en: "Private bathroom" },
      { it: "Aria condizionata", en: "Air conditioning" },
    ],
    photo: { src: "photos/demo-terrazza.svg", alt: { it: "Camera con terrazza", en: "Room with terrace" } },
  },
];

export type ServiceIcon = "wifi" | "ac" | "shower" | "tv" | "coffee" | "terrace" | "garden" | "lounge" | "parking" | "pet";

export const services: { icon: ServiceIcon; label: T }[] = [
  { icon: "wifi", label: { it: "Wi-Fi gratuito", en: "Free Wi-Fi" } },
  { icon: "ac", label: { it: "Aria condizionata", en: "Air conditioning" } },
  { icon: "shower", label: { it: "Bagno privato con doccia", en: "Private bathroom with shower" } },
  { icon: "tv", label: { it: "TV a schermo piatto", en: "Flat-screen TV" } },
  { icon: "coffee", label: { it: "Macchina del caffè", en: "Coffee machine" } },
  { icon: "terrace", label: { it: "Terrazza", en: "Terrace" } },
  { icon: "garden", label: { it: "Giardino", en: "Garden" } },
  { icon: "lounge", label: { it: "Salotto in comune", en: "Shared lounge" } },
  { icon: "parking", label: { it: "Parcheggio privato", en: "Private parking" } },
  { icon: "pet", label: { it: "Animali ammessi", en: "Pets allowed" } },
];

export const gallery: Photo[] = [
  { src: "photos/demo-facciata.svg", alt: { it: "Il palazzo", en: "The building" } },
  { src: "photos/demo-matrimoniale.svg", alt: { it: "Camera matrimoniale", en: "Double room" } },
  { src: "photos/demo-bagno.svg", alt: { it: "Bagno", en: "Bathroom" } },
  { src: "photos/demo-terrazza.svg", alt: { it: "Terrazza", en: "Terrace" } },
  { src: "photos/demo-colazione.svg", alt: { it: "Colazione", en: "Breakfast" } },
  { src: "photos/demo-salotto.svg", alt: { it: "Salotto comune", en: "Shared lounge" } },
  { src: "photos/demo-tripla.svg", alt: { it: "Camera tripla", en: "Triple room" } },
  { src: "photos/demo-giardino.svg", alt: { it: "Giardino", en: "Garden" } },
];

export const nearby: { place: T; distance: T }[] = [
  { place: { it: "Reggia di Caserta", en: "Royal Palace of Caserta" }, distance: { it: "12 min a piedi", en: "12 min walk" } },
  { place: { it: "Teatro Civico 14", en: "Teatro Civico 14" }, distance: { it: "a pochi passi", en: "a short walk" } },
  { place: { it: "Stazione di Caserta", en: "Caserta railway station" }, distance: { it: "circa 1 km", en: "about 1 km" } },
  { place: { it: "Belvedere di San Leucio", en: "San Leucio Belvedere" }, distance: { it: "circa 3 km", en: "about 3 km" } },
  { place: { it: "Aeroporto di Napoli", en: "Naples Airport" }, distance: { it: "circa 21 km", en: "about 21 km" } },
];

export const faq: { q: T; a: T }[] = [
  {
    q: { it: "A che ora è il check-in e il check-out?", en: "What are check-in and check-out times?" },
    a: {
      it: `Check-in dalle ${site.checkIn}, check-out entro le ${site.checkOut}. Se arrivi più tardi, scrivi a Livia e vi organizzate.`,
      en: `Check-in from ${site.checkIn}, check-out by ${site.checkOut}. Arriving late? Just message Livia.`,
    },
  },
  {
    q: { it: "C'è il parcheggio?", en: "Is there parking?" },
    a: { it: "Sì, il B&B ha un parcheggio privato per gli ospiti.", en: "Yes, the B&B has private parking for guests." },
  },
  {
    q: { it: "Posso portare il mio animale?", en: "Can I bring my pet?" },
    a: { it: "Sì, gli animali sono benvenuti. Segnalalo nella richiesta.", en: "Yes, pets are welcome. Just mention it in your request." },
  },
  {
    q: { it: "Come funziona la prenotazione dal sito?", en: "How does booking on the website work?" },
    a: {
      it: "Scegli le date e la camera, invii la richiesta su WhatsApp e Livia ti risponde con la conferma. Nessun pagamento online e nessun costo nascosto.",
      en: "Choose dates and room, send the request on WhatsApp and Livia replies with a confirmation. No online payment and no hidden fees.",
    },
  },
  {
    q: { it: "Come arrivo dalla stazione?", en: "How do I get there from the station?" },
    a: {
      it: "La stazione di Caserta è a circa 1 km: 15 minuti a piedi o pochi minuti in taxi.",
      en: "Caserta station is about 1 km away: a 15-minute walk or a few minutes by taxi.",
    },
  },
];
