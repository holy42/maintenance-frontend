import type { StatutProbleme } from "../api/types";

/** Miroir de TRANSITIONS_MANUELLES du backend (services/problemes.py), pour ne proposer que les statuts valides.
 *  À tenir synchronisé avec le backend : celui-ci reste la référence et refuse toute transition invalide. */
export const TRANSITIONS_MANUELLES: Record<StatutProbleme, StatutProbleme[]> = {
  nouveau: ["a_analyser", "confirme", "faux_positif"],
  a_analyser: ["confirme", "faux_positif"],
  confirme: ["en_cours", "faux_positif"],
  faux_positif: ["a_analyser"],
  rouvert: ["en_cours"],
  teste: ["termine"],
  termine: ["rouvert"],
  en_cours: [],
  a_tester: [],
};

/** Miroir des transitions de tâche et de sous-tâche du backend (services/taches.py). */
export const TRANSITIONS_TACHE: Record<string, string[]> = {
  a_faire: ["en_cours"],
  en_pause: ["en_cours", "arretee"],
  en_cours: ["en_pause", "arretee", "terminee"],
  arretee: [],
  terminee: [],
};
