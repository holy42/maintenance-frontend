export type CouleurChip = "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning";

const L = {
  statutProbleme: { nouveau: "Nouveau", a_analyser: "À analyser", confirme: "Confirmé", faux_positif: "Faux positif", en_cours: "En cours",
    a_tester: "À tester", teste: "Testé", termine: "Terminé", rouvert: "Rouvert" },
  statutTache: { a_faire: "À faire", en_cours: "En cours", en_pause: "En pause", arretee: "Arrêtée", terminee: "Terminée" },
  statutSession: { a_tester: "À tester", en_cours: "En cours", valide: "Validé", non_valide: "Non validé" },
  statutVerification: { en_attente: "En attente", en_cours: "En cours", terminee: "Terminée", echouee: "Échouée" },
  statutApplication: { active: "Active", en_maintenance: "En maintenance", archivee: "Archivée" },
  statutCritere: { brouillon: "Brouillon", valide: "Validé", actif: "Actif", inactif: "Inactif", obsolete: "Obsolète" },
  categorie: { erreur_technique: "Erreur technique", fonctionnel: "Fonctionnel", nouvelle_fonctionnalite: "Nouvelle fonctionnalité",
    regression: "Régression", securite: "Sécurité", propre_application: "Propre à l'application" },
  gravite: { critique: "Critique", elevee: "Élevée", moyenne: "Moyenne", faible: "Faible" },
  priorite: { urgente: "Urgente", haute: "Haute", normale: "Normale", basse: "Basse" },
  source: { outil: "Outil", ia: "Hypothèse de l'IA", humain: "Humain" },
  validation: { non_valide: "Non validé", confirme: "Confirmé", ecarte: "Écarté" },
  automatisabilite: { automatisable: "Automatisable", partielle: "Partielle", humaine: "Validation humaine", a_determiner: "À déterminer" },
  modeVerification: { test_auto: "Test automatisé", regle_statique: "Règle statique", assistee_ia: "Assistée par l'IA", manuelle: "Manuelle" },
  typeDecision: { ia_retenue: "Solution de l'IA retenue", ia_adaptee: "Solution de l'IA adaptée", autre_solution: "Autre solution",
    sans_ia: "Sans tenir compte de l'IA" },
  utilite: { utile: "Utile", partiellement_utile: "Partiellement utile", ignoree: "Ignorée", autre_appliquee: "Autre solution appliquée",
    incorrecte: "Incorrecte", non_traitee: "Non traitée" },
  motifNonUtilisation: { pas_utile: "Pas utile", fausse: "Fausse", autre_trouvee: "J'ai trouvé autre chose" },
  typeNote: { note_interne: "Note interne de suivi", commentaire_correction: "Commentaire de correction" },
  evenement: {
    probleme_cree: "Problème créé", probleme_critique: "Problème critique", probleme_assigne: "Problème assigné",
    probleme_rouvert: "Problème rouvert", statut_modifie: "Changement de statut", tache_assignee: "Tâche assignée",
    commentaire_ajoute: "Nouveau commentaire", mention: "Mention", reponse_discussion: "Réponse à un message",
    verification_terminee: "Vérification terminée", echeance_proche: "Échéance proche",
    nouvelle_recommandation_ia: "Nouvelle recommandation de l'IA", decision_enregistree: "Décision enregistrée",
    test_demande: "Test demandé", test_valide: "Test validé", test_non_valide: "Test non validé",
  },
} satisfies Record<string, Record<string, string>>;

export type GroupeLibelle = keyof typeof L;

export function libelle(groupe: GroupeLibelle, valeur?: string | null): string {
  if (!valeur) return "—";
  return (L[groupe] as Record<string, string>)[valeur] ?? valeur;
}

export function options(groupe: GroupeLibelle): { valeur: string; libelle: string }[] {
  return Object.entries(L[groupe]).map(([valeur, lib]) => ({ valeur, libelle: lib }));
}

const COULEURS: Partial<Record<GroupeLibelle, Record<string, CouleurChip>>> = {
  statutProbleme: { nouveau: "info", a_analyser: "info", confirme: "warning", faux_positif: "default", en_cours: "primary",
    a_tester: "warning", teste: "success", termine: "success", rouvert: "error" },
  statutTache: { a_faire: "default", en_cours: "primary", en_pause: "warning", arretee: "default", terminee: "success" },
  statutSession: { a_tester: "warning", en_cours: "primary", valide: "success", non_valide: "error" },
  statutVerification: { en_attente: "default", en_cours: "info", terminee: "success", echouee: "error" },
  statutApplication: { active: "success", en_maintenance: "warning", archivee: "default" },
  statutCritere: { brouillon: "default", valide: "info", actif: "success", inactif: "default", obsolete: "default" },
  gravite: { critique: "error", elevee: "warning", moyenne: "info", faible: "default" },
  validation: { non_valide: "default", confirme: "success", ecarte: "default" },
  automatisabilite: { automatisable: "success", partielle: "warning", humaine: "info", a_determiner: "default" },
};

export function couleur(groupe: GroupeLibelle, valeur?: string | null): CouleurChip {
  return (valeur && COULEURS[groupe]?.[valeur]) || "default";
}

/** Types d'événements de notification que l'utilisateur peut activer ou non. */
export const TYPES_NOTIFICATION = Object.keys(L.evenement);
