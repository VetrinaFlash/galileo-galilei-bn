// Foto vere: basta mettere un file in src/photos con uno di questi nomi
// (estensione .jpg, .jpeg, .png o .webp) e fare push. Se manca, si usa l'illustrazione di prova.
//
//   facciata · matrimoniale · tripla · terrazza · bagno · colazione · salotto · giardino · logo

const files = import.meta.glob("./photos/*.{jpg,jpeg,png,webp,svg,JPG,JPEG,PNG,WEBP}", { eager: true, query: "?url", import: "default" }) as Record<string, string>;

const byName: Record<string, string> = {};
for (const [path, url] of Object.entries(files)) {
  const name = path.split("/").pop()!.replace(/\.[^.]+$/, "").toLowerCase();
  byName[name] = url;
}

/** foto vera se presente, altrimenti illustrazione di prova */
export const photo = (name: string) => byName[name] ?? `photos/demo-${name}.svg`;
/** logo vero se presente (src/photos/logo.png|svg|...) */
export const realLogo: string | undefined = byName["logo"];
