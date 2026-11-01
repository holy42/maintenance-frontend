import { api, donnees } from "./client";
import type { ApercuFiabilite, Id, ModeleFiabiliteVersion } from "./types";

/** Administration du modèle de fiabilité (réservé à l'administrateur). Étape 3 : preuves de l'analyse ; étape 6 : solutions de Gemini. */
export const apercuFiabilite = () => donnees<ApercuFiabilite[]>(api.get("/fiabilite/apercu"));
export const listModelesFiabilite = () => donnees<ModeleFiabiliteVersion[]>(api.get("/fiabilite/modeles"));
export const entrainerModeleFiabilite = (etape: 3 | 6, algorithme: "auto" | "logistique" | "foret") =>
  donnees<ModeleFiabiliteVersion>(api.post("/fiabilite/modeles/entrainer", { etape, algorithme }));
export const activerModeleFiabilite = (id: Id) => donnees<ModeleFiabiliteVersion>(api.post(`/fiabilite/modeles/${id}/activer`));

/** Télécharge le jeu de données étiqueté (CSV) : utilisable avec `python -m app.fiabilite.cli comparer`. */
export async function telechargerJeuDonnees(etape: 3 | 6): Promise<void> {
  const r = await api.get("/fiabilite/jeu-donnees", { params: { etape }, responseType: "blob" });
  const url = URL.createObjectURL(r.data as Blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fiabilite_etape${etape}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
