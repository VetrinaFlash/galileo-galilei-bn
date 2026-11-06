// Date in formato "YYYY-MM-DD" (giorno locale, senza fusi orari)
export const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const parseIso = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (d: Date, n: number) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
};

export const today = () => {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
};

export const nightsBetween = (a: string, b: string) =>
  Math.round((parseIso(b).getTime() - parseIso(a).getTime()) / 86400000);

/** notti occupate tra arrivo (incluso) e partenza (esclusa) */
export const rangeHasBusy = (a: string, b: string, busy: Set<string>) => {
  for (let d = parseIso(a); iso(d) < b; d = addDays(d, 1)) if (busy.has(iso(d))) return true;
  return false;
};

export const fmtDate = (s: string, lang: "it" | "en") =>
  parseIso(s).toLocaleDateString(lang === "it" ? "it-IT" : "en-GB", { weekday: "short", day: "numeric", month: "short" });

/** Occupazione dimostrativa, usata solo se il calendario reale non è collegato */
export const demoBusy = (): string[] => {
  const out: string[] = [];
  const start = today();
  const blocks = [[3, 2], [9, 3], [17, 2], [24, 4], [33, 2], [41, 3], [52, 2]];
  for (const [off, len] of blocks) for (let i = 0; i < len; i++) out.push(iso(addDays(start, off + i)));
  return out;
};
