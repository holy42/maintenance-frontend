export function dateHeure(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

export function date(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR");
}

export function pourcent(valeur: number | string | null | undefined): number | null {
  if (valeur === null || valeur === undefined) return null;
  return Math.round(Number(valeur) * 100);
}

export function enRetard(echeance: string | null, statut: string): boolean {
  if (!echeance || statut === "terminee" || statut === "arretee") return false;
  return new Date(echeance) < new Date(new Date().toDateString());
}

/** Convertit « a, b ,c » en ["a","b","c"]. */
export function liste(texte: string): string[] {
  return texte.split(",").map((s) => s.trim()).filter(Boolean);
}

/** Durée (secondes ou durée ISO 8601 renvoyée par l'API) exprimée en jours. */
export function dureeEnJours(valeur: number | string | null | undefined): string {
  if (valeur === null || valeur === undefined) return "—";
  let secondes = 0;
  if (typeof valeur === "number") secondes = valeur;
  else {
    const m = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:([\d.]+)S)?)?$/.exec(valeur);
    if (!m) return valeur;
    secondes = Number(m[1] ?? 0) * 86400 + Number(m[2] ?? 0) * 3600 + Number(m[3] ?? 0) * 60 + Number(m[4] ?? 0);
  }
  return `${(secondes / 86400).toFixed(1).replace(".", ",")} j`;
}
