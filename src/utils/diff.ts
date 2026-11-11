/** Lecture d'un diff unifié proposé par l'IA : où modifier (fichier, ligne) et quel code COPIER (sans l'ancien code). */

export interface Bloc { ligneDebut: number | null; lignes: string[] }          // `lignes` = nouvelle version du bloc
export interface DiffLu { fichier: string | null; blocs: Bloc[] }

const nettoyer = (chemin: string) => chemin.trim().split("\t")[0].replace(/^[ab]\//, "");

export function lireDiff(diff: string): DiffLu {
  let fichier: string | null = null;
  const blocs: Bloc[] = [];
  let courant: Bloc | null = null;
  for (const l of diff.replace(/\r\n/g, "\n").split("\n")) {
    if (l.startsWith("+++ ")) {                                   // en-tête du fichier modifié
      const c = nettoyer(l.slice(4));
      if (c && c !== "/dev/null") fichier = c;
      courant = null;
    } else if (l.startsWith("--- ") || l.startsWith("diff --git") || l.startsWith("index ")) {
      continue;                                                    // en-têtes : jamais copiés
    } else if (l.startsWith("@@")) {
      const m = /\+(\d+)/.exec(l);
      courant = { ligneDebut: m ? Number(m[1]) : null, lignes: [] };
      blocs.push(courant);
    } else {
      if (!courant) { courant = { ligneDebut: null, lignes: [] }; blocs.push(courant); }
      if (l.startsWith("-")) continue;                             // ancien code (l'erreur) : jamais copié
      courant.lignes.push(l.startsWith("+") ? l.slice(1) : l.startsWith(" ") ? l.slice(1) : l);
    }
  }
  return { fichier, blocs: blocs.filter((b) => b.lignes.some((x) => x.trim() !== "")) };
}

/** Le texte à coller : uniquement la NOUVELLE version du code (lignes inchangées + lignes ajoutées). */
export function codeACopier(diff: string): string {
  const { blocs } = lireDiff(diff);
  return blocs.map((b) => b.lignes.join("\n").replace(/\n+$/, "")).join("\n\n");
}

/** Phrase « où corriger » : d'abord ce que dit le diff, sinon le fichier/la ligne du problème. */
export function ouCorriger(diff: string | null, fichierProbleme: string | null, ligneProbleme: number | null): string | null {
  const d = diff ? lireDiff(diff) : null;
  const fichier = d?.fichier ?? fichierProbleme;
  if (!fichier) return null;
  const ligne = d?.blocs[0]?.ligneDebut ?? ligneProbleme;
  return ligne ? `${fichier} — à partir de la ligne ${ligne}` : fichier;
}